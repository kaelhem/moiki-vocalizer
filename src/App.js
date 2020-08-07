import React from 'react'
import { connect } from 'react-redux'
import { Route, Switch, Redirect } from 'react-router-dom'
import Layout from 'containers/layout'
import { Loader } from 'semantic-ui-react'

// pages
import Home from './pages/home'
import VocalizeStory from './pages/vocalize-story'
import Projects from './pages/projects'

const App = ({ isReady }) => {
  return isReady ? (
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
  )
}

const mapStateToProps = (state) => ({
  isReady: state.app.ready
})

export default connect(mapStateToProps)(App)