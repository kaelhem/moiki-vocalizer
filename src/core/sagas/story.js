import { all, fork, takeEvery, put, take } from 'redux-saga/effects'
import { send as ipcSend } from 'redux-electron-ipc'
import { push as navigateTo } from 'connected-react-router'
import {
  types as storyTypes,
  messages as storyMessages
} from 'core/reducers/story'

export function *importZip(zipData) {
  try {
    yield put(ipcSend('import-story', zipData))
    const { payload } = yield take('project-created')
    const [project] = payload
    yield put(storyMessages.importSuccess(project))
    yield put(navigateTo('/story'))
  } catch (e) {
    console.log(e.message)
    yield put(storyMessages.importError('This file is not in the correct format!'))
  }
}

export function *importSaga(action) {
  const {ext, content} = action.payload
  switch (ext) {
    case 'zip':
      yield *importZip(content)
    break
    default:
      yield put(storyMessages.importError('This file is not in the correct format!'))
  }
}



export function *clearSaga() {
  yield put(navigateTo('/'))
}

// -- watchers

export function *watchImport() {
  yield takeEvery(storyTypes.IMPORT, importSaga)
}

export function *watchClear() {
  yield takeEvery(storyTypes.CLEAR, clearSaga)
}

// -- init

export function *storySaga() {
  yield all([
    fork(watchImport),
    fork(watchClear),
  ])
}