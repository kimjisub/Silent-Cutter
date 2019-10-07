
const fs = require('fs-extra')
const sf = require('sf')
const ProgressBar = require('progress')
const {
    spawn
} = require('child_process')

fs.ensureDirSync('workspace')
fs.ensureDirSync('workspace/sounds')
fs.ensureDirSync('workspace/videos')

const chunk_size = 0.1
const sounded_speed = 1
const silent_speed = 4

start()

async function start() {

    console.log('1. Convert video to mp4')
    let pb1 = makeProgressBar(1)
    await ffmpeg(['-i', 'input.mov', 
       '-y', 'workspace/1_input.mp4'])
    pb1.tick()


    console.log('2. Extract Sound by Chunk')
    let pb2 = makeProgressBar(1)
    await ffmpeg(['-i', 'workspace/1_input.mp4', 
        '-f', 'segment', 
        '-segment_time', `${chunk_size}`,
        'workspace/sounds/%06d.wav'])
    pb2.tick()


    console.log('3. Get Volume of Each Chunk')
    let volumeList = []
    let soundFileList = fs.readdirSync('workspace/sounds')
    let pb3 = makeProgressBar(soundFileList.length)
    for(i in soundFileList){
        let file = soundFileList[i]
        volumeList[i] = await meanVolume('workspace/sounds/' + file)
        pb3.tick()
    }
    console.log(volumeList.join(','))


    let avg = average(volumeList)
    console.log(`\Volume Avg: ${avg}`)


    let soundedList = []
    for(i in volumeList)
        soundedList[i] = volumeList[i] > avg
    console.log(soundedList.join(','))


    let editWorkList = []
    //{start: 0, end: 1.4, sounded: true}
    let prevSounded = !soundedList[0]
    let prevSec = 0
    for(i in soundedList){
        let sounded = soundedList[i]
        let sec = i * chunk_size

        if(sounded != prevSounded){
            editWorkList.push({start: prevSec, end: sec, sounded: prevSounded})
            
            prevSounded = sounded
            prevSec = sec
        }
    }
    editWorkList.shift()

    console.log(editWorkList)


    console.log('4. Set Keyframe')
    let pb4 = makeProgressBar(1)
    await ffmpeg(['-i', 'workspace/1_input.mp4', 
        '-x264opts', 'keyint=1', 
        '-y', 'workspace/2_keyframed.mp4'])
    pb4.tick()


    console.log('5. Split Videos')
    let pb5 = makeProgressBar(editWorkList.length)
    for (i in editWorkList){
        let editWork = editWorkList[i]
        await ffmpeg([
            '-ss', `${editWork.start}`,
            '-i', 'workspace/2_keyframed.mp4',
            '-t', `${editWork.end - editWork.start}`, 
            '-filter:v', `setpts=${editWork.sounded?sounded_speed:silent_speed}*PTS`,
            '-y', `workspace/videos/${sf('{0:000000}', Number(i))}.mp4`])
        pb5.tick()
    }

    console.log('6. Change Speed of Each Part')
    let pb6 = makeProgressBar(1)
    pb6.tick()


    console.log('7. Merge All Part to One Video')
    let pb7 = makeProgressBar(1)
    let videoFileList = fs.readdirSync('workspace/videos')
    let videoList = videoFileList.map((data)=>{
        return `file ${data}`
    })
    fs.writeFileSync('workspace/videos/list.txt', videoList.join('\n'))

    await ffmpeg(['-f', 'concat',
            '-i', 'workspace/videos/list.txt',
            '-c', 'copy', 
            '-y', `workspace/3_result.mp4`])
    pb7.tick()
}

function ffmpeg(params) {
    console.log('ffmpeg: '+ params.join(' '))
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
            if(code == 0)
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

const average = arr => arr.reduce( ( p, c ) => p + c, 0 ) / arr.length

function makeProgressBar(length){
    const progressBar = new ProgressBar(`[:bar] :percent :current/:total :elapseds`, {
        complete: '=',
        incomplete: ' ',
        width: 20,
        total: length
    })
    progressBar.tick(0)
    return progressBar
}