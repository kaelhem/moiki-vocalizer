import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Route, Switch, Redirect } from 'react-router-dom'
import Layout from 'containers/layout'
import { Loader } from 'semantic-ui-react'
import ReduxToastr from 'react-redux-toastr'

// pages
import Home from './pages/home'
import VocalizeStory from './pages/vocalize-story'
import Projects from './pages/projects'

const App = ({ isReady }) => (
  <Fragment>
    {isReady ? (
      <Layout>
        <Switch>
          <Route exact path="/" component={ Home } />
          <Route path="/projects" component={ Projects } />
          <Route path="/story" component={ VocalizeStory } />
          <Redirect to="/" />
        </Switch>
      </Layout>
    ) : (
      <Loader active={true} />
    )}
    <ReduxToastr
      timeOut={3000}
      newestOnTop={false}
      preventDuplicates
      position='bottom-right'
      transitionIn="fadeIn"
      transitionOut="fadeOut"
      closeOnToastrClick
    />
  </Fragment>
)

const mapStateToProps = (state) => ({
  isReady: state.app.ready
})

export default connect(mapStateToProps)(App)