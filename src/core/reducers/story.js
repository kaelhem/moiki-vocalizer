import { types as appTypes } from 'core/reducers/app'

export const types = {
  IMPORT: 'moiki-voc/story/IMPORT',
  IMPORT_SUCCESS: 'moiki-voc/story/IMPORT_SUCCESS',
  IMPORT_ERROR: 'moiki-voc/story/IMPORT_ERROR',
  CLEAR: 'moiki-voc/story/CLEAR'
}

const initialState = {
  pending: false,
  error: null,
  story: null
}

export default function storyReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.IMPORT: {
      return {
        ...state,
        story: null,
        error: null,
        pending: true
      }
    }
    case types.IMPORT_ERROR: {
      return {
        ...state,
        error: action.payload,
        story: null,
        pending: false
      }
    }
    case types.IMPORT_SUCCESS: {
      return {
        ...state,
        story: action.payload,
        error: null,
        pending: false
      }
    }
    case appTypes.READY:
    case types.CLEAR: {
      console.log(action.type)
      return initialState
    }
    default:
      return state
  }
}

export const actions = {
  import: (file) => ({type: types.IMPORT, payload: file}),
  clear: () => ({type: types.CLEAR })
}

export const messages = {
  importError: (error) => ({type: types.IMPORT_ERROR, payload: error}),
  importSuccess: (data) => ({type: types.IMPORT_SUCCESS, payload: data}),
}

export const selectors = {
  importPending: (state) => state.story.pending,
  importError: (state) => state.story.error,
  story: (state) => state.story.story
}