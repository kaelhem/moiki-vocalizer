import React, { useState, Fragment } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as storyActions } from 'core/reducers/story'
import { Button, Modal, Loader, Icon, Label, Divider, Image } from 'semantic-ui-react'

const listStatus = {
  lunii: [{
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
  }],
  html: [
    {
      status: 0,
      message: 'Prepare la liste des fichiers'
    }, {
      status: 1,
      message: 'Réduit le volume des boucles et effets sonores'
    }, {
      status: 2,
      message: 'Création de l\'archive'
    }, {
      status: 3,
      message: 'Exporte l\'archive au format .zip'
    }
  ]
}

const ExportModal = (props) => {
  const {
    exportToStudio,
    exportToHtml,
    onClose,
    pendingExport,
    exportCancel,
    exportPath
  } = props

  const [isExporting, setIsExporting] = useState(false)

  const getStatusHeader = () => {
    if (pendingExport && !pendingExport.error) {
      return (
        <Fragment>
          <div style={{ borderRadius: 4, background: '#d3e3f3', padding: '3em', margin: '2em', position: 'relative'}}>
            <Loader indeterminate className="export-spinner" active={true} size="big" />
          </div>
          <Button basic onClick={ closeModal } size="mini">Annuler</Button>
        </Fragment>
      )
    } else if (pendingExport && pendingExport.error) {
      return (
        <div style={{ textAlign: 'center', margin: '1em' }}>
          <div><Icon color='red' name='cancel' size='huge' /></div>
          <div>Oops. Une erreur empêche l'export  !</div>
          <div style={{ margin: '1em' }}>Oops. Une erreur empêche l'export  !</div>
          <Button onClick={ closeModal } primary>Fermer</Button>
        </div>
      )
    } else {
      return (
        <div style={{ textAlign: 'center', margin: '1em' }}>
          <div><Icon color='green' name='check' size='huge' /></div>
          <div style={{ margin: '1em' }}>Fichier exporté : <b>{ exportPath }</b></div>
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

  const exportHtml = () => {
    setIsExporting('html')
    exportToHtml()
  }

  const exportLunii = () => {
    setIsExporting('lunii')
    exportToStudio()
  }

  const closeModal = () => {
    exportCancel()
    onClose()
    setIsExporting(false)
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
                { listStatus[isExporting] && listStatus[isExporting].map(({status, message}, idx) => (
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
                <Button className='button-with-image' primary onClick={ exportHtml }>
                  <div style={{fontSize: '1.2em', fontWeight: 'bold' }}>Export HTML5</div>
                  <Image src={'assets/html5-icon.png'} />
                  <div><em>pour que ça marche dans un navigateur web</em></div>
                </Button>
                <Button style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center' }} className='button-with-image' primary onClick={ exportLunii }>
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
  pendingExport: state.story.pendingExport,
  exportPath: state.story.exportPath
})

const mapDispatchToProps = (dispatch) => ({
  exportToHtml: bindActionCreators(storyActions.exportToHtml, dispatch),
  exportToStudio: bindActionCreators(storyActions.exportToStudio, dispatch),
  exportCancel: bindActionCreators(storyActions.exportCancel, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(ExportModal)