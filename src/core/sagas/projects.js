import { all, fork, take, takeEvery, put, select } from 'redux-saga/effects'
import { send as ipcSend } from 'redux-electron-ipc'
import { types as projectsTypes, messages as projectsMessages } from 'core/reducers/projects'
import {
  types as storyTypes,
  actions as storyActions,
  selectors as storySelectors
} from 'core/reducers/story'

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

export function *removeSaga(action) {
  const openedStory = yield select(storySelectors.story)
  if (openedStory && openedStory.projectInfo.folderName === action.payload.folderName) {
    yield put(storyActions.clear())
  }
  yield put(ipcSend('remove-project', action.payload))
  console.log('removing...')
  const data = yield take('project-removed')
  console.log('removed ok')
  console.log(data)
  window.location.reload()
}

// -- watchers

export function *watchList() {
  yield takeEvery([projectsTypes.LIST, storyTypes.IMPORT_SUCCESS], listSaga)
}

export function *watchRemove() {
  yield takeEvery(projectsTypes.REMOVE, removeSaga)
}
// -- init

export function *projectsSaga() {
  yield all([
    fork(watchList),
    fork(watchRemove)
  ])
}