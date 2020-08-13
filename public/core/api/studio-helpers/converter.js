const uuid = require('uuid')
const { utils } = require('moiki-exporter')
const clonedeep = require('lodash.clonedeep')

const { simplifyStory } = utils

const getSequenceKey = (id, objects) => id + ':' + objects.join('@')

const getLinksForSequence = (sequence) => {
  const links = {}
  if (sequence.next) {
    links[sequence.next] = { kind: 'simple', action: sequence.action }
  }
  if (sequence.condition && sequence.condition.next) {
    links[sequence.condition.next] = { kind: 'simple', condition: sequence.condition.params }
  }
  if (sequence.choices && sequence.choices.length > 0) {
    let chIdx = 0
    for (let choice of sequence.choices) {
      if (choice.next) {
        links[choice.next] = { kind: 'choice', choiceIndex: chIdx, action: choice.action }
      }
      if (choice.condition && choice.condition.next) {
        links[choice.condition.next] = { kind: 'choice', choiceIndex: chIdx, condition: choice.condition.params }
      }
      ++chIdx
    }
  }
  return Object.entries(links).map(([key, value]) => ({next: key, ...value})) || []
}

const checkTree = (sequences, firstNode, uuidMap) => {
  const uniqueSequences = {}
  let countPaths = 0
  const retrieveSequence = (id, objects) => {
    const linkUuid = uuidMap.get(getSequenceKey(id, objects))
    const retrievedSequence = sequences.find(x => x.uuid === linkUuid)
    return retrievedSequence
  }
  const sanityCheck = (seq) => {
    if (!seq.uuid) {
      console.log('sequence has no uuid! : ', seq)
    }
    if (!uniqueSequences[seq.uuid]) {
      uniqueSequences[seq.uuid] = seq
      const lastChain = seq.chain[seq.chain.length - 1]
      if (lastChain.choices && lastChain.choices.length > 0) {
        for (let choice of lastChain.choices) {
          const retrievedSequence = retrieveSequence(choice.next, choice.listObjects)
          if (!retrievedSequence) {
            console.log('cannot found: ' + getSequenceKey(choice.next, choice.listObjects) + ' (' + seq.id + ' - ' + seq.uuid + ')')
          }
          sanityCheck(retrievedSequence)
        }
      } else if (lastChain.next) {
        const retrievedSequence = retrieveSequence(lastChain.next, lastChain.listObjects)
        if (!retrievedSequence) {
          console.log('cannot found: ' + getSequenceKey(lastChain.next, lastChain.listObjects) + ' (' + seq.id + ' - ' + seq.uuid + ')')
        }
        sanityCheck(retrievedSequence)
      } else {
        ++countPaths
      }
    }
  }
  sanityCheck(firstNode)
  console.log('count final paths = ' + countPaths)
  return Object.entries(uniqueSequences).map(([_, value]) => value)
}

