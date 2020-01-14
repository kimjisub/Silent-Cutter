const fs = require('fs-extra')
const sf = require('sf')
const ProgressBar = require('progress')
const Excel = require('exceljs')
const plot = require('./src/plot')
const cache = require('./src/cache')
const optimize = require('./src/optmize')
const md5File = require('md5-file')
const { spawn } = require('child_process')

let {
	input,
	output,
	chunk_size,
	sounded_speed,
	silent_speed,
	standard_db,
	volume_round_range,
	volume_round_method,
	sounded_round_range,
	sounded_round_method,
	debug
} = args = require('./src/args')()
console.log(args)

try{
	fs.removeSync('workspace')
}catch(e){}
fs.ensureDirSync('workspace')
fs.ensureDirSync('workspace/sounds')
fs.ensureDirSync('workspace/videos')

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
	for (let i in soundFileList) {
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

	volumeList = optimize.roundList(volumeList, volume_round_range, optimize.getOptFunc(volume_round_method))
	plot.addRoundedVolume(volumeList)
	worksheet.getColumn(2).values = ['Rounded Volume'].concat(volumeList)


	let soundedList = []
	for (let i in volumeList)
		soundedList[i] = volumeList[i] > (standard_db)
	plot.addSounded(soundedList.map(data => data ? 1 : 0))
	worksheet.getColumn(3).values = ['Sounded'].concat(soundedList)

	soundedList = optimize.roundList(soundedList, sounded_round_range, optimize.getOptFunc(sounded_round_method))
	plot.addRoundingSounded(soundedList)
	worksheet.getColumn(4).values = ['Rounding Sounded'].concat(soundedList)

	soundedList = soundedList.map(data => data > 0.5)
	plot.addRoundedSounded(soundedList.map(data => data ? 1 : 0))
	worksheet.getColumn(5).values = ['Rounded Sounded'].concat(soundedList)

	plot.setVolumeRoundMethod(optimize.getOptFunc(volume_round_method))
	plot.setSoundedRoundMethod(optimize.getOptFunc(sounded_round_method))
	//plot.addOptionString(`chunk_size: ${chunk_size}`)
	//plot.addOptionString(`sounded_speed: ${sounded_speed}`)
	//plot.addOptionString(`silent_speed: ${silent_speed}`)
	plot.addOptionString(`standard_db: ${standard_db}`)
	plot.addOptionString(`volume_round_range: ${volume_round_range}`)
	//plot.addOptionString(`sounded_round_range: ${sounded_round_range}`)
	//plot.addOptionString(`volume_round_method: ${volume_round_method}`)
	//plot.addOptionString(`sounded_round_method: ${sounded_round_method}`)
	if(debug) plot.show()
	await workbook.xlsx.writeFile('workspace/report.xlsx')


	let editWorkList = []
	//{start: 0, end: 1.4, sounded: true}
	let prevSounded = !soundedList[0]
	let prevSec = 0
	for (let i in soundedList) {
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
		'-y', 'workspace/keyedited.mp4'
	])
	pb1.tick()

	console.log('4. Split and Speeding Videos')
	let pb5 = makeProgressBar(editWorkList.length)
	for (let i in editWorkList) {
		let editWork = editWorkList[i]
		let soundSpeed = editWork.sounded ? sounded_speed : silent_speed
		let videoSpeed = 1 / soundSpeed
		let t = (editWork.end - editWork.start) * videoSpeed
		if (soundSpeed != Infinity)
			await ffmpeg([
				'-ss', `${editWork.start}`,
				'-i', 'workspace/keyedited.mp4',
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
	let videoList = videoFileList.map((data) => `file ${data}`)
	fs.writeFileSync('workspace/videos/list.txt', videoList.join('\n'))

	await ffmpeg(['-f', 'concat',
		'-i', 'workspace/videos/list.txt',
		'-c', 'copy',
		'-y', output
	])
	pb7.tick()
}

function ffmpeg(params) {
	//console.log('\nffmpeg '+ params.join(' '))
	return new Promise((resolve, reject) => {
		const process = spawn('ffmpeg', params)
		let log = ''

		process.stdout.on('data', (data) => {
			//console.log(`stdout: ${data}`);
			log += `${data}\n`
		})

		process.stderr.on('data', (data) => {
			//console.error(`stderr: ${data}`);
			log += `${data}\n`
		})

		process.on('close', (code) => {
			//console.log(`child process exited with code ${code}`);
			if (code == 0)
				resolve(log)
			else
				reject(log)
		})
	})
}


function meanVolume(path) {
	return new Promise((resolve, reject) => {
		ffmpeg([
			'-i', path,
			'-af', 'volumedetect',
			'-f', 'null', '/dev/null'
		]).then(data => {
			let meanVolumeLog = data.match(/mean_volume:\s[-\d.\sdB]*/g)

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
	const progressBar = new ProgressBar('[:bar] :percent :current/:total :elapseds :etas', {
		complete: '=',
		incomplete: ' ',
		width: 40,
		total: length
	})
	progressBar.tick(0)
	return progressBar
}