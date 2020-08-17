import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import { reducer as toastr } from 'react-redux-toastr'
import app from './app'
import projects from './projects'
import story from './story'
import settings from 'core/reducers/settings'

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  toastr,
  app,
  projects,
  story,
  settings
})

export default createRootReducer