const { ipcMain: ipc } = require('electron')
const fs = require('fs')
const path = require('path')
const { PROJECT_PATH } = require('../constants')

const getProjectsFolder = () => {
  if (!fs.existsSync(PROJECT_PATH)) {
    fs.mkdirSync(PROJECT_PATH, {recursive: true})  
  }
  return PROJECT_PATH
}

const getProjectsList = () => {
  const projectsFolder = getProjectsFolder()
  return fs.readdirSync(projectsFolder, { withFileTypes: true })
    .filter(dir => dir.isDirectory())
    .map(dir => dir.name)
}

const list = (event) => {
  try {
    let projects = []
    const dirNames = getProjectsList()
    for (let dir of dirNames) {
      const infoFilePath = path.join(PROJECT_PATH, dir, 'info.json')
      const fileContent = fs.readFileSync(infoFilePath)
      projects.push(JSON.parse(fileContent))
    }
    projects = projects.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
    event.sender.send('IPC_REDUX_MESSAGE', 'projects-list', projects)
  } catch (e) {
    event.sender.send('IPC_REDUX_MESSAGE', 'projects-list-error', e)
  }
}

const init = () => {
  ipc.on('get-projects-list', list)
}

module.exports = {
  init
}