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
      const infoFilePath = path.join(PROJECT_PATH, dir, 'project.json')
      const { projectInfo, cover } = JSON.parse(fs.readFileSync(infoFilePath))
      projects.push({ ...projectInfo, cover })
    }
    projects = projects.sort((a, b) => new Date(b.creationDate) - new Date(a.creationDate))
    event.sender.send('IPC_REDUX_MESSAGE', 'projects-list', null, projects)
  } catch (e) {
    console.log(e)
    event.sender.send('IPC_REDUX_MESSAGE', 'projects-list', e)
  }
}

const load = (event, folderName) => {
  try {
    const projectFilePath = path.join(PROJECT_PATH, folderName, 'project.json')
    console.log(projectFilePath)
    const fileContent = fs.readFileSync(projectFilePath)
    event.sender.send('IPC_REDUX_MESSAGE', 'project-loaded', null, JSON.parse(fileContent))
  } catch (e) {
    event.sender.send('IPC_REDUX_MESSAGE', 'project-loaded', e)
  }
}

const init = () => {
  ipc.on('get-projects-list', list)
  ipc.on('load-project', load)
}

module.exports = {
  init
}