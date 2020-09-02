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

const getVocalsFolder = (folderName) => {
  const folder = path.join(PROJECT_PATH, folderName, 'vocals')
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, {recursive: true})  
  }
  return folder
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
      const { projectInfo, cover, nodes } = JSON.parse(fs.readFileSync(infoFilePath))
      let alreadyVocalized = 0
      for (let node of nodes) {
        if (fs.existsSync(path.join(getVocalsFolder(dir), node.id + '.mp3'))) {
          ++alreadyVocalized
        }
      }
      projects.push({ ...projectInfo, numVocalized: alreadyVocalized, cover })
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
    const fileContent = fs.readFileSync(projectFilePath)
    const project = JSON.parse(fileContent)
    const vocalsFolder = getVocalsFolder(folderName)
    for (let node of project.nodes) {
      node.hasSound = fs.existsSync(path.join(vocalsFolder, node.id + '.mp3'))
    }
    event.sender.send('IPC_REDUX_MESSAGE', 'project-loaded', null, project)
  } catch (e) {
    event.sender.send('IPC_REDUX_MESSAGE', 'project-loaded', e)
  }
}

const loadSound = (event, folderName, fileName) => {
  // file buffers are out of redux scope !
  const checks = ['..', '~', '$']
  const checkInsecure = (check) => (folderName.indexOf(check) !== -1 || fileName.indexOf(check) !== -1)
  if (checks.some(checkInsecure)) {
    event.sender.send('sound-file-loaded', {message: 'file path insecure'})
  } else {
    const filePath = path.join(PROJECT_PATH, folderName, 'vocals', fileName)
    try {
      if (fs.existsSync(filePath)) {
        event.sender.send('sound-file-loaded', null, fs.readFileSync(filePath))
      } else {
        event.sender.send('sound-file-loaded', {message: 'file path invalid: ' + filePath})  
      }
    } catch (e) {
      event.sender.send('sound-file-loaded', e)
    }
  }
}

const init = () => {
  ipc.on('get-projects-list', list)
  ipc.on('load-project', load)
  ipc.on('load-sound-file', loadSound)
}

module.exports = {
  init
}