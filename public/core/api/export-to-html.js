const path = require('path')
const fs = require('fs')
const { PROJECT_PATH } = require('../constants')
const JSZip = require('jszip')
const { migrate } = require('../utils/migrate')
const glob = require('glob')

module.exports = async (moikiData) => {
  const { meta, projectInfo } = moikiData
  console.log(projectInfo.folderName)
  //const { finalMergePath, objectSfxPath } = paths
  return await new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, '..', '..', 'html-player', 'html-player.zip'), async (err, data) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        try {
          const zip = await JSZip.loadAsync(data)
          const listFiles = Object.entries(zip.files).map(([_, file]) => file)
          for (let file of listFiles) {
            if (file.name.startsWith('__MACOSX')) {
              zip.remove(file.name)
            }
            if (file.name === 'index.html') {
              let fileContent = await zip.file(file.name).async('string')
              fileContent = fileContent.replace(/\$OG_TITLE/g, 'Moiki: ' + meta.name)
              fileContent = fileContent.replace(/\$OG_DESCRIPTION/g, meta.description)
              fileContent = fileContent.replace(/\$OG_IMAGE/g, meta.image)
              zip.file(file.name, fileContent)
            }
          }
        
          // copy vocals
          const vocalsFolder = path.join(PROJECT_PATH, projectInfo.folderName, 'vocals')
          const voiceFiles = fs.existsSync(vocalsFolder) ?
            fs.readdirSync(vocalsFolder, { withFileTypes: true })
              .filter(f => !f.isDirectory())
              .map(f => f.name) : []
          zip.folder('voices')
          for (let file of voiceFiles) {
            zip.file('voices/' + file, fs.readFileSync(path.join(vocalsFolder, file)))
          }

          // copy sounds
          const sndFolder = path.join(PROJECT_PATH, projectInfo.folderName, 'norm-sounds')
          const sndFiles = fs.existsSync(sndFolder) ?
            fs.readdirSync(sndFolder, { withFileTypes: true })
              .filter(f => !f.isDirectory())
              .map(f => f.name) : []
          zip.folder('sounds')
          for (let file of sndFiles) {
            zip.file('sounds/' + file, fs.readFileSync(path.join(sndFolder, file)))
          }

          // copy fonts
          const fontsFolder = path.join(PROJECT_PATH, projectInfo.folderName, 'fonts')
          let fontsFiles = []
          const files = glob.sync(fontsFolder + '/**/*', null)
          if (files.length > 0) {
            fontsFiles = files.sort((a,b) => a.length - b.length)
          }            
          zip.folder('fonts')
          for (let f of fontsFiles) {
            if (fs.lstatSync(f).isDirectory()) {
              zip.folder(f.replace(fontsFolder, 'fonts'))
            }
          }
          for (let f of fontsFiles) {
            if (!fs.lstatSync(f).isDirectory()) {
              zip.file(f.replace(fontsFolder, 'fonts'), fs.readFileSync(f))
            }
          }

          // copy images
          const imgFolder = path.join(PROJECT_PATH, projectInfo.folderName, 'raw-images')
          const imgFiles = fs.existsSync(imgFolder) ?
            fs.readdirSync(imgFolder, { withFileTypes: true })
              .filter(f => !f.isDirectory())
              .map(f => f.name) : []
          zip.folder('images')
          for (let file of imgFiles) {
            zip.file('images/' + file, fs.readFileSync(path.join(imgFolder, file)))
          }

          const iconsFolder = path.join(PROJECT_PATH, projectInfo.folderName, 'raw-images', 'icons')
          const iconFiles = fs.existsSync(iconsFolder) ?
            fs.readdirSync(iconsFolder, { withFileTypes: true })
              .filter(f => !f.isDirectory())
              .map(f => f.name) : []
          zip.folder('images/icons')
          for (let file of iconFiles) {
            zip.file('images/icons/' + file, fs.readFileSync(path.join(iconsFolder, file)))
          }

          const contentImgFolder = path.join(PROJECT_PATH, projectInfo.folderName, 'raw-images', 'content')
          console.log(contentImgFolder)
          const contentImgFiles = fs.existsSync(contentImgFolder) ?
            fs.readdirSync(contentImgFolder, { withFileTypes: true })
              .filter(f => !f.isDirectory())
              .map(f => f.name) : []
          zip.folder('images/content')
          for (let file of contentImgFiles) {
            zip.file('images/content/' + file, fs.readFileSync(path.join(contentImgFolder, file)))
          }
          
          const storyDataPath = path.join(PROJECT_PATH, projectInfo.folderName, 'raw-data.json')
          const storyData = fs.readFileSync(storyDataPath, 'utf8')
          const convertedStory = migrate(JSON.parse(storyData))
          zip.file('data.js', 'var moiki_story = ' + JSON.stringify(convertedStory, null, 4) + ';')
          resolve(zip)
        } catch(e) {
          console.log(e)
          reject(e)
        }
      }
    })
  })
}