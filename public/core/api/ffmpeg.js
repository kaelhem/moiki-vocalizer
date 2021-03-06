const { ipcMain: ipc } = require('electron')
const { PROJECT_PATH, FFMPEG_BIN_PATH } = require('../constants')
const ffmpeg = require('fluent-ffmpeg')
const arrayBufferToBuffer = require('arraybuffer-to-buffer')
const Readable = require('stream').Readable
const path = require('path')
const fs = require('fs')

const setBinariesPaths = () => {
  ffmpeg.setFfmpegPath(path.join(FFMPEG_BIN_PATH, 'ffmpeg'))
  ffmpeg.setFfprobePath(path.join(FFMPEG_BIN_PATH, 'ffprobe'))
}

const bufferToStream = (buffer) => { 
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)
  return stream
}

const convertSound = (event, arraybuffer, folderName, fileName) => {
  const buffer = arrayBufferToBuffer(arraybuffer)
  const outputFolder = path.join(PROJECT_PATH, folderName, 'vocals')
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {recursive: true})  
  }
  ffmpeg(bufferToStream(buffer))
    .outputOptions(['-ab 160k', '-ar 44100'])
    .output(path.join(outputFolder, fileName + '.mp3'))
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred: ' + err.message, err, stderr)
      event.sender.send('ffmpeg-convert-complete', err, stderr)
    })
    .on('end', (err, stdout, stderr) => {
      event.sender.send('ffmpeg-convert-complete', null, stdout)
    })
    .run()
}

const concatSounds = (files, folderName, fileName, cb) => {
  var filter = 'concat:' + files.join('|')
  const outputFolder = path.join(PROJECT_PATH, folderName)
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {recursive: true})  
  }
  const output = path.join(outputFolder, fileName)
  ffmpeg()
    .input(filter)
    .outputOptions('-acodec copy')
    .output(output)
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred: ' + err.message, err, stderr)
    })
    .on('end', (err, stdout, stderr) => {
      cb(stdout)
    })
    .run()
}

const mergeSounds = (fileA, fileB, folderName, fileName, cb) => {
  const outputFolder = path.join(PROJECT_PATH, folderName)
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {recursive: true})  
  }
  const output = path.join(outputFolder, fileName)
  ffmpeg()
    .input(fileA)
    .input(fileB)
    .complexFilter([{
      filter : 'amix', options: { inputs : 2, duration : 'longest' }
    }])
    .output(output)
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred: ' + err.message, err, stderr)
    })
    .on('end', (err, stdout, stderr) => {
      cb(stdout)
    })
    .run()
}

const mergeSoundsWithDelay = (fileA, fileB, output, delay, cb) => {
  ffmpeg()
    .input(fileA)
    .input(fileB)
    .complexFilter([
      '[0]volume=1[a]',
      '[1:0]volume=0.35[b]',
      '[a]adelay=0[0a]',
      '[b]adelay=' + delay + '|' + delay + '[1a]',
      '[0a][1a]amix=2'
    ])
    .output(output)
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred: ' + err.message, err, stderr)
    })
    .on('end', (err, stdout, stderr) => {
      cb(stdout)
    })
    .run()
}

const extractSound = (file, from, to, output, cb) => {
  ffmpeg()
    .input(file)
    .outputOptions(['-ss ' + from, '-to ' + to, '-c copy'])
    .output(output)
    .on('error', (err, stdout, stderr) => {
      console.log('An error occurred: ' + err.message, err, stderr)
    })
    .on('end', (err, stdout, stderr) => {
      cb(stdout)
    })
    .run()
}

const getSoundDuration = (file, cb) => {
  ffmpeg.ffprobe(file, cb)
}

const concatSoundsCommand = (event, files, folderName, fileName) => {
  concatSounds(files, folderName, fileName, (out) => {
    event.sender.send('ffmpeg-concat-complete', out)
  })
}

const init = () => {
  setBinariesPaths()
  ipc.on('ffmpeg-convert-webm2mp3', convertSound)
  ipc.on('ffmpeg-concat-sounds', concatSoundsCommand)
}

module.exports = {
  init,
  setBinariesPaths,
  extractSound,
  concatSounds,
  mergeSounds,
  mergeSoundsWithDelay,
  getSoundDuration
}