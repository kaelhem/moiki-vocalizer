import { types as appTypes } from 'core/reducers/app'

export const types = {
  LOAD: 'moiki-voc/story/LOAD',
  LOADED: 'moiki-voc/story/LOADED',
  IMPORT: 'moiki-voc/story/IMPORT',
  IMPORT_SUCCESS: 'moiki-voc/story/IMPORT_SUCCESS',
  IMPORT_ERROR: 'moiki-voc/story/IMPORT_ERROR',
  EXPORT_STUDIO: 'moiki-voc/story/EXPORT_STUDIO',
  EXPORT_HTML: 'moiki-voc/story/EXPORT_HTML',
  EXPORT_SUCCESS: 'moiki-voc/story/EXPORT_SUCCESS',
  EXPORT_ERROR: 'moiki-voc/story/EXPORT_ERROR',
  EXPORT_PENDING: 'moiki-voc/story/EXPORT_PENDING',
  EXPORT_CANCEL: 'moiki-voc/story/EXPORT_CANCEL',
  CLEAR: 'moiki-voc/story/CLEAR'
}

const initialState = {
  pending: false,
  error: null,
  story: null,
  pendingExport: false,
  errorExport: null,
  exportPath: null,
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
    case types.LOADED :
    case types.IMPORT_SUCCESS: {
      return {
        ...state,
        story: action.payload,
        error: null,
        pending: false
      }
    }
    case types.EXPORT_HTML: 
    case types.EXPORT_STUDIO: {
      return {
        ...state,
        pendingExport: {
          status: 1
        },
        errorExport: null
      }
    }
    case types.EXPORT_PENDING: {
      return {
        ...state,
        pendingExport: action.payload
      }
    }
    case types.EXPORT_ERROR: {
      return {
        ...state,
        //pendingExport: false,
        errorExport: action.payload,
      }
    }
    case types.EXPORT_SUCCESS: {
      return {
        ...state,
        pendingExport: false,
        errorExport: null,
        exportPath: action.payload
      }
    }
    case types.EXPORT_CANCEL: {
      return {
        ...state,
        pendingExport: false,
        errorExport: null,
        exportPath: null
      }
    }
    case appTypes.READY:
    case types.CLEAR: {
      return initialState
    }
    default:
      return state
  }
}

export const actions = {
  load: (name) => ({type: types.LOAD, payload: name}),
  import: (file) => ({type: types.IMPORT, payload: file}),
  exportCancel: () => ({type:types.EXPORT_CANCEL}),
  exportToStudio: () => ({type: types.EXPORT_STUDIO}),
  exportToHtml: () => ({type: types.EXPORT_HTML}),
  clear: () => ({type: types.CLEAR })
}

export const messages = {
  loaded: (data) => ({type: types.LOADED, payload: data}),
  importError: (error) => ({type: types.IMPORT_ERROR, payload: error}),
  importSuccess: (data) => ({type: types.IMPORT_SUCCESS, payload: data}),
  exportError: (error) => ({type: types.EXPORT_ERROR, payload: error}),
  exportSuccess: (data) => ({type: types.EXPORT_SUCCESS, payload: data}),
  exportPending: (data) => ({type: types.EXPORT_PENDING, payload: data})
}

export const selectors = {
  importPending: (state) => state.story.pending,
  importError: (state) => state.story.error,
  exportPending: (state) => state.story.pendingExport,
  exportError: (state) => state.story.errorExport,
  story: (state) => state.story.story
}