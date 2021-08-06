const { ipcMain: ipc } = require('electron')
const { PROJECT_PATH } = require('../constants')
const datauri = require('datauri')
const jimp = require('jimp')
const path = require('path')
const fs = require('fs')

const sharp = require('sharp')
const JSZip = require('jszip')
const kebabCase = require('lodash.kebabcase')
const { migrate } = require('../utils/migrate')

const cleanContent = (content) => content
  .replace(/(<\/*(strong|b)>)/gi, '')
  .replace(/(<\/*(em)>)/gi, '')
  .replace(/(<\/*(h\d)>)/gi, '')
  .replace(/<span class="ql-cursor">/gi, '')
  .replace(/<\/p>/gi, '</p> ')
  .replace(/<\/*p>/gi, '')
  .replace(/(<\/*(span)>)/gi, '')
  .replace(/(\s)+/gi, ' ')
  .replace(/\s*<br\s*\/*>(\s|&nbsp;)*/gi, '\n')
  .replace(/(\s)*&nbsp;(\s)*/gi, ' ')
  .trim()

const getOrCreatePath = (...pathParts) => {
  const folder = path.join(PROJECT_PATH, ...pathParts)
  if (!fs.existsSync(folder)) {
    fs.mkdirSync(folder, {recursive: true})  
  }
  return folder
}

const generateAssetFiles = async (storyData, folderName) => {
  const svgFolder = getOrCreatePath(folderName, 'images', 'svg')
  const pngFolder = getOrCreatePath(folderName, 'images', 'png')
  const pngInvertFolder = getOrCreatePath(folderName, 'images', 'png-invert')

  for (let asset of storyData.assets) {
    try {
      const svgFilePath = path.join(svgFolder, kebabCase(asset.label) + '.svg')
      const svgString = decodeURIComponent(asset.icon.replace(/data:image\/svg\+xml,/g, ''))
      fs.writeFileSync(svgFilePath, svgString)
      const pngFilePath = path.join(pngFolder, kebabCase(asset.label) + '.png')
      const pngBuffer = await sharp(Buffer.from(svgString), { density: 450 }).png().toBuffer()
      fs.writeFileSync(pngFilePath, pngBuffer)
      asset.pngIcon = await datauri(pngFilePath)
      const blackBg = new jimp(320, 240, 'black')
      const image = await jimp.read(pngBuffer)
      const pngInvertFilePath = path.join(pngInvertFolder, kebabCase(asset.label) + '.png')
      await blackBg.blit(image.contain(320, 240).invert(), 0, 0).writeAsync(pngInvertFilePath)
    } catch (e) {
      console.log(e.message)
    }
  }
}

const importStory = async (event, zipData) => {
  try {
    const zip = await JSZip.loadAsync(zipData)
    let isJS = false
    let file = zip.file('story.json')
    if (!file) {
      file = zip.file('data.js')
      isJS = true
    }

    let fileContent = await file.async('string')
    if (isJS) {
      fileContent = fileContent.slice(fileContent.indexOf('{'), -1)
      if (fileContent.slice(-1) === ';') {
        fileContent = fileContent.slice(0, -1)
      }
    }
    const data = migrate(JSON.parse(fileContent))
    const folderName = kebabCase(data.meta.name) + '-' + new Date().getTime()
    const folderPath = getOrCreatePath(folderName)

    // store rawData
    fs.writeFileSync(path.join(folderPath, 'raw-data.json'), fileContent)

    const coverFilePath = path.join(folderPath, 'cover.png')

    // generate cover
    if (data.meta.image) {
      const image = await jimp.read(data.meta.image)
      await image.writeAsync(coverFilePath)
    }
    
    // generate visual assets
    await generateAssetFiles(data, folderName)
    
    // copy sounds
    const sndFiles = Object.keys(zip.files).filter(f => f.startsWith('sounds/') && !zip.files[f].dir)
    if (sndFiles.length > 0) {
      const sndFolder = getOrCreatePath(folderName, 'sounds')
      for (let filePath of sndFiles) {
        const sndFilename = path.join(sndFolder, filePath.replace('sounds/', ''))
        const sndBuffer = await zip.file(filePath).async('nodebuffer')
        fs.writeFileSync(sndFilename, sndBuffer)
      }
    }

    // copy images
    const imgFiles = Object.keys(zip.files).filter(f => f.startsWith('images/') && !zip.files[f].dir)
    if (imgFiles.length > 0) {
      getOrCreatePath(folderName, 'raw-images', 'icons')
      getOrCreatePath(folderName, 'raw-images', 'content')
      for (let filePath of imgFiles) {
        const imgFilename = path.resolve(PROJECT_PATH, folderName, 'raw-images', filePath.replace('images/', ''))
        const fileBuffer = await zip.file(filePath).async('nodebuffer')
        fs.writeFileSync(imgFilename, fileBuffer)
      }
    }

    // copy fonts
    const fontFolders = Object.keys(zip.files).filter(f => f.startsWith('fonts/') && zip.files[f].dir)
    for (let fontFolder of fontFolders) {
      getOrCreatePath(folderName, fontFolder)
    }
    const fontFiles = Object.keys(zip.files).filter(f => f.startsWith('fonts/') && !zip.files[f].dir)
    if (fontFiles.length > 0) {
      for (let filePath of fontFiles) {
        const fontFilename = path.resolve(PROJECT_PATH, folderName, 'fonts', filePath.replace('fonts/', ''))
        const fileBuffer = await zip.file(filePath).async('nodebuffer')
        fs.writeFileSync(fontFilename, fileBuffer)
      }
    }

    const sequences = data.sequences.map(seq => ({
      ...seq,
      content: cleanContent(seq.content),
      choices : seq.choices ? seq.choices.map(ch => ({
        ...ch,
        content: cleanContent(ch.content)
      })) : []
    }))
    let nodes = [{
      id: '_root',
      content: 'Moiki présente : ' + data.meta.name
    }]
    sequences.forEach(seq => {
      if (seq.content) {
        nodes.push({id: seq.id, content: seq.content})
      }
      if (seq.choices && seq.choices.length > 0) {
        seq.choices.forEach((ch, idx) => {
          if (ch.content) {
            nodes.push({id: seq.id + '_chx-' + idx, content: ch.content})
          }
        })
      }
    })

    for (let {label, desc} of data.assets) {
      nodes.push({id: kebabCase(label) + '_obj', content: desc})
    }

    data.projectInfo = {
      folderName,
      creationDate: new Date(),
      title: data.meta.name,
      numNodes: nodes.length,
      numIcons: data.assets.length
    }

    const project = {...data, nodes, sequences, originalSequences: data.sequences}

    const projectFilePath = path.join(folderPath, 'project.json')
    if (data.meta.image) {
      const coverDataUri = await datauri(coverFilePath)
      project.cover = coverDataUri
    }
    fs.writeFileSync(projectFilePath, JSON.stringify(project, null, 4))
    event.sender.send('IPC_REDUX_MESSAGE', 'project-created', null, project)
  } catch (e) {
    console.log('error !')
    console.log(e.message)
    event.sender.send('IPC_REDUX_MESSAGE', 'project-created', e)
  }
}

const init = () => {
  ipc.on('import-story', importStory)
}

module.exports = {
  init
}