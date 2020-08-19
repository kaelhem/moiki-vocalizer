import React, { Fragment } from 'react'
import { bindActionCreators } from 'redux'
import { actions as appActions } from 'core/reducers/app'
import { connect } from 'react-redux'
import { Segment, Image, Divider, Button, Label } from 'semantic-ui-react'
import { version } from '../../package.json'
import './startup-screen.css'

const StartupScreen = ({ status, ffmpegDownload, microphoneAccess, setupCompleted }) => {
  return (
    <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100vh', background: '#3399ee' }}>
      <div className='startup-block'>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', width: '100%' }}>
          <Image src='./logo512.png' size='small' />
          <div style={{ flexGrow: 1, marginLeft: '2em' }}>
            <h2>Moiki Vocalizer</h2>
            <Label>v{version}</Label>
          </div>
        </div>
        <Divider style={{ width: '100%' }} />
        <p style={{ marginBottom: '1em' }}>
          Avant de commencer, Moiki Vocalizer doit <b>récupérer <em>ffmpeg</em></b> (pour encoder et mixer les sons) et <b>avoir 
          l'autorisation d'accéder au microphone</b> (pour créer les enregistrements)
        </p>
        { status.ffmpegReady ? (
          <div>Librairie ffmpeg <Label color="green">OK</Label></div>
        ) : (
          <Fragment>
            { (status.ffmpegProgress >= 0) ? (
              <Segment style={{ margin: '1.8em', width: 300 }}>
                <div>Téléchargement de FFMPEG ({ Math.round(status.ffmpegProgress * 100) }%)</div>
                <div style={{ width: '100%', height: 4, position: 'relative', background: '#666', display: 'block', borderRadius: '2px', overflow: 'hidden' }}>
                  <div style={{ height: '100%', width: (status.ffmpegProgress * 100) + '%', background: '#2185D0', display: 'block'  }} />
                </div>
              </Segment>
            ) : (
              <Button primary onClick={() => ffmpegDownload()}>Télécharger FFMPEG</Button>
            )}
          </Fragment>
        )}
        <Divider style={{ width: '40%' }} />
        { status.microphoneReady ? (
          <div>Accès au microphone <Label color="green">OK</Label></div>
        ) : (
          <Button primary onClick={() => microphoneAccess()}>Demander l'autorisation d'accès au microphone</Button>
        )}
        <Divider style={{ width: '100%' }} />
        <Button size='big' primary disabled={!status.microphoneReady || !status.ffmpegReady} onClick={setupCompleted}>Démarrer</Button>
      </div>
    </div>
  )
}

const mapStateToProps = (state) => ({
  status: state.app.status
})

const mapDispatchToProps = (dispatch) => ({
  ffmpegDownload: bindActionCreators(appActions.ffmpegDownload, dispatch),
  microphoneAccess: bindActionCreators(appActions.microphoneAccess, dispatch),
  setupCompleted: bindActionCreators(appActions.setupCompleted, dispatch),
})

export default connect(mapStateToProps, mapDispatchToProps)(StartupScreen)