const projectsApi = require('./api/projects')
const ffmpegApi = require('./api/ffmpeg')
const jimpApi = require('./api/jimp')
const importApi = require('./api/import')

const initialize = () => {
  projectsApi.init()
  ffmpegApi.init()
  jimpApi.init()
  importApi.init()
}

module.exports = {
  initialize
}