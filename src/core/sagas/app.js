import { all, fork, take, takeEvery, put, select, race } from 'redux-saga/effects'
import { send as ipcSend } from 'redux-electron-ipc'
import { types as appTypes, messages as appMessages } from 'core/reducers/app'
import { selectors as storySelectors } from 'core/reducers/story'
import { LOCATION_CHANGE, push as navigateTo, getLocation } from 'connected-react-router'
import { actions as toastrActions } from 'react-redux-toastr'

// -- watchers

export function *setup() {
  yield take('persist/REHYDRATE')
  yield put(ipcSend('app-setup'))
  const {payload} = yield take('app-setup-response')
  const { microphoneReady, ffmpegReady } = payload[0]
  yield put(appMessages.setup({microphoneReady, ffmpegReady}))

  if (microphoneReady && ffmpegReady) {
    yield put(appMessages.ready())
  } else {
    yield put(appMessages.showStartupScreen())
  }
}

export function *ffmpegDownloadSaga() {
  yield put(appMessages.ffmpegProgress(0))
  yield put(ipcSend('ffmpeg-download'))
  let isDone = false
  while (!isDone) {
    const {progress, done} = yield race({
      progress: take('ffmpeg-download-progress'),
      done: take('ffmpeg-ready')
    })
    if (progress) {
      const [percent] = progress.payload
      yield put(appMessages.ffmpegProgress(percent))
    } else {
      isDone = true
      const [error] = done.payload
      if (error) {
        console.log('Cannot retrieve ffmpeg binaries. Please reload.')
        yield put(appMessages.ffmpegError(error))
        return
      } else {
        yield put(appMessages.ffmpegSuccess())
      }
    }
  }
}

export function *microphoneAccessSaga() {
  yield put(ipcSend('app-enable-microphone'))
  const {done} = yield race({
    done: take('microphone-ready'),
    cancel: take('microphone-cancel')
  })
  if (done) {
    yield put(appMessages.microphoneSuccess())
  } else {
    yield put(toastrActions.add({type: 'error', title: 'Microphone désactivé', message: 'Vous devez autorisez l\'accès au microphone pour utiliser Moiki Vocalizer'}))
    yield put(appMessages.microphoneError())
  }
}

export function *watchInitialLoad() {
  yield take('persist/REHYDRATE')
  yield take(LOCATION_CHANGE)
  const { pathname } = yield select(getLocation)
  const story = yield select(storySelectors.story)
  if (story) {
    if (pathname !== '/story') {
      yield put(navigateTo('/story'))
    }
  }
}

export function *watchFfmpegDownload() {
  yield takeEvery(appTypes.FFMPEG_DOWNLOAD, ffmpegDownloadSaga)
}

export function *watchMicrophoneAccess() {
  yield takeEvery(appTypes.MICROPHONE_ACCESS, microphoneAccessSaga)
}
// -- init

export function *appSaga() {
  yield all([
    fork(setup),
    fork(watchInitialLoad),
    fork(watchFfmpegDownload),
    fork(watchMicrophoneAccess),
  ])
}