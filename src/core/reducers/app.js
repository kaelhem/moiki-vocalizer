export const types = {
  SETUP: 'moiki-voc/app/SETUP',
  READY: 'moiki-voc/app/READY',
  SHOW_STARTUP_SCREEN: 'moiki-voc/app/SHOW_STARTUP_SCREEN',
  // ffmpeg
  FFMPEG_DOWNLOAD: 'moiki-voc/app/FFMPEG_DOWNLOAD',
  FFMPEG_DOWNLOAD_PROGRESS: 'moiki-voc/app/FFMPEG_DOWNLOAD_PROGRESS',
  FFMPEG_DOWNLOAD_ERROR: 'moiki-voc/app/FFMPEG_DOWNLOAD_ERROR',
  FFMPEG_DOWNLOAD_SUCCESS: 'moiki-voc/app/FFMPEG_DOWNLOAD_SUCCESS',
  // microphone
  MICROPHONE_ACCESS: 'moiki-voc/app/MICROPHONE_ACCESS',
  MICROPHONE_ACCESS_SUCCESS: 'moiki-voc/app/MICROPHONE_ACCESS_SUCCESS',
  MICROPHONE_ACCESS_ERROR: 'moiki-voc/app/MICROPHONE_ACCESS_ERROR'
}

const initialState = {
  status: {
    microphoneReady: false,
    ffmpegReady: false
  },
  ready: false,
  showStartupScreen: false
}

export default function appReducer(state = initialState, action = {}) {
  switch (action.type) {
    case types.SETUP: {
      return {
        ...state,
        status: action.payload,
      }
    }
    case types.SHOW_STARTUP_SCREEN: {
      return {
        ...state,
        showStartupScreen: true
      }
    }
    case types.READY: {
      return {
        ...state,
        ready: true,
        showStartupScreen: false
      }
    }
    case types.FFMPEG_DOWNLOAD_PROGRESS: {
      return {
        ...state,
        status: {
          ...state.status,
          ffmpegProgress: action.payload
        }
      }
    }
    case types.FFMPEG_DOWNLOAD_ERROR: {
      return {
        ...state,
        status: {
          ...state.status,
          ffmpegProgress: null,
          ffmpegError: action.payload
        }
      }
    }
    case types.FFMPEG_DOWNLOAD_SUCCESS: {
      return {
        ...state,
        status: {
          ...state.status,
          ffmpegProgress: null,
          ffmpegError: null,
          ffmpegReady: true
        }
      }
    }
    case types.MICROPHONE_ACCESS_SUCCESS: {
      return {
        ...state,
        status: {
          ...state.status,
          microphoneReady: true
        }
      }
    }
    case types.MICROPHONE_ACCESS_ERROR: {
      return {
        ...state,
        status: {
          ...state.status
        }
      }
    }
    default:
      return state
  }
}

export const actions = {
  ffmpegDownload: () => ({type: types.FFMPEG_DOWNLOAD }),
  microphoneAccess: () => ({type: types.MICROPHONE_ACCESS }),
  setupCompleted: () => ({type: types.READY }),
}

export const messages = {
  setup: (status) => ({type: types.SETUP, payload: status}),
  ready: () => ({type: types.READY}),
  showStartupScreen: () => ({type: types.SHOW_STARTUP_SCREEN}),
  ffmpegProgress: (percent) => ({type: types.FFMPEG_DOWNLOAD_PROGRESS, payload: percent}),
  ffmpegError: (err) => ({type: types.FFMPEG_DOWNLOAD_ERROR, payload: err}),
  ffmpegSuccess: () => ({type: types.FFMPEG_DOWNLOAD_SUCCESS}),
  microphoneSuccess: () => ({type: types.MICROPHONE_ACCESS_SUCCESS}),
  microphoneError: () => ({type: types.MICROPHONE_ACCESS_ERROR}),
}

export const selectors = {
  ready: (state) => state.app.ready
}