const uuid = require('uuid')
const kebabCase = require('lodash.kebabcase')

const createCoverNode = (name, linkTo) => ({
  uuid: uuid.v4(),
  type: 'cover',
  name: name,
  image: 'cover.png',
  audio: '_root.mp3',
  okTransition: {
    actionNode: linkTo,
    optionIndex: 0
  },
  homeTransition: null,
  controlSettings: {
     wheel: true,
     ok: true,
     home: false,
     pause: false,
     autoplay: false
  },
  squareOne: true
})

const createJson = (story, descriptor) => {
  const { uuidSequencesMap, sequences, variables } = descriptor
  const firstNode = sequences.find(x => x.id === story.firstSequence)
  const coverNode = createCoverNode(story.meta.name, firstNode.uuid + '-action')

  const actions = []
  const stages = []
  for (let s of sequences) {
    const lastChain = s.chain[s.chain.length - 1]
    if (lastChain.final || (!lastChain.choices && !lastChain.next)) {
      actions.push({
        id: s.uuid + '-action',
        type: 'story.storyaction',
        groupId: s.uuid,
        name: s.id + '-' + s.uuid + '.storyaction',
        options: [
          s.uuid + '-stage',
        ]
      })
      stages.push({
        uuid: s.uuid + '-stage',
        type: 'story',
        name: 'Fin',
        position: null,
        image: null,
        audio: s.vocals,
        okTransition: {
          actionNode: firstNode.uuid + '-action',
          optionIndex: 0
        },
        homeTransition: {
          actionNode: firstNode.uuid + '-action',
          optionIndex: 0
        },
        controlSettings: {
          wheel: false,
          ok: false,
          home: true,
          pause: true,
          autoplay: true
        },
        groupId: s.uuid
      })
    } else if (lastChain.action) {
      actions.push({
        id: s.uuid + '-action',
        type: 'menu.questionaction',
        groupId: s.uuid,
        name: s.id + '-' + s.uuid + '.questionaction',
        options: [
          s.uuid + '-stage',
        ]
      })
      actions.push({
        id: s.uuid + '-options',
        type: 'menu.optionsaction',
        groupId: s.uuid,
        name: s.id + '-' + s.uuid + '.optionaction',
        options: [s.uuid + '-object']
      })
      stages.push({
        uuid: s.uuid + '-stage',
        type: 'menu.questionstage',
        groupId: s.uuid,
        name: s.id + ' - ' + s.uuid,
        image: null,
        audio: s.vocals,
        okTransition: {
          actionNode: s.uuid + '-options',
          optionIndex: 0
        },
        homeTransition: null,
        controlSettings: {
          wheel: false,
          ok: false,
          home: false,
          pause: false,
          autoplay: true
        }
      })
      const linkUUID = uuidSequencesMap.get(lastChain.next + ':' + lastChain.listObjects.join('@'))
      stages.push({
        uuid: s.uuid + '-object',
        type: 'menu.optionstage',
        groupId: s.uuid,
        name: variables[lastChain.action.params].label,
        image: kebabCase(variables[lastChain.action.params].label) + '_obj.png',
        audio: kebabCase(variables[lastChain.action.params].label) + '_obj.mp3',
        okTransition: {
          actionNode: linkUUID + '-action',
          optionIndex: 0
        },
        homeTransition: null,
        controlSettings: {
          wheel: true,
          ok: true,
          home: true,
          pause: false,
          autoplay: false
        }
      })
    } else {
      actions.push({
        id: s.uuid + '-action',
        type: 'menu.questionaction',
        groupId: s.uuid,
        name: s.id + '-' + s.uuid + '.questionaction',
        options: [
          s.uuid + '-stage',
        ]
      })
      actions.push({
        id: s.uuid + '-options',
        type: 'menu.optionsaction',
        groupId: s.uuid,
        name: s.id + '-' + s.uuid + '.optionaction',
        options: lastChain.choices.map((_, idx) => s.uuid + '-choice-' + idx)
      })
      stages.push({
        uuid: s.uuid + '-stage',
        type: 'menu.questionstage',
        groupId: s.uuid,
        name: s.id + ' - ' + s.uuid,
        image: null,
        audio: s.vocals,
        okTransition: {
          actionNode: s.uuid + '-options',
          optionIndex: 0
        },
        homeTransition: null,
        controlSettings: {
          wheel: false,
          ok: false,
          home: false,
          pause: false,
          autoplay: true
        }
      })
      lastChain.choices.forEach((ch, idx) => {
        const linkUUID = uuidSequencesMap.get(ch.next + ':' + ch.listObjects.join('@'))
        if (ch.action) {
          actions.push({
            id: s.uuid + '-choice-' + idx + '-actionobject',
            type: 'menu.questionaction',
            groupId: s.uuid + '-object',
            name: s.id + '-' + s.uuid + '.questionaction',
            options: [
              s.uuid + '-choice-' + idx + '-object',
            ]
          })
          stages.push({
            id: s.uuid + '-choice-' + idx + '-object',
            type: 'menu.optionstage',
            groupId: s.uuid,
            name: ch.content,
            image: kebabCase(variables[ch.action.params].label) + '_obj.png',
            audio: kebabCase(variables[ch.action.params].label) + '_obj.mp3',
            okTransition: {
              actionNode: linkUUID + '-action',
              optionIndex: 0
            },
            homeTransition: null,
            controlSettings: {
              wheel: true,
              ok: true,
              home: true,
              pause: false,
              autoplay: false
            }
          })
          stages.push({
            uuid: s.uuid + '-choice-' + idx,
            type: 'menu.optionstage',
            groupId: s.uuid,
            name: ch.content,
            image: `question_${idx + 1}-${lastChain.choices.length}.png`,
            audio: ch.vocals,
            okTransition: {
              actionNode: s.uuid + '-choice-' + idx + '-actionobject',
              optionIndex: 0
            },
            homeTransition: null,
            controlSettings: {
              wheel: true,
              ok: true,
              home: true,
              pause: false,
              autoplay: false
            }
          })
        } else {
          stages.push({
            uuid: s.uuid + '-choice-' + idx,
            type: 'menu.optionstage',
            groupId: s.uuid,
            name: ch.content,
            image: `question_${idx + 1}-${lastChain.choices.length}.png`,
            audio: ch.vocals,
            okTransition: {
              actionNode: linkUUID + '-action',
              optionIndex: 0
            },
            homeTransition: null,
            controlSettings: {
              wheel: true,
              ok: true,
              home: true,
              pause: false,
              autoplay: false
            }
          })
        }
      })
    }
  }
  
  return {
    format: 'v1',
    title: story.meta.name,
    version: 1,
    description: story.meta.description + ' - Une histoire exportée avec Moiki Vocalizer',
    stageNodes: [coverNode, ...stages],
    actionNodes: [...actions]
  }
}

module.exports = {
  createJson
}