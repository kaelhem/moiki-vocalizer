import { all, fork, take, put, select } from 'redux-saga/effects'
import { send as ipcSend } from 'redux-electron-ipc'
import { messages as appMesages } from 'core/reducers/app'
import { selectors as storySelectors } from 'core/reducers/story'
import { LOCATION_CHANGE, push as navigateTo, getLocation } from 'connected-react-router'

// -- watchers

export function *setup() {
  yield take('persist/REHYDRATE')
  yield put(ipcSend('ffmpeg-download'))
  yield take('ffmpeg-ready')
  yield put(appMesages.ready())
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
// -- init

export function *appSaga() {
  yield all([
    fork(setup),
    fork(watchInitialLoad)
  ])
}