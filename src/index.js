import React from 'react'
import ReactDOM from 'react-dom'

import { Provider } from 'react-redux'
import { PersistGate } from 'redux-persist/integration/react'
import { ConnectedRouter } from 'connected-react-router'
import configureStore, { history } from 'core/store'

import App from './app'
import './index.css'
import 'semantic-ui-css/semantic.min.css'

const { store, persistor } = configureStore()
const render = Component => {
  return ReactDOM.render(
    <Provider store={store}>
      <PersistGate loading={null} persistor={persistor}>
        <ConnectedRouter history={history}>
          <Component useSuspense={ false } />
        </ConnectedRouter>
      </PersistGate>
    </Provider>,
    document.getElementById('root')
  )
}

render(App)

if (process.env.NODE_ENV !== 'production') {
  if (module.hot) {
    module.hot.accept('./app', () => {
      const NextApp = require('./app').default
      render(NextApp)
    })
  }
}