module.exports = (story) => {
  const { assets } = story
  let variables = {}
  for (let asset of assets) {
    variables[asset.id] = asset
  }

  let patched = {}
  const patchLoops = (sequence, currentLoop) => {
    if (patched[sequence.id]) {
      return
    }
    patched[sequence.id] = true
    if (!(sequence.soundLoop && sequence.soundLoop.sound && sequence.soundLoop.sound !== 'none')) {
      sequence.soundLoop = {sound: currentLoop}
    }
    const links = getLinksForSequence(sequence).map(l => l.next)
    for (let nextNode of links) {
      patchLoops(story.sequences.find(({id}) => id === nextNode), sequence.soundLoop.sound)
    }
  }
  patchLoops(story.sequences.find(({id}) => id === story.firstSequence), null)
  patched = null

  const sequences = simplifyStory(clonedeep(story), variables, x => x)

  const uuidMap = new Map()

  const getSequenceUUID = (id, objects) => {
    const key = getSequenceKey(id, objects)
    let isNew = false
    if (!uuidMap.has(key)) {
      uuidMap.set(key, uuid.v4())
      isNew = true
    }
    return { id: uuidMap.get(key), key, isNew }
  }

  const allPaths = {}
  let cycles = []
  let newSequences = []
  const removeConditions = (sequence, listObjects=[], storyPath=[], history=[]) => {
    const { id: currentUuid, key, isNew } = getSequenceUUID(sequence.id, listObjects)

    if (history.find(x => (x === currentUuid))) {
      cycles.push('+ 1 cycle: ' + storyPath.join(',') + ' (new node: ' + sequence.id + ')')
      return
    }
    
    if (!isNew) {
      return
    }

    const copySequence = {...clonedeep(sequence), listObjects: [...listObjects], uuid: currentUuid}
    //if (!newSequences.find(x => x.uuid === currentUuid)) {
      newSequences.push(copySequence)
    //}
    storyPath.push(key)
    history.push(currentUuid)
    let objects = [...listObjects]
    let lastChain = null
    for (let ch of copySequence.chain) {
      if (ch.action && ch.action.params) {
        if (objects.includes(ch.action.params)) {
          objects = objects.filter(x => x !== ch.action.params)
        } else {
          objects = [...objects, ch.action.params]
        }
      }
      lastChain = ch
    }
    objects.sort((a, b) => b - a)
    //const links = getLinksForSequence(lastChain)
    //-------
    if (lastChain.next) {
      if (lastChain.condition && lastChain.condition.params && objects.includes(lastChain.condition.params)) {
        lastChain.next = lastChain.condition.next
      }
      if (lastChain.condition) {
        delete lastChain.condition
      }
      lastChain.listObjects = [...objects]
      removeConditions(sequences.find(({id}) => id === lastChain.next), [...objects], [...storyPath], [...history])
    } else if (lastChain.choices && lastChain.choices.length > 0) {
      for (choice of lastChain.choices) {
        let newObjects = [...objects]
        if (choice.action && choice.action.params) {
          if (objects.includes(choice.action.params)) {
            newObjects = objects.filter(x => x !== choice.action.params)
          } else {
            newObjects = [...objects, choice.action.params]
          }
        }
        if (choice.condition && choice.condition.params && newObjects.includes(choice.condition.params)) {
          choice.next = choice.condition.next
        }
        if (choice.condition) {
          delete choice.condition
        }
        choice.listObjects = [...newObjects]
        removeConditions(sequences.find(({id}) => id === choice.next), [...newObjects], [...storyPath, 'CHOIX'], [...history])
      }
    } else {
      allPaths[storyPath.join(',')] = { data: history, path: storyPath }
    }

    // ------
    /*
    if ((lastChain && lastChain.final) || links.length === 0) {
      allPaths[storyPath.join(',')] = {data: history, path: storyPath}
    } else {
      for (let nextNode of links) {
        const choiceMarker = nextNode.kind === 'choice' ? ['CHOIX'] : []
        let objects = [...newObjects]
        if (nextNode.action && nextNode.action.params && nextNode.kind !== 'simple') {
          if (objects.includes(nextNode.action.params)) {
            objects = objects.filter(x => x !== nextNode.action.params)
          } else {
            objects.push(nextNode.action.params)
          }
          objects.sort((a, b) => b - a)
        }
        copySequence.chain[copySequence.chain.length - 1].listObjects = objects
        if (nextNode.condition) {
          if (newObjects.includes(nextNode.condition)) {
            if (nextNode.kind === 'simple') {
              copySequence.chain[copySequence.chain.length - 1].next = nextNode.next
              delete copySequence.chain[copySequence.chain.length - 1].condition
            } else if (nextNode.choiceIndex) {
              const { choices } = copySequence.chain[copySequence.chain.length - 1]
              choices[nextNode.choiceIndex].next = nextNode.next
              delete choices[nextNode.choiceIndex].condition
            }
          } else {
            if (nextNode.kind === 'simple') {
              delete copySequence.chain[copySequence.chain.length - 1].condition
            } else if (nextNode.choiceIndex) {
              const { choices } = copySequence.chain[copySequence.chain.length - 1]
              delete choices[nextNode.choiceIndex].condition
            }
          }
        }
        removeConditions(sequences.find(({id}) => id === nextNode.next), [...objects], [...storyPath, ...choiceMarker], [...history])
      }
      */
    //}
  }
  removeConditions(sequences.find(({id}) => id === story.firstSequence))
  /*
  console.log('countNodes = ' + countNodes)
  const allHistories = Object.entries(allPaths).map(([_, value]) => value)

  console.log('num cycles: ' + cycles.length)
  
  const uniqueSeqMap = new Map()
  for (let history of allHistories) {
    for (let seq of history.data) {
      uniqueSeqMap.set(seq.id + '-' + seq.listObjects.join(','), seq)
    }
  }
  const uniqueSeq = Array.from(uniqueSeqMap).map(([key, value]) => value)
  console.log('Unique sequences: ' + uniqueSeq.length)
  let numVariantes = 0
  for (let seq of sequences) {
    const variantes = uniqueSeq.filter(x => x.id === seq.id)
    if (variantes.length > 0) {
      console.log('=== ' + seq.id + ' === (' + variantes.length + ')')
      console.log(variantes.map(v => v.listObjects.join(',')).join('\n'))
      ++numVariantes
    }
  }
  console.log('numVariantes = ' + numVariantes)
  */
  
  const allPathsArray = Object.keys(allPaths)
  const allChains = {}
  for (let seqPath of allPathsArray) {
    const chains = seqPath.split('CHOIX')
    for (let chain of chains) {
      if (chain.charAt(0) === ',') {
        chain = chain.slice(1)
      }
      if (chain.charAt(chain.length - 1) === ',') {
        chain = chain.slice(0, chain.length - 1)
      }
      allChains[chain] = true
    }
  }

  const allChainsArray = Object.keys(allChains)
  console.log('num paths: ' + allPathsArray.length)
  console.log('num cycles: ' + cycles.length)
  console.log('num chains: ' + allChainsArray.length)
  console.log('newSequences = ' + newSequences.length)
  console.log('uuidMap len = ' + uuidMap.size)

  checkTree(newSequences, newSequences.find(x => x.id === story.firstSequence), uuidMap)

  let numSimplified = 0
  do {
    const maybeUseless = []
    numSimplified = 0
    for (let seq of newSequences) {
      const lastChain = seq.chain[seq.chain.length - 1]
      if (lastChain.next) {
        ++numSimplified
        const key = getSequenceKey(lastChain.next, lastChain.listObjects)
        const seqUuid = uuidMap.get(key)
        if (!seqUuid) {
          console.log('key not found (' + key + ')')
          //console.log(newSequences.filter(x => x.id === lastChain.next))
          throw new Error('erreur')
        }
        maybeUseless.push(key)
        const linkSeq = newSequences.find(s => s.uuid === seqUuid)
        if (!linkSeq) {
          console.log('sequence not found (' + seqUuid + ')')
          //console.log(seq)
          throw new Error('erreur')
        }

        let objects = [...lastChain.listObjects]
        for (let ch of linkSeq.chain) {
          if (ch.action && ch.action.params) {
            if (objects.includes(ch.action.params)) {
              objects = objects.filter(x => x !== ch.action.params)
            } else {
              objects.push(ch.action.params)
            }
          }
        }
        objects.sort((a, b) => b - a)
        seq.chain = [...seq.chain, ...linkSeq.chain] // clonedeep(linkSeq.chain)] ?
        seq.chain[seq.chain.length - 1] = {
          ...seq.chain[seq.chain.length - 1], 
          listObjects: objects
        }
      }
    }
    console.log('chainToSimplify = ' + numSimplified)
    /*
    console.log('chainToSimplify = ' + numSimplified + ' / ' + newSequences.length)
    let deletedSeq = 0
    for (let maybeUselessSeq of maybeUseless) {
      let shouldDelete = true
      for (let newSeq of newSequences) {
        const lastChain = newSeq.chain[newSeq.chain.length - 1]
        if (lastChain.choices && lastChain.choices.length > 0) {
          for (let c of lastChain.choices) {
            if (getSequenceKey(c.next, c.listObjects) === maybeUselessSeq) {
              shouldDelete = false
            }
          }
        } else {
          if (getSequenceKey(lastChain.next, lastChain.listObjects) === maybeUselessSeq) {
            shouldDelete = false
          }
        }
      }
      if (shouldDelete) {
        ++deletedSeq
        const key = uuidMap.get(maybeUselessSeq)
        newSequences = newSequences.filter(s => s.uuid !== key)
      }
    }
    console.log('deleted sequences = ' + deletedSeq)
    */
  } while (numSimplified > 0)

  const uniqueSequenceArray = checkTree(newSequences, newSequences.find(x => x.id === story.firstSequence), uuidMap)
  //console.log(uniqueSequenceArray)
  /*
  console.log(uniqueSequenceArray.map(s => {
    const lastChain = s.chain[s.chain.length - 1]
    const choices = (lastChain.choices || []).map(c => {
      const UUID = uuidMap.get(getSequenceKey(c.next, c.listObjects))
      return `\n\t-> ${c.next} (${UUID})`
    })
    const final = lastChain.final ? `\n\t-> END` : ''
    return `${s.id} (${s.uuid})${choices}${final}`
  }).join('\n'))
  */

  const oldLength = newSequences.length
  newSequences = uniqueSequenceArray
  console.log('removed ' + (oldLength - newSequences.length) + ' unusued sequences') 

  const soundsList = {}
  const sequencesDescriptor = newSequences
    .map(seq => {
      const loops = seq.chain.map(ch => ch.soundLoop && ch.soundLoop.sound)
      let currentSound = null
      for (let i = 0; i < loops.length; ++i) {
        const loop = loops[i]
        if (currentSound !== loop) {
          currentSound = loop
        } else {
          loops[i] = null
        }
      }
      soundsList[seq.chain.map(ch => ch.id).join(',')] = true
      return {
        id: seq.uuid,
        list: seq.chain.map(ch => ch.id),
        effects: seq.chain.map(ch => ch.soundSfx && ch.soundSfx.sound),
        loops
      }
    })

  console.log('num soundsList = ' + Object.keys(soundsList).length)

  return { sequencesDescriptor, uuidSequencesMap: uuidMap, sequences: newSequences }
}