const { ipcMain: ipc } = require('electron')
const { PROJECT_PATH, FFMPEG_BIN_PATH } = require('../constants')
const ffbinaries = require('ffbinaries')
const ffmpeg = require('fluent-ffmpeg')
const arrayBufferToBuffer = require('arraybuffer-to-buffer')
const Readable = require('stream').Readable
const path = require('path')
const fs = require('fs')
const isDev = require('electron-is-dev')

const bufferToStream = (buffer) => { 
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

const download = async (event) => {
  await new Promise((resolve, reject) => {
    try {
      ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], {quiet: !isDev, destination: FFMPEG_BIN_PATH}, () => {
        resolve('ok')
      })
    } catch (e) {
      reject(e)
    }
  }).catch(e => {
    console.log(e)
  })
  event.sender.send('IPC_REDUX_MESSAGE', 'ffmpeg-ready')
}

const convertSound = (event, arraybuffer, folderName, fileName) => {
  const buffer = arrayBufferToBuffer(arraybuffer)
  ffmpeg.setFfmpegPath(path.join(FFMPEG_BIN_PATH, 'ffmpeg'))
  ffmpeg.setFfprobePath(path.join(FFMPEG_BIN_PATH, 'ffprobe'))
  const outputFolder = path.join(PROJECT_PATH, folderName, 'vocals')
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {recursive: true})  
  }
  ffmpeg(bufferToStream(buffer))
    .outputOptions(['-ab 160k', '-ar 44100'])
    .output(path.join(outputFolder, fileName + '.mp3'))
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred: ' + err.message, err, stderr)
    })
    .on('end', (err, stdout, stderr) => {
      event.sender.send('ffmpeg-convert-complete', stdout)
    })
    .run()
}

const init = () => {
  ipc.on('ffmpeg-download', download)
  ipc.on('ffmpeg-convert-webm2mp3', convertSound)
}

module.exports = {
  init
}