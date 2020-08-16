const electron = require('electron')
const { app, BrowserWindow, shell } = electron

const path = require('path')
const isDev = require('electron-is-dev')

const ipcRoute = require('./core/ipc-route')

ipcRoute.initialize()

let mainWindow

const createWindow = () => {

  mainWindow = new BrowserWindow({
    width: 1200,
    height: 900,
    webPreferences: {
      devTools: isDev,
      nodeIntegration: true,
      enableRemoteModule: true
    }
  })
  
  mainWindow.loadURL(isDev ? 'http://localhost:3000' : `file://${path.join(__dirname, '../build/index.html')}`)
  if (isDev) {
    // Open the DevTools.
    //BrowserWindow.addDevToolsExtension('<location to your react chrome extension>');
    setTimeout(() => {
      mainWindow.webContents.openDevTools({mode: 'detach'})
    }, 1000)
  }
  electron.systemPreferences.askForMediaAccess('microphone').then((isAllowed) => {
    console.log('isAllowed', isAllowed)
  })
  mainWindow.on('closed', () => mainWindow = null)

  mainWindow.webContents.on('new-window', (event, url) => {
    if (!url.match(/http:\/\/localhost.*/gi) && url.startsWith('http')) {
      event.preventDefault()
      shell.openExternal(url)
    }
  })
}

app.on('ready', async () => {
  if (isDev) {
    const { default: installExtension, REDUX_DEVTOOLS } = require('electron-devtools-installer')
    await installExtension(REDUX_DEVTOOLS)
      .then((name) => console.log(`Added Extension:  ${name}`))
      .catch((err) => console.log('An error occurred: ', err))
  }
  createWindow()
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (mainWindow === null) {
    createWindow()
  }
})