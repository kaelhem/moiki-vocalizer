const { createJson } = require('./export-helpers/create-studio-json')
const path = require('path')
const fs = require('fs')
const { PROJECT_PATH } = require('../constants')
const kebabCase = require('lodash.kebabcase')
const { migrate } = require('moiki-exporter')

module.exports = (moikiData, zip) => {
  const { descriptor, paths } = moikiData
  const story = migrate(moikiData.story)
  const { finalMergePath, objectSfxPath } = paths
  const studioData = createJson(story, descriptor)
  zip.file('story.json', JSON.stringify(studioData, null, 4))
  const coverPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'cover.png')
  if (fs.existsSync(coverPath)) {
    zip.file('thumbnail.png', fs.readFileSync(coverPath))
  }
  zip.folder('assets')
  // copy moiki logo
  zip.file('assets/cover.png', fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'moiki-logo-studio.png')))
  // copy question images
  const questions = ['1-2', '2-2', '1-3', '2-3', '3-3', '1-4', '2-4', '3-4', '4-4']
  for (let q of questions) {
    zip.file('assets/question_' + q + '.png', fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'question-' + q + '.png')))
  }
  // copy assets images
  for (let asset of story.assets) {
    const imgPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'images', 'png-invert', kebabCase(asset.label) + '.png')
    if (fs.existsSync(imgPath)) {
      zip.file('assets/' + kebabCase(asset.label) + '_obj.png', fs.readFileSync(imgPath))
    }
  }

  // copy presentation sound
  const presentSoundPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals', '_root.mp3')
  if (fs.existsSync(presentSoundPath)) {
    zip.file('assets/_root.mp3', fs.readFileSync(presentSoundPath))
  }
  // copy sequences sounds
  if (fs.existsSync(finalMergePath)) {
    const soundFiles = fs.readdirSync(finalMergePath, { withFileTypes: true })
      .filter(f => !f.isDirectory())
      .map(f => f.name)
    for (let file of soundFiles) {
      zip.file('assets/' + file, fs.readFileSync(path.join(finalMergePath, file)))
    }
  }

  // copy extra sounds
  const vocalsFolder = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals')
  if (fs.existsSync(vocalsFolder)) {
    const extraSoundsFiles = fs.readdirSync(vocalsFolder, { withFileTypes: true })
      .filter(f => !f.isDirectory() && (f.name.indexOf('_chx-') !== -1 || f.name.indexOf('_obj') !== -1))
      .map(f => f.name)
    for (let file of extraSoundsFiles) {
      zip.file('assets/' + file, fs.readFileSync(path.join(vocalsFolder, file)))
    }
  }
  if (fs.existsSync(objectSfxPath)) {
    zip.file('assets/object-sfx.mp3', fs.readFileSync(objectSfxPath))
  }

  return zip
}