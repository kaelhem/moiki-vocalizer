export const types = {
  READY: 'moiki-voc/app/READY'
}

const initialState = {
  ready: false
}

export default function appReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.READY: {
      return {
        ...state,
        ready: true
      }
    }
    default:
      return state
  }
}

export const messages = {
  ready: () => ({type: types.READY})
}

export const selectors = {
  ready: (state) => state.app.ready
}