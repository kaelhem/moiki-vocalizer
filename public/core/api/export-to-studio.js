const { ipcMain: ipc } = require('electron')
const { PROJECT_PATH, DOWNLOADS_PATH } = require('../constants')
const studioConverter = require('./studio-helpers/converter')
const { createJson } = require('./studio-helpers/create-nodes')
const path = require('path')
const fs = require('fs')
const fsExtra = require('fs-extra')
const JSZip = require('jszip')
const uuid = require('uuid')
const kebabCase = require('lodash.kebabcase')

const ffmpeg = require('./ffmpeg')

const exportToStudio = async (event, story) => {
  try {
    const { sequencesDescriptor, uuidSequencesMap, sequences, variables } = studioConverter(story)

    const tempMergePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'temp-merge', 'sounds')
    if (fs.existsSync(tempMergePath)) {
      fsExtra.emptyDirSync(tempMergePath)
    } else {
      fs.mkdirSync(tempMergePath, {recursive: true})  
    }
    const finalMergePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'final-merge')
    if (fs.existsSync(finalMergePath)) {
      fsExtra.emptyDirSync(finalMergePath)
    } else {
      fs.mkdirSync(finalMergePath, {recursive: true})  
    }

    let objectSfxPath = path.join(__dirname, '..', '..', 'assets', 'object-sfx.mp3')
    if (story.theme && story.theme.styles && story.theme.styles.sfx && story.theme.styles.sfx.objectWin && story.theme.styles.sfx.objectWin.sound) {
      const snd = story.sounds.find(x => x.id === story.theme.styles.sfx.objectWin.sound)
      objectSfxPath = path.join(PROJECT_PATH, story.projectInfo.folderName, snd.sound.localFile)
    }
    
    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 1)
    // merging vocals with effects
    const vocalsCopyFolder = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals-copy')
    if (!fs.existsSync(vocalsCopyFolder)) {
      fs.mkdirSync(vocalsCopyFolder, {recursive: true})  
    } else {
      fsExtra.emptyDirSync(vocalsCopyFolder)
    }
    for (let seq of story.sequences) {
      if (seq.soundSfx && seq.soundSfx.sound && seq.soundSfx.sound !== 'none') {
        const sfx = story.sounds.find(({id}) => id === seq.soundSfx.sound)
        if (sfx) {
          const vocalFilePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals' , seq.id + '.mp3')
          const sfxFilePath = path.join(PROJECT_PATH, story.projectInfo.folderName, sfx.sound.localFile)
          // TODO : allow sounds params (delay, volume)
          await new Promise(resolve => ffmpeg.mergeSounds(vocalFilePath, sfxFilePath, path.join(story.projectInfo.folderName, 'vocals-copy'), seq.id + '.mp3', resolve))
        }
      }
    }

    let soundsDuration = {}
    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 2)
    // concatenate vocals
    const tempPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'temp')
    if (fs.existsSync(tempPath)) {
      fsExtra.emptyDirSync(tempPath)
    }
    const concatenateVocals = {}
    for (let node of sequencesDescriptor) {
      if (!concatenateVocals[node.list.join(',')]) {
        const files = []
        for (let p of node.list) {
          
          // TODO : insert object here

          let filePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals-copy' , p + '.mp3')
          if (!fs.existsSync(filePath)) {
            filePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals' , p + '.mp3')
          }
          if (!soundsDuration[p]) {
            const duration = await new Promise(resolve => ffmpeg.getSoundDuration(filePath, (err, metadata) => {
              if (err) {
                console.log(err)
                resolve(0)
              } else {
                resolve(metadata.format.duration)
              }
            }))
            soundsDuration[p] = duration
          }
          files.push(filePath)
        }
        const newUUID = uuid.v4()
        concatenateVocals[node.list.join(',')] = newUUID
        if (node.action) {
          files.push(objectSfxPath)
        }
        await new Promise(resolve => ffmpeg.concatSounds(files, path.join(story.projectInfo.folderName, 'temp'), newUUID + '.mp3', resolve))
      }
    }

    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 3)
    
    // merging vocals with loops
    let count = 1
    let alreadyMerged = {}
    const concatenateVocalsArray = Object.keys(concatenateVocals)
    for (let node of sequencesDescriptor) {
      const soundListKey = node.list.join(',')
      if (!alreadyMerged[soundListKey]) {
        const loopsToMix = []
        let delay = 0
        for (let i = 0; i < node.loops.length; ++i) {
          const loop = node.loops[i]
          const loopRef = story.sounds.find(({id}) => id === loop)
          if (loop) {
            if (loopsToMix.length > 0) {
              const lastLoop = loopsToMix[loopsToMix.length - 1]
              lastLoop.to = delay
            }
            loopsToMix.push({
              file: loopRef.sound.localFile,
              from: delay
            })
          }
          delay += soundsDuration[node.list[i]]
          const lastLoop = loopsToMix[loopsToMix.length - 1]
          if (!lastLoop.to && i === node.loops.length - 1) {
            lastLoop.to = delay
          }
        }
        for (let loop of loopsToMix) {
          const loopPath = path.join(tempMergePath, '..', loop.file)
          const filePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'temp' , concatenateVocals[soundListKey] + '.mp3')
          const finalFilePath = path.join(finalMergePath, concatenateVocals[soundListKey] + '.mp3')
          const duration = loop.to - loop.from
          await new Promise(resolve => ffmpeg.extractSound(path.join(PROJECT_PATH, story.projectInfo.folderName, loop.file), 0, duration, loopPath, resolve))        
          await new Promise(resolve => ffmpeg.mergeSoundsWithDelay(filePath, loopPath, finalFilePath, Math.round(loop.from * 1000), resolve))
          fs.copyFileSync(finalFilePath, filePath)
        }
        event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 3, 'Séquences assemblées ' + count + '/' + concatenateVocalsArray.length)
        ++count
        alreadyMerged[soundListKey] = true
      }
    }
    alreadyMerged = null

    for (let seq of sequences) {
      seq.vocals = concatenateVocals[seq.chain.map(c => c.id).join(',')] + '.mp3'
      const lastChain = seq.chain[seq.chain.length - 1]
      if (lastChain.choices && lastChain.choices.length > 0) {
        let idx = 0
        for (let choice of lastChain.choices) {
          choice.vocals = lastChain.id + '_chx-' + idx + '.mp3'
          ++idx
        }
      }
    }

    /*
    sanity check
    for (let seq of sequences) {
      const lastChain = seq.chain[seq.chain.length - 1]
      if (lastChain.choices && lastChain.choices.length > 0) {
        for (let choice of lastChain.choices) {
          const UUID = uuidSequencesMap.get(choice.next + ':' + choice.listObjects.join('@'))
          const retrievedSequence = sequences.find(x => x.uuid === UUID)
          if (!retrievedSequence) {
            console.log('cannot found: ' + choice.next + ':' + choice.listObjects.join('@'))
            console.log(seq)
          }
        }
      }
    }*/

    const studioData = createJson(story, { sequencesDescriptor, uuidSequencesMap, sequences, variables })

    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 4)
    const zip = new JSZip()
    zip.file('story.json', JSON.stringify(studioData, null, 4))
    const coverPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'cover.png')
    if (fs.existsSync(coverPath)) {
      zip.file('thumbnail.png', fs.readFileSync(coverPath))
    }
    zip.folder('assets')
    // copy moiki logo
    zip.file('assets/cover.png', fs.readFileSync(path.join(__dirname, '..', '..', 'assets', 'moiki-logo-studio.png')))
    // copy question images
    const questions = ['1-2', '2-2', '1-3', '2-3', '3-3']
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

    const tempZipPath = path.join(DOWNLOADS_PATH, 'export-studio-' + new Date().getTime() + '.zip')
    await new Promise((resolve, reject) => {
      zip.generateNodeStream({type:'nodebuffer', streamFiles:true})
        .pipe(fs.createWriteStream(tempZipPath))
        .on('finish', () => {
          resolve()
        })
    })
    event.sender.send('IPC_REDUX_MESSAGE', 'story-exported', null, tempZipPath)
  } catch (e) {
    event.sender.send('IPC_REDUX_MESSAGE', 'story-exported', e)
  }
}

const init = () => {
  ipc.on('export-to-studio', exportToStudio)
}

module.exports = {
  init
}