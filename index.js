const fs = require('fs-extra')
const sf = require('sf')
const ProgressBar = require('progress')
const Excel = require('exceljs')
const plot = require('./src/plot')
const cache = require('./src/cache')
const md5File = require('md5-file')
const {
	spawn
} = require('child_process')

try{
	fs.removeSync('workspace')
}catch(e){}
fs.ensureDirSync('workspace')
fs.ensureDirSync('workspace/sounds')
fs.ensureDirSync('workspace/videos')

const input = 'luna_wonjun.mov'
const chunk_size = 0.03333333 // if null sec of 1 frame
const sounded_speed = 1 // if Infinity, skip
const silent_speed = Infinity // if Infinity, skip
let standard_db = -47 // if null, set to avg
const volume_round_range = 2
const sounded_round_range = 4
const volume_round_method = 3
const sounded_round_method = 1
const debug = true

start()

async function start() {
	const workbook = new Excel.Workbook()
	const worksheet = workbook.addWorksheet('log')

	for (let i = 1; i <= 6; i++) {
		worksheet.getColumn(i).width = 15
		worksheet.getColumn(i).alignment = {
			vertical: 'top',
			horizontal: 'left'
		}
	}



	console.log('1. Extract Sound by Chunk')
	let pb2 = makeProgressBar(2)
	pb2.tick()
	await ffmpeg(['-i', input,
		'-ab', '160k',
		'-ac', '2',
		'-ar', '44100',
		'-vn', 'workspace/sound.wav'
	])
	await ffmpeg(['-i', input,
		'-f', 'segment',
		'-segment_time', `${chunk_size}`,
		'workspace/sounds/%06d.wav'
	])
	pb2.tick()


	console.log('2. Get Volume of Each Chunk')
	let volumeList = []
	let soundFileList = fs.readdirSync('workspace/sounds')
	let pb3 = makeProgressBar(soundFileList.length)
	for (i in soundFileList) {
		const file = soundFileList[i]
		const path = 'workspace/sounds/' + file
		const hash = md5File.sync(path)

		volumeList[i] = Number(await cache.getOrSet(hash, async () => {
			return await meanVolume(path)
		}))

		pb3.tick()
	}
	plot.addVolume(volumeList)
	worksheet.getColumn(1).values = ['Volume'].concat(volumeList)


	let avg = average(volumeList)
	standard_db = standard_db || avg
	plot.setStandardDb(standard_db)

	volumeList = roundList(volumeList, volume_round_range, getOptFunc(volume_round_method))
	plot.addRoundedVolume(volumeList)
	worksheet.getColumn(2).values = ['Rounded Volume'].concat(volumeList)


	let soundedList = []
	for (i in volumeList)
		soundedList[i] = volumeList[i] > (standard_db)
	plot.addSounded(soundedList.map(data => data ? 1 : 0))
	worksheet.getColumn(3).values = ['Sounded'].concat(soundedList)

	soundedList = roundList(soundedList, sounded_round_range, getOptFunc(sounded_round_method))
	plot.addRoundingSounded(soundedList)
	worksheet.getColumn(4).values = ['Rounding Sounded'].concat(soundedList)

	soundedList = soundedList.map(data => data > 0.5)
	plot.addRoundedSounded(soundedList.map(data => data ? 1 : 0))
	worksheet.getColumn(5).values = ['Rounded Sounded'].concat(soundedList)

	plot.setVolumeRoundMethod(getOptFunc(volume_round_method))
	plot.setSoundedRoundMethod(getOptFunc(sounded_round_method))
	//plot.addOptionString(`chunk_size: ${chunk_size}`)
	//plot.addOptionString(`sounded_speed: ${sounded_speed}`)
	//plot.addOptionString(`silent_speed: ${silent_speed}`)
	plot.addOptionString(`standard_db: ${standard_db}`)
	plot.addOptionString(`volume_round_range: ${volume_round_range}`)
	//plot.addOptionString(`sounded_round_range: ${sounded_round_range}`)
	//plot.addOptionString(`volume_round_method: ${volume_round_method}`)
	//plot.addOptionString(`sounded_round_method: ${sounded_round_method}`)
	plot.show()
	await workbook.xlsx.writeFile('workspace/report.xlsx')


	let editWorkList = []
	//{start: 0, end: 1.4, sounded: true}
	let prevSounded = !soundedList[0]
	let prevSec = 0
	for (i in soundedList) {
		let sounded = soundedList[i]
		let sec = i * chunk_size

		if (sounded != prevSounded || soundedList.length - 1 == i) {
			editWorkList.push({
				start: prevSec,
				end: sec,
				sounded: prevSounded
			})

			prevSounded = sounded
			prevSec = sec
		}
	}
	editWorkList.shift()


	console.log('3. Reformat Video (mp4, keyframe)')
	let pb1 = makeProgressBar(2)
	pb1.tick()
	await ffmpeg(['-i', input,
		'-x264opts', 'keyint=1',
		'-preset', 'ultrafast',
		'-y', 'workspace/input.mp4'
	])
	pb1.tick()

	console.log('4. Split and Speeding Videos')
	let pb5 = makeProgressBar(editWorkList.length)
	for (i in editWorkList) {
		let editWork = editWorkList[i]
		let soundSpeed = editWork.sounded ? sounded_speed : silent_speed
		let videoSpeed = 1 / soundSpeed
		let t = (editWork.end - editWork.start) * videoSpeed
		if (soundSpeed != Infinity)
			await ffmpeg([
				'-ss', `${editWork.start}`,
				'-i', 'workspace/input.mp4',
				'-t', `${t}`,
				'-filter_complex', `[0:v]setpts=${videoSpeed}*PTS[v];[0:a]atempo=${soundSpeed}[a]`,
				'-map', '[v]',
				'-map', '[a]',
				'-y', `workspace/videos/${sf('{0:000000}', Number(i))}.mp4`
			])
		pb5.tick()
	}


	console.log('5. Merge All Part to One Video')
	let pb7 = makeProgressBar(2)
	pb7.tick()
	let videoFileList = fs.readdirSync('workspace/videos')
	let videoList = videoFileList.map((data) => {
		return `file ${data}`
	})
	fs.writeFileSync('workspace/videos/list.txt', videoList.join('\n'))

	await ffmpeg(['-f', 'concat',
		'-i', 'workspace/videos/list.txt',
		'-c', 'copy',
		'-y', `workspace/result.mp4`
	])
	pb7.tick()
}

