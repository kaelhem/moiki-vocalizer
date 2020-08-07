const { ipcMain: ipc } = require('electron')
const { PROJECT_PATH, TEMP_PATH } = require('../constants')
const imageDataURI = require('image-data-uri')
const jimp = require('jimp')
const path = require('path')
const fs = require('fs')

const convertImage = async (img, folder) => {
  await new Promise((resolve, reject) => {
    if (!fs.existsSync(TEMP_PATH)) {
      fs.mkdirSync(TEMP_PATH, {recursive: true})  
    }
    const tempImagePath = path.join(TEMP_PATH, 'tmp.png')
    imageDataURI.outputFile(img.img, tempImagePath)
    jimp.read(tempImagePath, (err, image) => {
      fs.unlinkSync(tempImagePath)
      if (err) {
        console.log(err)
        reject(err)
      } else {
        image.contain(320, 240).invert().write(path.join(folder, img.fileName + '.bmp'))
        resolve()
      }
    })
  })
}

const convertStoryImages = async (event, images, folderName) => {
  const outputFolder = path.join(PROJECT_PATH, folderName, 'images')
  if (!fs.existsSync(outputFolder)) {
    fs.mkdirSync(outputFolder, {recursive: true})  
  }
  const errors = []
  for (let img of images) {
    try {
      await convertImage(img, outputFolder)
    } catch (e) {
      errors.push(e)
      console.log(e)
    }
  }
  event.sender.send('IPC_REDUX_MESSAGE', 'jimp-convert-images-complete', errors)
}

const init = () => {
  ipc.on('jimp-convert-png2bmp', convertStoryImages)
}

module.exports = {
  init
}