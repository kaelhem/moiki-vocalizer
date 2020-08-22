import React, { useState, Fragment } from 'react'
import { Button, Confirm, Divider } from 'semantic-ui-react'

export const VoicesList = (props) => {
  const {
    defaultVoice,
    voices,
    voiceActions,
    onEditVoice,
    onDuplicateVoice
  } = props

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [itemToDelete, setItemToDelete] = useState(null)

  const handleAskDelete = (id) => {
    setItemToDelete(id)
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = () => {
    voiceActions.removeVoice(itemToDelete)
    handleCloseConfirm()
  }

  const handleCloseConfirm = () => {
    setShowConfirmDelete(false)
    setItemToDelete(null)
  }

  return (
    <Fragment>
      <div>
        {voices && voices.length > 0 ? voices.map((voice, idx) => (
          <Fragment key={'voice-' + idx}>
            { idx > 0 && (
              <Divider />
            )}
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                { defaultVoice === voice.id ? (
                  <Button icon='star' circular color='yellow' />
                ) : (
                  <Button icon='star outline' circular onClick={() => voiceActions.setDefaultVoice(voice.id)} />
                )}
                <b>{voice.label}</b> ({voice.data.lang})
              </div>
              <div>
                <Button primary circular icon='play' onClick={() => voiceActions.testVoice(voice.data, voice.testSentence)} />
                <Button icon='edit' circular onClick={() => onEditVoice(voice)} />
                <Button icon='copy' circular onClick={() => onDuplicateVoice(voice)} />
                <Button negative icon='trash' circular onClick={() => handleAskDelete(voice.id)} />
              </div>
            </div>
          </Fragment>
        )) : (
          <div>Aucune voix enregistrée !</div>
        )}
      </div>
      <Confirm
        size='tiny'
        header={`Etes-vous sur de vouloir supprimer cette configuration de voix ?`}
        content={`Si cette voix est utilisée dans des séquences de votre histoire, ses références seront également supprimées !`}
        cancelButton='Annuler'
        confirmButton={<Button negative>Continuer</Button>}
        open={showConfirmDelete}
        onCancel={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </Fragment>
  )
}