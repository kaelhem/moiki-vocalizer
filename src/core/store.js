import { createStore, compose } from 'redux'
import { createHashHistory } from 'history'
import { persistStore, persistReducer } from 'redux-persist'
import createElectronStorage from 'redux-persist-electron-storage'
import createRootReducer from './reducers'
import createMiddlewares, { runSaga } from './middlewares'

const reduxDevTools = process.env.NODE_ENV !== 'production' && window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : f => f

export const history = createHashHistory()

const persistConfig = {
  key: 'moiki-vocalizer',
  blacklist: ['router', 'toastr', 'app'],
  storage: createElectronStorage()
}
const configureStore = (initialState) => {
  const persistedReducer = persistReducer(persistConfig, createRootReducer(history))
  const store = createStore(persistedReducer, initialState, compose(createMiddlewares(history), reduxDevTools))
  if (process.env.NODE_ENV !== 'production' && module.hot) {
    module.hot.accept('./reducers', () => {
      store.replaceReducer(persistReducer(persistConfig, createRootReducer(history)))
    })
  }
  runSaga()
  const persistor = persistStore(store)
  return { store, persistor }
}

export default configureStore