function ffmpeg(params) {
	//console.log('\nffmpeg '+ params.join(' '))
	return new Promise((resolve, reject) => {
		const process = spawn('ffmpeg', params);
		let log = ''

		process.stdout.on('data', (data) => {
			//console.log(`stdout: ${data}`);
			log += `${data}\n`
		});

		process.stderr.on('data', (data) => {
			//console.error(`stderr: ${data}`);
			log += `${data}\n`
		});

		process.on('close', (code) => {
			//console.log(`child process exited with code ${code}`);
			if (code == 0)
				resolve(log)
			else
				reject(log)
		});
	})
}


function meanVolume(path) {
	return new Promise((resolve, reject) => {
		ffmpeg([
			'-i', path,
			'-af', 'volumedetect',
			'-f', 'null', '/dev/null'
		]).then(data => {
			let meanVolumeLog = data.match(/mean_volume:\s[-\d.\sdB]*/g);

			if (meanVolumeLog) {
				let meanVolumeString = meanVolumeLog[0].match(/[-\d.]{1,}/g)
				let meanVolume = parseFloat(meanVolumeString)
				resolve(meanVolume)
			} else
				reject('fail')
		}).catch(data => {
			reject('fail')
		})
	})
}

const average = arr => arr.reduce((p, c) => p + c, 0) / arr.length

function makeProgressBar(length) {
	const progressBar = new ProgressBar(`[:bar] :percent :current/:total :elapseds :etas`, {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: length
	})
	progressBar.tick(0)
	return progressBar
}

function getOptFunc(methodIndex) {
	let ret
	switch (methodIndex) {
		case 1:
			ret = optimizeFunction1
			break;
		case 2:
			ret = optimizeFunction2
			break;
		case 3:
			ret = optimizeFunction3
			break;
		default:
			ret = optimizeFunction0
			break;
	}
	return ret
}

function roundList(input, size, method) {
	let output = []
	for (let i = 0; i < input.length; i++) {
		let start = Math.max(i - size, 0)
		let end = Math.min(i + size, input.length - 1)
		let length = end - start + 1

		let maxTotal = 0
		for (let j = start; j <= end; j++) {
			let weight = (j - i) / size || 0
			maxTotal += optimizeValue(1, weight, method)
		}
		let maxAvg = maxTotal / length

		let total = 0
		for (let j = start; j <= end; j++) {
			let weight = (j - i) / size || 0
			total += optimizeValue(input[j], weight, method)
		}
		let avg = total / length * (1 / maxAvg)

		output[i] = avg
	}
	return output
}

function optimizeValue(value, weight, method) {
	return value * method(weight)
}

function optimizeFunction0(x) {
	return 1
}

function optimizeFunction1(x) {
	return (1 - Math.pow(x, 2))
}

function optimizeFunction2(x) {
	if (x < 0)
		return Math.sqrt(1 - Math.pow(x, 2))
	else
		return (x + 1) * Math.pow((x - 1), 6)
}

function optimizeFunction3(x) {
	if (x < 0)
		return Math.sqrt(1 - Math.pow(x, 2)) * (1 / 3 * x + 1)
	else if (x<0.9)
		return (x + 1) * Math.pow((x - 1), 4)
	else
		return 3
}