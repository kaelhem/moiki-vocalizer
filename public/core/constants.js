const { app } = require('electron')
const path = require('path')

module.exports = {
  PROJECT_PATH: path.join(app.getPath('home'), 'MoikiVocalizer', 'projects'),
  FFMPEG_BIN_PATH: path.join(app.getPath('appData'), 'ffmpeg-bin'),
  DOWNLOADS_PATH: app.getPath('downloads')
}