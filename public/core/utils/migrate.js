const CURRENT_SCHEMA_VERSION = 3

const fromCommon = (story) => {
  const {_id, meta, firstSequence, sequences, themes=[], assets=[], sounds=[], counters=[], images=[], socialClub=null} = story
  return {
    _id,
    meta,
    themes,
    firstSequence: firstSequence || (sequences && sequences.length > 0 ? sequences[0].id : 'intro'),
    sequences: sequences && sequences.length > 0 ? sequences : [{
      id: 'intro',
      content: ''
    }],
    counters,
    assets,
    sounds,
    images
  }
}

const fromV3 = (story) => {
  return fromCommon(story)
}

const fromV2 = (story) => {
  const converted = fromCommon(story)
  return {
    ...converted,
    themes: [
      { ...story.theme, identifier: 'default', idName: 'default'}
    ]
  }
}

const fromV1 = (story) => {
  const converted = fromCommon(story)
  return {
    ...converted,
    meta: {
      ...converted.meta,
      simplified: true
    },
    themes: [
      { ...story.theme, identifier: 'default', idName: 'default'}
    ],
    sequences: converted.sequences.map((s) => {
      const {_doc} = s
      const {action, condition, ...seq} = (_doc || s)
      if (action && action.params) {
        seq.actions = [{
          kind: 'object',
          params: {
            target: action.params,
            modifier: 'toggle'
          }
        }]
      }
      if (condition && condition.params && condition.next) {
        seq.conditions = [{
          kind: 'object',
          query: {
            params: [{
              target: condition.params,
              condition: 'with'
            }]
          },
          next: condition.next
        }]
      }
      if (seq.choices && seq.choices.length > 0) {
        seq.choices = seq.choices.map((c) => {
          const {_doc:chDoc} = c
          const {action:chAction, condition:chCond, ...ch} = (chDoc || c)
          if (chAction && chAction.params) {
            ch.actions = [{
              kind: 'object',
              params: {
                target: chAction.params,
                modifier: 'toggle'
              }
            }]
          }
          if (chCond && chCond.params && chCond.next) {
            ch.conditions = [{
              kind: 'object',
              query: {
                params: [{
                  target: chCond.params,
                  condition: 'with'
                }]
              },
              next: chCond.next
            }]
          }
          return ch
        })
      }
      return seq
    })
  }
}

module.exports = {
  migrate: (story) => {
    const storyVersion = story.meta.version || 1
    story.meta.version = CURRENT_SCHEMA_VERSION
    switch (storyVersion) {
      case 1: return fromV1(story)
      case 2: return fromV2(story)
      default: return fromV3(story)
    }
  }
}