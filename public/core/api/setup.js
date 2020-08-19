const { systemPreferences } = require('electron')
const { ipcMain: ipc } = require('electron')
const { FFMPEG_BIN_PATH } = require('../constants')
const ffbinaries = require('ffbinaries')
const ffmpeg = require('./ffmpeg')
const isDev = require('electron-is-dev')
const path = require('path')
const fs = require('fs')

const download = (event) => {
  try {
    ffbinaries.downloadBinaries(['ffmpeg', 'ffprobe'], {quiet: !isDev, destination: FFMPEG_BIN_PATH, tickerFn: (tick) => {
      event.sender.send('IPC_REDUX_MESSAGE', 'ffmpeg-download-progress', tick.progress)
    }}, () => {
      ffmpeg.setBinariesPaths()
      event.sender.send('IPC_REDUX_MESSAGE', 'ffmpeg-ready', null)
    })
  } catch (e) {
    event.sender.send('IPC_REDUX_MESSAGE', 'ffmpeg-ready', e)
  }
}

const enableMicrophone = (event) => {
  console.log('microphone status: ' + systemPreferences.getMediaAccessStatus('microphone'))
  systemPreferences.askForMediaAccess('microphone').then((isAllowed) => {
    if (isAllowed) {
      event.sender.send('IPC_REDUX_MESSAGE', 'microphone-ready')
    } else {
      event.sender.send('IPC_REDUX_MESSAGE', 'microphone-cancel')  
    }
  })
}

const setup = (event) => {
  // allow to remove ffmpeg from cache
  // ffbinaries.clearCache()
  const ffmpegReady = fs.existsSync(path.join(FFMPEG_BIN_PATH, 'ffmpeg')) && fs.existsSync(path.join(FFMPEG_BIN_PATH, 'ffprobe'))
  event.sender.send('IPC_REDUX_MESSAGE', 'app-setup-response', {
    microphoneReady: systemPreferences.getMediaAccessStatus('microphone') === 'granted',
    ffmpegReady
  })
}

const init = () => {
  ipc.on('app-setup', setup)
  ipc.on('app-enable-microphone', enableMicrophone)
  ipc.on('ffmpeg-download', download)
}

module.exports = {
  init
}