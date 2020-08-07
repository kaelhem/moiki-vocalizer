export const types = {
  LIST: 'moiki-voc/projects/LIST',
  LIST_SUCCESS: 'moiki-voc/projects/LIST_SUCCESS',
  LIST_ERROR: 'moiki-voc/projects/LIST_ERROR',
  REMOVE: 'moiki-voc/projects/REMOVE'
}

const initialState = {
  pending: false,
  error: null,
  list: null
}

export default function storyReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.LIST: {
      return {
        ...state,
        list: null,
        error: null,
        pending: true
      }
    }
    case types.LIST_ERROR: {
      return {
        ...state,
        error: action.payload,
        list: null,
        pending: false
      }
    }
    case types.LIST_SUCCESS: {
      return {
        ...state,
        list: action.payload,
        error: null,
        pending: false
      }
    }
    default:
      return state
  }
}

export const actions = {
  getList: () => ({ type: types.LIST }),
  remove: (projectId) => ({type: types.REMOVE, payload: projectId})
}

export const messages = {
  listError: (error) => ({type: types.LIST_ERROR, payload: error}),
  listSuccess: (data) => ({type: types.LIST_SUCCESS, payload: data}),
}

export const selectors = {
  listPending: (state) => state.projects.pending,
  listError: (state) => state.projects.error,
  list: (state) => state.projects.list
}