const { ipcMain: ipc } = require('electron')
const { PROJECT_PATH, DOWNLOADS_PATH } = require('../constants')
const storyConverter = require('../story-converter')
const path = require('path')
const fs = require('fs')
const fsExtra = require('fs-extra')
const uuid = require('uuid')
const JSZip = require('jszip')

const ffmpeg = require('./ffmpeg')
const normalize = require('ffmpeg-normalize')

let currentExportToken = null

const normalizeStorySounds = async (event, story, exportStep = 1) => {
  event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', exportStep)
  const { projectInfo } = story
  const sndFolder = path.join(PROJECT_PATH, projectInfo.folderName, 'sounds')
  const sndFiles = fs.existsSync(sndFolder) ?
    fs.readdirSync(sndFolder, { withFileTypes: true })
      .filter(f => !f.isDirectory())
      .map(f => f.name) : []//path.join(sndFolder, f.name)) : []
  
  if (sndFiles.length > 0) {
    const tempPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'norm-sounds')
    if (!fs.existsSync(tempPath)) {
      fs.mkdirSync(tempPath, {recursive: true})  
    }
    const numMp3files = sndFiles.filter(x => x.slice(-4) === '.mp3').length
    let converted = 0
    for (let file of sndFiles) {
      if (!fs.existsSync(path.join(tempPath, file))) {
        if (file.slice(-4) === '.mp3') {
          // reduce sounds volume
          await new Promise((resolve, reject) => {
            normalize({
              input: path.join(sndFolder, file),
              output: path.join(tempPath, file),
              loudness: {
                normalization: 'ebuR128',
                target: {
                  input_i: -36,
                  input_lra: 7.0,
                  input_tp: -2.0
                }
              },
              verbose: process.env.NODE_ENV !== 'production'
            })
            .then(normalized  => {
              console.log(normalized)
              resolve()
            })
            .catch(error => {
              console.log(error)
              reject(error)
              // Some error happened
            })
          })
          event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', exportStep, converted + '/' + numMp3files)
          ++converted
        } else {
          fs.copyFileSync(path.join(sndFolder, file), path.join(tempPath, file))
        }
      } else if (file.slice(-4) === '.mp3') {
        event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', exportStep, converted + '/' + numMp3files)
        ++converted
      }
    }
  }
}

