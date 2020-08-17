import React, { useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as settingsActions } from 'core/reducers/settings'
import SpeechSynthesisRecorder from 'libs/speech-synthesis-recorder'
import { Button, Modal, Divider, Icon } from 'semantic-ui-react'
import { VoiceEditor } from './voice-editor'
import { VoicesList } from './voices-list'

const VoicesModal = (props) => {
  const {
    onClose,
    configVoicesList,
    updateVoice,
    addVoice,
    removeVoice,
    setDefaultVoice,
    defaultVoice
  } = props

  const [currentVoice, setCurrentVoice] = useState(null)

  const testVoice = (voiceSettings, sentence='Ceci est un test') => {
    new SpeechSynthesisRecorder({
      text: sentence, 
      utteranceOptions: {
        ...voiceSettings,
        volume: 2
      }
    }).start()
  }

  const onDuplicateVoice = (voice) => {
    const newVoice = {...voice, label: voice.label + '-copie', id: null}
    setCurrentVoice(newVoice)
  }

  return (
    <Modal
      size="tiny"
      open={true}
      closeOnDimmerClick={false}
    >
      <Modal.Header style={{ background: '#4c77ac', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span>Synthèse vocale</span>
        { !currentVoice ? (
          <Button onClick={() => setCurrentVoice({})}>
            <Icon name='plus' /> Ajouter une voix...
          </Button>
        ) : (
          <Button onClick={() => setCurrentVoice(null)}>
            <Icon name='arrow left' /> Retour
          </Button>
        )}
      </Modal.Header>
      <Modal.Content>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div>
            <p>Ajoutez différentes configurations de voix utilisées pour la synthèse vocale</p>
          </div>
          <Divider />
          { currentVoice ? (
            <VoiceEditor
              currentVoice={currentVoice}
              voiceActions={{ addVoice, updateVoice }}
              testVoice={testVoice}
              onEnd={() => setCurrentVoice(null)}
            />
          ) : (
            <VoicesList
              voices={configVoicesList}
              voiceActions={{ removeVoice, setDefaultVoice, testVoice }}
              onEditVoice={setCurrentVoice}
              onDuplicateVoice={onDuplicateVoice}
              defaultVoice={defaultVoice}
            />
          )}          
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button
          id='modal-cancel-button'
          onClick={ onClose }
          disabled={ false }
        >Fermer</Button>
      </Modal.Actions>
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  configVoicesList: state.settings.speech.voices,
  defaultVoice: state.settings.speech.defaultVoice
})

const mapDispatchToProps = (dispatch) => ({
  updateVoice: bindActionCreators(settingsActions.updateVoice, dispatch),
  addVoice: bindActionCreators(settingsActions.addVoice, dispatch),
  removeVoice: bindActionCreators(settingsActions.removeVoice, dispatch),
  setDefaultVoice: bindActionCreators(settingsActions.setDefaultVoice, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(VoicesModal)
