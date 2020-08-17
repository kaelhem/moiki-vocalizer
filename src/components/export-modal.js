import React, { useState, useEffect } from 'react'
import { ipcRenderer as ipc } from 'electron'
import { Button, Modal, Label } from 'semantic-ui-react'

export const ExportModal = (props) => {
  const {
    story,
    onClose
  } = props

  return (
    <Modal
      open={true}
      closeOnDimmerClick={false}
    >
      <Modal.Header style={{ background: '#4c77ac', color: '#fff' }}>
        Synthèse vocale
      </Modal.Header>
      <Modal.Content>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '95%', display: 'flex' }}>
            <div style={{ marginRight: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#dadada', width: '100%', padding: 15, textAlign: 'center' }}>
              { story.meta.name }
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>

          </div>
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