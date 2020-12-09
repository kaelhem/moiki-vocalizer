const uuid = require('uuid')
const { utils } = require('moiki-exporter')
const clonedeep = require('lodash.clonedeep')

const { simplifyStory } = utils

const getSequenceKey = (id, objects) => id + ':' + objects.join('@')

const getLinksForSequence = (sequence) => {
  const links = {}
  if (sequence.next) {
    links[sequence.next] = { kind: 'simple', action: sequence.actions && sequence.actions.length === 1 ? sequence.actions[0].params.target : null }
  }
  if (sequence.conditions && sequence.conditions.length === 1 && sequence.conditions[0].next) {
    links[sequence.conditions[0].next] = { kind: 'simple', condition: sequence.conditions[0].query.params[0].target }
  }
  if (sequence.choices && sequence.choices.length > 0) {
    let chIdx = 0
    for (let choice of sequence.choices) {
      if (choice.next) {
        links[choice.next] = { kind: 'choice', choiceIndex: chIdx, action: choice.actions && choice.actions.length === 1 ? choice.actions[0].params.target : null }
      }
      if (choice.conditions && choice.conditions.length === 1 && choice.conditions[0].next) {
        links[choice.conditions[0].next] = { kind: 'choice', choiceIndex: chIdx, condition: choice.conditions[0].query.params[0].target }
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
    newSequences.push(copySequence)
    storyPath.push(key)
    history.push(currentUuid)
    let objects = [...listObjects]
    let lastChain = null
    for (let ch of copySequence.chain) {
      if (ch.actions && ch.actions.length === 1) {
        if (objects.includes(ch.actions[0].params.target)) {
          objects = objects.filter(x => x !== ch.actions[0].params.target)
        } else {
          objects = [...objects, ch.actions[0].params.target]
        }
      }
      lastChain = ch
    }
    objects.sort((a, b) => b - a)

    lastChain.listObjects = [...objects]
    if (lastChain.next) {
      if (lastChain.conditions && lastChain.conditions.length === 1 && objects.includes(lastChain.conditions[0].query.params[0].target)) {
        lastChain.next = lastChain.conditions[0].next
      }
      if (lastChain.conditions) {
        delete lastChain.conditions
      }
      //console.log('here', lastChain.next, ': line 151')
      removeConditions(sequences.find(({id}) => id === lastChain.next), [...objects], [...storyPath], [...history])
    } else if (lastChain.choices && lastChain.choices.length > 0) {
      for (let choice of lastChain.choices) {
        let newObjects = [...objects]
        if (choice.actions && choice.actions.length === 1) {
          if (objects.includes(choice.actions[0].params.target)) {
            newObjects = objects.filter(x => x !== choice.actions[0].params.target)
          } else {
            newObjects = [...objects, choice.actions[0].params.target]
          }
        }
        if (choice.conditions && choice.conditions.length === 1 && newObjects.includes(choice.conditions[0].query.params[0].target)) {
          choice.next = choice.conditions[0].next
        }
        if (choice.conditions) {
          delete choice.conditions
        }
        choice.listObjects = [...newObjects]
        //console.log('here', choice.next, ': line: 171', sequences.map(x => x.id).join(';'))
        removeConditions(sequences.find(({id}) => id === choice.next), [...newObjects], [...storyPath, 'CHOIX'], [...history])
      }
    } else {
      allPaths[storyPath.join(',')] = { data: history, path: storyPath }
    }
  }
  //console.log('here', story.firstSequence, ': line 178')
  removeConditions(sequences.find(({id}) => id === story.firstSequence))
  
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
      //allChains[chain] = true

      const listSeq = chain.split(',')
      let currentList = []
      for (let seq of listSeq) {
        currentList.push(seq)
        if (seq.actions && seq.actions.length === 1) { // seq.action ?????????
          allChains[currentList.join(',')] = true
          currentList = []
        }
      }
      if (currentList.length > 0) {
        allChains[currentList.join(',')] = true
      }
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
          if (ch.actions && ch.actions.length === 1) {
            if (objects.includes(ch.actions[0].params.target)) {
              objects = objects.filter(x => x !== ch.actions[0].params.target)
            } else {
              objects.push(ch.actions[0].params.target)
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
    console.log('chains simplified = ' + numSimplified)
  } while (numSimplified > 0)

  const uniqueSequenceArray = checkTree(newSequences, newSequences.find(x => x.id === story.firstSequence), uuidMap)
  if (newSequences.length !== uniqueSequenceArray.length) {
    console.log('removed ' + (newSequences.length - uniqueSequenceArray.length) + ' unusued sequences') 
  }

  // cut sequences when win / lose objects
  const cutSequences = []
  for (let seq of uniqueSequenceArray) {
    const lastChain = seq.chain[seq.chain.length - 1]
    let currentChain = []
    let cutted = false
    for (let item of seq.chain) {
      currentChain.push(item)
      if (item.action) {
        item.listObjects = lastChain.listObjects
        const cutSeqId = cutted ? currentChain[0].id : seq.id
        const cutSeqObjects = cutted ? lastChain.listObjects : seq.listObjects
        const cutSeq = getSequenceUUID(cutSeqId, cutSeqObjects)
        cutSequences.push({
          id: cutSeqId,
          uuid: cutSeq.id,
          listObjects: cutSeqObjects,
          chain: currentChain
        })
        currentChain = []
        cutted = true
      }
    }
    if (!cutted) {
      cutSequences.push(seq)
    } else if (currentChain.length > 0) {
      const [firstChain] = currentChain
      const { id } = getSequenceUUID(firstChain.id, lastChain.listObjects)
      cutSequences.push({
        id: firstChain.id,
        uuid: id,
        listObjects: lastChain.listObjects,
        chain: currentChain
      })
    }
  }

  const cutSequenceClean = checkTree(cutSequences, cutSequences.find(x => x.id === story.firstSequence), uuidMap)
  if (cutSequences.length !== cutSequenceClean.length) {
    console.log('removed ' + (cutSequences.length - cutSequenceClean.length) + ' unusued sequences') 
  }
  
  const soundsList = {}
  const sequencesDescriptor = cutSequenceClean
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
        action: seq.chain[seq.chain.length - 1].action,
        list: seq.chain.map(ch => ch.id),
        effects: seq.chain.map(ch => ch.soundSfx && ch.soundSfx.sound),
        loops
      }
    })

  console.log('num soundsList = ' + Object.keys(soundsList).length)

  return { sequencesDescriptor, uuidSequencesMap: uuidMap, sequences: cutSequenceClean, variables }
}