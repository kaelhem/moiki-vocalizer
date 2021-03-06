import { all, fork, takeEvery, put, take, select, race } from 'redux-saga/effects'
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

export function *exportSaga(action) {
  try {
    const story = yield select(storySelectors.story)
    switch (action.type) {
      case storyTypes.EXPORT_STUDIO: {
        yield put(ipcSend('export-to-studio', story))
        break
      }
      default: {
        yield put(ipcSend('export-to-html', story))
      }
    }
    let isFinished = false
    let payload = null
    while (!isFinished) {
      const {progress, error, exported} = yield race({
        progress: take('story-export-status'),
        error: take('story-export-status-error'),
        exported: take('story-exported'),
        cancel: take(storyTypes.EXPORT_CANCEL)
      })
      if (exported) {
        isFinished = true
        payload = exported.payload
      } else if (error) {
        isFinished = true
        payload = [new Error('Oops, certains fichiers n\'ont pas pu être exportés correctement !')]
        yield put(storyMessages.exportPending({status: error.payload[0], error: true}))
      } else if (progress) {
        const [status, message=null] = progress.payload
        yield put(storyMessages.exportPending({status, message}))
      } else {
        isFinished = true
        yield put(ipcSend('story-export-cancel'))
        return
      }
    }

    const [error, filePath] = payload
    if (error) {
      throw error
    }
    yield put(storyMessages.exportSuccess(filePath))
    yield put(toastrActions.add({type: 'info', title: 'Export terminé', message: `Fichier exporté : ${filePath}.`}))
  } catch (e) {
    console.log(e)
    yield put(storyMessages.exportError())
    yield put(toastrActions.add({type: 'error', title: 'Echec de l\'export', message: e.message}))
  }
}

export function *clearSaga() {
  yield put(navigateTo('/projects'))
}

// -- watchers

export function *watchLoad() {
  yield takeEvery(storyTypes.LOAD, loadSaga)
}

export function *watchImport() {
  yield takeEvery(storyTypes.IMPORT, importSaga)
}

export function *watchExport() {
  yield takeEvery([
    storyTypes.EXPORT_STUDIO,
    storyTypes.EXPORT_HTML
  ], exportSaga)
}

export function *watchClear() {
  yield takeEvery(storyTypes.CLEAR, clearSaga)
}

// -- init

export function *storySaga() {
  yield all([
    fork(watchLoad),
    fork(watchImport),
    fork(watchExport),
    fork(watchClear),
  ])
}