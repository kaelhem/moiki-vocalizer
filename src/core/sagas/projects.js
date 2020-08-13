import { all, fork, take, takeEvery, put } from 'redux-saga/effects'
import { send as ipcSend } from 'redux-electron-ipc'
import { types as storyTypes } from 'core/reducers/story'
import { types as projectsTypes, messages as projectsMessages } from 'core/reducers/projects'

export function *listSaga() {
  yield put(ipcSend('get-projects-list'))
  const { payload } = yield take('projects-list')
  try {
    const [error, projects] = payload
    if (error) {
      throw error
    }
    yield put(projectsMessages.listSuccess(projects))
  } catch (e) {
    yield put(projectsMessages.listError(e))
  }
}

// -- watchers

export function *watchList() {
  yield takeEvery([projectsTypes.LIST, storyTypes.IMPORT_SUCCESS], listSaga)
}
// -- init

export function *projectsSaga() {
  yield all([
    fork(watchList)
  ])
}