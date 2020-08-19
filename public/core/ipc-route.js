const setupApi = require('./api/setup')
const projectsApi = require('./api/projects')
const ffmpegApi = require('./api/ffmpeg')
const importApi = require('./api/import')
const exportToStudioApi = require('./api/export-to-studio')

const initialize = () => {
  setupApi.init()
  projectsApi.init()
  ffmpegApi.init()
  importApi.init()
  exportToStudioApi.init()
}

module.exports = {
  initialize
}