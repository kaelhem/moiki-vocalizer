import { all, fork, takeEvery, put, take, select } from 'redux-saga/effects'
import { send as ipcSend } from 'redux-electron-ipc'
import { actions as toastrActions } from 'react-redux-toastr'
import { push as navigateTo } from 'connected-react-router'
import {
  types as storyTypes,
  messages as storyMessages,
  selectors as storySelectors
} from 'core/reducers/story'

export function *loadSaga(action) {
  yield put(ipcSend('load-project', action.payload))
  const { payload } = yield take('project-loaded')
  const [error, project] = payload
  if (error) {
    throw error
  }
  yield put(storyMessages.loaded(project))
  yield put(navigateTo('/story'))
}

export function *importZip(zipData) {
  try {
    yield put(ipcSend('import-story', zipData))
    const { payload } = yield take('project-created')
    const [error, project] = payload
    if (error) {
      throw error
    }
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

export function *exportStudioSaga() {
  try {
    const story = yield select(storySelectors.story)
    yield put(ipcSend('export-to-studio', story))
    const {payload} = yield take('story-exported')
    const [error, filePath] = payload
    if (error) {
      throw error
    }
    yield put(storyMessages.exportSuccess())
    yield put(toastrActions.add({type: 'info', title: 'Export terminé', message: `Fichier exporté : ${filePath}.`}))
  } catch (e) {
    console.log(e)
    yield put(storyMessages.exportError())
    yield put(toastrActions.add({type: 'error', title: 'Echec de l\'export', message: e.message}))
  }
}

export function *clearSaga() {
  yield put(navigateTo('/'))
}

// -- watchers

export function *watchLoad() {
  yield takeEvery(storyTypes.LOAD, loadSaga)
}

export function *watchImport() {
  yield takeEvery(storyTypes.IMPORT, importSaga)
}

export function *watchExportStudio() {
  yield takeEvery(storyTypes.EXPORT_STUDIO, exportStudioSaga)
}

export function *watchClear() {
  yield takeEvery(storyTypes.CLEAR, clearSaga)
}

// -- init

export function *storySaga() {
  yield all([
    fork(watchLoad),
    fork(watchImport),
    fork(watchExportStudio),
    fork(watchClear),
  ])
}