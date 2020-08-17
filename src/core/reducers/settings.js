export const types = {
  // voices
  ADD_VOICE: 'moiki-voc/settings/ADD_VOICE',
  REMOVE_VOICE: 'moiki-voc/settings/REMOVE_VOICE',
  SET_DEFAULT_VOICE: 'moiki-voc/settings/SET_DEFAULT_VOICE',
  UPDATE_VOICE: 'moiki-voc/settings/UPDATE_VOICE'
}

const initialState = {
  speech: {
    voices: [],
    defaultVoice: null
  }
}

export default function settingsReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.ADD_VOICE: {
      let defaultVoice = state.speech.defaultVoice || action.payload.id
      return {
        ...state,
        speech: {
          ...state.speech,
          voices: [...state.speech.voices, action.payload],
          defaultVoice
        }
      }
    }
    case types.REMOVE_VOICE: {
      const voices = state.speech.voices.filter(x => x.id !== action.payload)
      const defaultVoice = action.payload === state.speech.defaultVoice ? (voices.length > 0 ? voices[0].id : null) : state.speech.defaultVoice
      return {
        ...state,
        speech: {
          ...state.speech,
          voices: voices,
          defaultVoice
        }
      }
    }
    case types.SET_DEFAULT_VOICE: {
      return {
        ...state,
        speech: {
          ...state.speech,
          defaultVoice: action.payload
        }
      }
    }
    case types.UPDATE_VOICE: {
      const voice = action.payload
      const voices = state.speech.voices.map(x => x.id === voice.id ? voice : x)
      return {
        ...state,
        speech: {
          ...state.speech,
          voices
        }
      }
    }
    default:
      return state
  }
}

export const actions = {
  addVoice: (newVoice) => ({type: types.ADD_VOICE, payload: newVoice}),
  removeVoice: (id) => ({type: types.REMOVE_VOICE, payload: id}),
  setDefaultVoice: (id) => ({type: types.SET_DEFAULT_VOICE, payload: id}),
  updateVoice: (voice) => ({type: types.UPDATE_VOICE, payload: voice})
}

export const selectors = {
  getDefaultVoice: ({settings}) => settings.speech.voices.length > 0 ? settings.speech.voices.find(({id}) => id === settings.speech.defaultVoice) : null
}