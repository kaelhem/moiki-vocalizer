import { combineReducers } from 'redux'
import { connectRouter } from 'connected-react-router'
import app from './app'
import projects from './projects'
import story from './story'

const createRootReducer = (history) => combineReducers({
  router: connectRouter(history),
  app,
  projects,
  story
})

export default createRootReducer