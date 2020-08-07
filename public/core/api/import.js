const { ipcMain: ipc } = require('electron')
const { PROJECT_PATH } = require('../constants')
const datauri = require('datauri')
const jimp = require('jimp')
const path = require('path')
const fs = require('fs')

const sharp = require('sharp')
const JSZip = require('jszip')
const kebabCase = require('lodash.kebabcase')

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
  const bmpFolder = getOrCreatePath(folderName, 'images', 'bmp')

  for (let asset of storyData.assets) {
    try {
      const svgFilePath = path.join(svgFolder, kebabCase(asset.label) + '.svg')
      const svgString = decodeURIComponent(asset.icon.replace(/data:image\/svg\+xml,/g, ''))
      fs.writeFileSync(svgFilePath, svgString)
      const pngFilePath = path.join(pngFolder, kebabCase(asset.label) + '.png')
      const pngBuffer = await sharp(Buffer.from(svgString), { density: 450 }).png().toBuffer()
      fs.writeFileSync(pngFilePath, pngBuffer)
      asset.pngIcon = await datauri(pngFilePath)
      const image = await jimp.read(pngBuffer)
      const bmpFilePath = path.join(bmpFolder, kebabCase(asset.label) + '.bmp')
      await image.contain(320, 240).invert().writeAsync(bmpFilePath)
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
    }
    const data = JSON.parse(fileContent)
    const folderName = kebabCase(data.meta.name) + '-' + new Date().getTime()

    const folderPath = getOrCreatePath(folderName)
    const coverFilePath = path.join(folderPath, 'cover.jpg')

    // generate cover
    if (data.meta.image) {
      const image = await jimp.read(data.meta.image)
      await image.writeAsync(coverFilePath)
    }
    
    // generate visual assets
    await generateAssetFiles(data, folderName)
    
    // copy sounds
    const allFiles = Object.keys(zip.files).filter(f => f.startsWith('sounds/') && !zip.files[f].dir)
    if (allFiles.length > 0) {
      const sndFolder = getOrCreatePath(folderName, 'sounds')
      for (let filePath of allFiles) {
        const sndFilename = path.join(sndFolder, filePath.replace('sounds/', ''))
        const sndBuffer = await zip.file(filePath).async('nodebuffer')
        fs.writeFileSync(sndFilename, sndBuffer)
      }
    }

    const { assets } = data
    let variables = {}
    for (let asset of assets) {
      variables[asset.id] = asset
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
      nodes.push({id: seq.id, content: seq.content})
      if (seq.choices && seq.choices.length > 0) {
        seq.choices.forEach((ch, idx) => {
          nodes.push({id: seq.id + '_chx-' + idx, content: ch.content})
        })
      }
    })

    data.projectInfo = {
      folderName,
      creationDate: new Date(),
      title: data.meta.name,
      numNodes: nodes.length,
      numIcons: variables.length
    }

    const infoFilePath = path.join(folderPath, 'info.json')
    let infoData = data.projectInfo
    if (data.meta.image) {
      const coverDataUri = await datauri(coverFilePath)
      infoData = {...data.projectInfo, cover: coverDataUri}      
    }
    fs.writeFileSync(infoFilePath, JSON.stringify(infoData, null, 4))

    const project = {...data, variables, nodes, sequences, originalSequences: data.sequences}
    event.sender.send('IPC_REDUX_MESSAGE', 'project-created', project)
  } catch (e) {
    console.log('error !')
    console.log(e.message)
    event.sender.send('IPC_REDUX_MESSAGE', 'project-created-error', e)
  }
}

const init = () => {
  ipc.on('import-story', importStory)
}

module.exports = {
  init
}