import React, { useState, useEffect, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as storyActions } from 'core/reducers/story'
import { ipcRenderer as ipc } from 'electron'
import { Button, Modal, Header, Loader, Icon, Label, Divider, Image } from 'semantic-ui-react'

const listStatus = [{
  status: 0,
  message: 'Transforme le graphe de l\'histoire en arbre linéaire'
}, {
  status: 1,
  message: 'Combine les enregistrements et les effets sonores'
}, {
  status: 2,
  message: 'Assemble les enregistrements par sequences'
}, {
  status: 3,
  message: 'Combine les enregistrements et les boucles sonores'
}, {
  status: 4,
  message: 'Exporte l\'archive au format .zip'
}
]

const ExportModal = (props) => {
  const {
    story,
    exportToStudio,
    onClose,
    pendingExport,
    exportCancel
  } = props

  const [isExporting, setIsExporting] = useState(false)

  /*
  useEffect(() => {
    exportToStudio()
  }, [])*/

  const getStatusHeader = () => {
    if (pendingExport && !pendingExport.error) {
      return (
        <div style={{ borderRadius: 4, background: '#d3e3f3', padding: '3em', margin: '2em', position: 'relative'}}>
          <Loader className="export-spinner" active={true} size="big" />
        </div>
      )
    } else if (pendingExport && pendingExport.error) {
      return (
        <div style={{ textAlign: 'center', margin: '1em' }}>
          <div><Icon color='red' name='cancel' size='huge' /><br/>Oops. Une erreur empêche l'export  !</div>
          <Button onClick={ closeModal } primary>Fermer</Button>
        </div>
      )
    } else {
      return (
        <div style={{ textAlign: 'center', margin: '1em' }}>
          <div><Icon color='green' name='check' size='huge' /><br/>Fichier exporté !</div>
          <Button onClick={ closeModal } primary>Fermer</Button>
        </div>
      )
    }
  }

  const getStatusLabel = (status) => {
    if (pendingExport) {
      if (pendingExport.status < status) return <Label size='mini'>en attente...</Label>
      if (pendingExport.status === status && pendingExport.error) return <Label size='mini' color='red'>erreur !</Label>
      if (pendingExport.status === status) return <Label size='mini' color='olive'>en cours...</Label>
    }
    return <Label size='mini' color='green'>ok</Label>
  }

  const closeModal = () => {
    exportCancel()
    onClose()
  }

  return (
    <Modal
      open={true}
      closeOnDimmerClick={false}
      size="tiny"
    >
      <Modal.Header style={{ background: '#4c77ac', color: '#fff' }}>
        Export
      </Modal.Header>
      <Modal.Content>
        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }}>
          { isExporting ? (
            <Fragment>
              { getStatusHeader() }
              <Divider horizontal style={{ width: '90%' }}>Détails</Divider>
              <div style={{ width: 420, marginBottom: '1em' }}>
                { listStatus && listStatus.map(({status, message}, idx) => (
                  <Fragment key={'status-step-' + status}>
                    { idx > 0 && (
                      <Divider style={{ margin: '3px 0' }} />
                    )}
                    <div style={{ color: !pendingExport || pendingExport.status >= status ? '#333' : '#aaa', display: 'flex', justifyContent: 'space-between' }}>{message} 
                      &nbsp;
                      { pendingExport && pendingExport.status === status && pendingExport.message }
                      { getStatusLabel(status) }
                    </div>
                  </Fragment>
                ))}
              </div>
            </Fragment>
          ) : (
            <Fragment>
              <div style={{ display: 'flex', justifyContent: 'space-between', width: '100%', margin: '1em 0' }}>
                <Button className='button-with-image' primary onClick={ onClose }>
                  <div style={{fontSize: '1.2em', fontWeight: 'bold' }}>Export HTML5</div>
                  <Image src={'assets/html5-icon.png'} />
                  <div><em>pour que ça marche dans un navigateur web</em></div>
                </Button>
                <Button style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className='button-with-image' primary onClick={ onClose }>
                  <div style={{fontSize: '1.2em', fontWeight: 'bold' }}>Export STUdio</div>
                  <div style={{ flexGrow: 1, display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
                    <Image src={'assets/lunii-icon.png'} />
                  </div>
                  <div><em>pour que ça marche sur une Lunii</em></div>
                </Button>
              </div>
              <Divider style={{ width: '100%' }} />
              <div>
                <Button onClick={ onClose }>Annuler</Button>
              </div>
            </Fragment>
          )}
        </div>
      </Modal.Content>
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  story: state.story.story,
  pendingExport: state.story.pendingExport
})

const mapDispatchToProps = (dispatch) => ({
  exportToStudio: bindActionCreators(storyActions.exportToStudio, dispatch),
  exportCancel: bindActionCreators(storyActions.exportCancel, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(ExportModal)