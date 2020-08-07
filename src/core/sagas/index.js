import { all, fork } from 'redux-saga/effects'
import { appSaga } from './app'
import { projectsSaga } from './projects'
import { storySaga } from './story'

function *mainSaga() {
  yield all([
    fork(appSaga),
    fork(projectsSaga),
    fork(storySaga)
  ])
}

export default () => all([
  fork(mainSaga)
])