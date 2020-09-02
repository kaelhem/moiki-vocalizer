const kebabCase = require('lodash.kebabcase')

const createJson = (story, descriptor) => {
  const { uuidSequencesMap, sequences, variables } = descriptor
  const nodes = []
  for (let s of sequences) {
    const lastChain = s.chain[s.chain.length - 1]
    if (lastChain.final || (!lastChain.choices && !lastChain.next)) {
      // TODO: lastChain.isHappyEnd ?
      nodes.push({
        id: s.uuid,
        type: 'final',
        name: 'Fin',
        isHappyEnd: lastChain.isHappyEnd || false,
        audio: s.vocals,
        listObjects: s.listObjects
      })
    } else if (lastChain.action) {
      nodes.push({
        id: s.uuid,
        type: 'simple',
        name: s.id + ' - ' + s.uuid,
        audio: s.vocals,
        next: s.uuid + '-object',
        listObjects: s.listObjects
      })
      const linkUUID = uuidSequencesMap.get(lastChain.next + ':' + lastChain.listObjects.join('@'))
      nodes.push({
        id: s.uuid + '-object',
        type: 'object',
        name: variables[lastChain.action.params].label,
        desc: variables[lastChain.action.params].desc,
        assetId: lastChain.action.params,
        image: kebabCase(variables[lastChain.action.params].label) + '_obj.svg',
        audio: kebabCase(variables[lastChain.action.params].label) + '_obj.mp3',
        next: linkUUID,
        listObjects: s.listObjects
      })
    } else {
      nodes.push({
        id: s.uuid,
        type: 'choices',
        name: s.id + ' - ' + s.uuid,
        audio: s.vocals,
        choices: lastChain.choices.map((_, idx) => s.uuid + '-choice-' + idx),
        listObjects: s.listObjects
      })
      lastChain.choices.forEach((ch, idx) => {
        const linkUUID = uuidSequencesMap.get(ch.next + ':' + ch.listObjects.join('@'))
        if (ch.action) {
          nodes.push({
            id: s.uuid + '-choice-' + idx + '-object',
            type: 'object',
            name: variables[ch.action.params].label,
            desc: variables[ch.action.params].desc,
            assetId: ch.action.params,
            image: kebabCase(variables[ch.action.params].label) + '_obj.svg',
            audio: kebabCase(variables[ch.action.params].label) + '_obj.mp3',
            next: linkUUID,
            listObjects: s.listObjects
          })
          nodes.push({
            id: s.uuid + '-choice-' + idx,
            type: 'simple',
            name: ch.content,
            audio: ch.vocals,
            next: s.uuid + '-choice-' + idx + '-object',
            listObjects: s.listObjects
          })
        } else {
          nodes.push({
            id: s.uuid + '-choice-' + idx,
            type: 'simple',
            name: ch.content,
            audio: ch.vocals,
            next: linkUUID,
            listObjects: s.listObjects
          })
        }
      })
    }
  }
  
  return {
    theme: story.theme,
    meta: story.meta,
    assets: story.assets,
    sounds: story.sounds,
    firstSequence: nodes.length > 0 ? nodes[0].id : null,
    nodes
  }
}

module.exports = {
  createJson
}