const exportToStudio = async (event, story) => {
  currentExportToken = {
    cancelled: false
  }
  try {
    const { sequencesDescriptor, uuidSequencesMap, sequences, variables } = storyConverter(story)

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
      objectSfxPath = path.join(PROJECT_PATH, story.projectInfo.folderName, snd.sound.localFile.replace('sounds', 'norm-sounds'))
    }
    
    await normalizeStorySounds(event, story)

    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 2)  

    // merging vocals with effects
    const vocalsCopyFolder = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals-copy')
    if (!fs.existsSync(vocalsCopyFolder)) {
      fs.mkdirSync(vocalsCopyFolder, {recursive: true})  
    } else {
      fsExtra.emptyDirSync(vocalsCopyFolder)
    }
    let mergeSfxStepCount = 0
    for (let seq of story.sequences) {
      if (currentExportToken.cancelled) {
        return
      }
      ++mergeSfxStepCount
      if (seq.soundSfx && seq.soundSfx.sound && seq.soundSfx.sound !== 'none') {
        event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 2, mergeSfxStepCount + '/' + story.sequences.length)
        const sfx = story.sounds.find(({id}) => id === seq.soundSfx.sound)
        if (sfx) {
          const vocalFilePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals' , seq.id + '.mp3')
          const sfxFilePath = path.join(PROJECT_PATH, story.projectInfo.folderName, sfx.sound.localFile.replace('sounds', 'norm-sounds'))
          if (fs.existsSync(vocalFilePath)) {
            // TODO : allow sounds params (delay, volume)
            await new Promise(resolve => ffmpeg.mergeSounds(vocalFilePath, sfxFilePath, path.join(story.projectInfo.folderName, 'vocals-copy'), seq.id + '.mp3', resolve))
          } else {
            event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status-error', 2)
            return
          }
        }
      }
    }

    let soundsDuration = {}
    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 3)
    // concatenate vocals
    const tempPath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'temp')
    if (fs.existsSync(tempPath)) {
      fsExtra.emptyDirSync(tempPath)
    }
    const concatenateVocals = {}
    let concatStepCount = 0
    for (let node of sequencesDescriptor) {
      ++concatStepCount
      if (!concatenateVocals[node.list.join(',')]) {
        const files = []
        event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 3, concatStepCount + '/' + sequencesDescriptor.length)
        for (let p of node.list) {
          if (currentExportToken.cancelled) {
            return
          }
          let filePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals-copy' , p + '.mp3')
          if (!fs.existsSync(filePath)) {
            filePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'vocals' , p + '.mp3')
          }
          if (!fs.existsSync(filePath)) {
            event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status-error', 3)
            return
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

    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 4)
    
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
          if (loop && loopRef) {
            if (loopsToMix.length > 0) {
              const lastLoop = loopsToMix[loopsToMix.length - 1]
              lastLoop.to = delay
            }
            loopsToMix.push({
              file: loopRef.sound.localFile.replace('sounds', 'norm-sounds'),
              from: delay
            })
          }
          delay += soundsDuration[node.list[i]]
          if (loopsToMix.length > 0) {
            const lastLoop = loopsToMix[loopsToMix.length - 1]
            if (!lastLoop.to && i === node.loops.length - 1) {
              lastLoop.to = delay
            }
          }
        }
        const filePath = path.join(PROJECT_PATH, story.projectInfo.folderName, 'temp' , concatenateVocals[soundListKey] + '.mp3')
        const finalFilePath = path.join(finalMergePath, concatenateVocals[soundListKey] + '.mp3')
        if (loopsToMix.length > 0) {
          for (let loop of loopsToMix) {
            if (currentExportToken.cancelled) {
              return
            }
            const loopPath = path.join(tempMergePath, '..', loop.file)
            const duration = loop.to - loop.from
            console.log(loop.file)
            await new Promise(resolve => ffmpeg.extractSound(path.join(PROJECT_PATH, story.projectInfo.folderName, loop.file), 0, duration, loopPath, resolve))        
            await new Promise(resolve => ffmpeg.mergeSoundsWithDelay(filePath, loopPath, finalFilePath, Math.round(loop.from * 1000), resolve))
            fs.copyFileSync(finalFilePath, filePath)
          }
        } else {
          fs.copyFileSync(filePath, finalFilePath)
        }
        event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 4, count + '/' + concatenateVocalsArray.length)
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

    const moikiData = {
      story,
      descriptor: {
        sequencesDescriptor,
        uuidSequencesMap,
        sequences,
        variables
      },
      paths: {
        finalMergePath,
        objectSfxPath
      }
    }
    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 5)

    let zip = new JSZip()
    const studioConverter = require('./export-to-studio')
    zip = studioConverter(moikiData, zip)
    
    /* if html:
    const htmlConverter = require('./export-to-html')
    zip = await htmlConverter(moikiData)
    */

    const tempZipPath = path.join(DOWNLOADS_PATH, 'export-lunii-' + new Date().getTime() + '.zip')
    await new Promise((resolve) => {
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

const exportToHtml = async (event, story) => {
  try {
    await normalizeStorySounds(event, story)

    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 2)

    const htmlConverter = require('./export-to-html')
    const zip = await htmlConverter(story)

    event.sender.send('IPC_REDUX_MESSAGE', 'story-export-status', 3)
    
    const tempZipPath = path.join(DOWNLOADS_PATH, 'export-html-' + new Date().getTime() + '.zip')
    await new Promise((resolve) => {
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

const cancelExport = () => {
  if (currentExportToken) {
    currentExportToken.cancelled = true
  }
}

const init = () => {
  ipc.on('export-to-studio', exportToStudio)
  ipc.on('export-to-html', exportToHtml)
  ipc.on('story-export-cancel', cancelExport)
}

module.exports = {
  init
}