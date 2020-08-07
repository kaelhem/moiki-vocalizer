const { app } = require('electron')
const path = require('path')

module.exports = {
  PROJECT_PATH: path.join(app.getPath('home'), 'MoikiVocalizer', 'projects'),
  TEMP_PATH: path.join(app.getPath('home'), 'MoikiVocalizer', 'temp'),
  FFMPEG_BIN_PATH: path.join(app.getPath('appData'), 'ffmpeg-bin')
}