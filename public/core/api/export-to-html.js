const { createJson } = require('./export-helpers/create-html-json')
const path = require('path')
const fs = require('fs')
const { PROJECT_PATH } = require('../constants')
const kebabCase = require('lodash.kebabcase')
const JSZip = require('jszip')

module.exports = async (moikiData) => {
  const { story, descriptor, paths } = moikiData
  const { finalMergePath, objectSfxPath } = paths
  return await new Promise((resolve, reject) => {
    fs.readFile(path.join(__dirname, '..', '..', 'html-player', 'html-player.zip'), async (err, data) => {
      if (err) {
        console.log(err)
        reject(err)
      } else {
        try {
          console.log(data)
          const zip = await JSZip.loadAsync(data)
          const listFiles = Object.entries(zip.files).map(([_, file]) => file)
          for (let file of listFiles) {
            if (file.name.startsWith('__MACOSX')) {
              zip.remove(file.name)
            }
            if (file.name === 'index.html') {
              let fileContent = await zip.file(file.name).async('string')
              fileContent = fileContent.replace(/\$OG_TITLE/g, 'Moiki: ' + story.meta.name)
              fileContent = fileContent.replace(/\$OG_DESCRIPTION/g, story.meta.description)
              fileContent = fileContent.replace(/\$OG_IMAGE/g, story.meta.image)
              zip.file(file.name, fileContent)
            }
          }
          const soundFiles = fs.existsSync(finalMergePath) ?
            fs.readdirSync(finalMergePath, { withFileTypes: true })
              .filter(f => !f.isDirectory())
              .map(f => f.name) : []
        
          const vocalsFolder = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals')
          const extraSoundsFiles = fs.existsSync(vocalsFolder) ? 
            fs.readdirSync(vocalsFolder, { withFileTypes: true })
              .filter(f => !f.isDirectory() && (f.name.indexOf('_chx-') !== -1 || f.name.indexOf('_obj') !== -1))
              .map(f => f.name) : []
        
          const jsonData = {...createJson(story, descriptor), listAudio: [...soundFiles, ...extraSoundsFiles]}
          zip.file('data.js', 'var moiki_story = ' + JSON.stringify(jsonData, null, 4) + ';')
          const coverPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'cover.png')
          if (fs.existsSync(coverPath)) {
            zip.file('cover.png', fs.readFileSync(coverPath))
          }
          zip.folder('assets')
          // copy moiki logo
          zip.file('assets/moiki-logo.svg', fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'moiki-logo.svg')))
          
          // copy assets images
          for (let asset of story.assets) {
            const imgPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'images', 'svg', kebabCase(asset.label) + '.svg')
            if (fs.existsSync(imgPath)) {
              zip.file('assets/' + kebabCase(asset.label) + '_obj.svg', fs.readFileSync(imgPath))
            }
          }
        
          // copy sequences sounds
          for (let file of soundFiles) {
            zip.file('assets/' + file, fs.readFileSync(path.join(finalMergePath, file)))
          }
        
          // copy extra sounds
          for (let file of extraSoundsFiles) {
            zip.file('assets/' + file, fs.readFileSync(path.join(vocalsFolder, file)))
          }
        
          // copy default sfx
          if (fs.existsSync(objectSfxPath)) {
            zip.file('assets/object-sfx.mp3', fs.readFileSync(objectSfxPath))
          }

          resolve(zip)
        } catch(e) {
          console.log(e)
          reject(e)
        }
      }
    })
  })
}