import React, { useEffect, Fragment, useState } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as storyActions } from 'core/reducers/story'
import { actions as projectsActions } from 'core/reducers/projects'
import { Segment, Loader, Header, Card, Icon, Image, Label, Button, Popup, List, Confirm } from 'semantic-ui-react'
import Dropzone from 'components/dropzone'
import moment from 'moment'
import './projects.css'

const ProjectMenu = (props) => {

  const [isOpen, setIsOpen] = useState(false)

  const onRemove = () => {
    setIsOpen(false)
    props.onRemove()
  }

  return (
    <Popup
      on='click'
      open={isOpen}
      onOpen={() => setIsOpen(true)}
      onClose={() => setIsOpen(false)}
      position='bottom right'
      trigger={<Button circular icon='setting' style={{ position: 'absolute', right: 5, top: 5, width: 40, background: 'rgba(255,255,255,.5)' }} />}
    >
      <List selection position='bottom' verticalAlign='middle'>
        <List.Item value={'REMOVE_PROJECT'} onClick={onRemove} content={'Supprimer ce projet...'} />
      </List>
    </Popup>
  )
}

const Projects = (props) => {
  const {
    error,
    pending,
    projects,
    getList,
    importPending,
    importError,
    importStory,
    loadStory,
    removeProject
  } = props

  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [projectToDelete, setProjectToDelete] = useState(null)

  useEffect(() => {
    getList()
  }, [getList])

  const removeProjectHandler = (project) => {
    setProjectToDelete(project)
    setShowConfirmDelete(true)
  }

  const handleConfirmDelete = () => {
    // TODO
    removeProject(projectToDelete)
    handleCloseConfirm()
  }

  const handleCloseConfirm = () => {
    setProjectToDelete(null)
    setShowConfirmDelete(false)
  }

  return (
    <Fragment>
      <div className="module-header" style={{height: 200}}>
        <div style={{ paddingTop: 20, paddingBottom: 20, textAlign: 'center' }}>
          <Header size="huge">Vos histoires</Header>
          { importPending ? (
            <div style={{ margin: '1em auto', padding: '.8em', height: 100, display: 'flex', alignItems: 'center', fontSize: '1.3em' }}>
              <Loader active={true} />
            </div>
          ) : (
            <Fragment>
              { importError && (
                <Segment color='red'>{ importError }</Segment>
              )}
              <Dropzone
                onDataLoaded={ importStory }
                content={<p>Glissez ici votre histoire au format <em>.zip</em></p>}
              />
            </Fragment>
          )}
        </div>
      </div>
      <div style={{ paddingTop: 200 }}>
        { error && (
          <Segment className="error-message" color='red'>
            Une erreur est survenue :-(
          </Segment>
        )}
        <div style={{ textAlign: 'center' }}>
          { pending ? (
            <Loader active={true} />
          ) : (
            <div style={{ justifyContent: 'center', display: 'flex', flexWrap: 'wrap' }}>
              { projects && projects.length > 0 ? projects.map((project, idx) => (
                <Card key={'project-' + idx} className="project-card">
                  { project.cover ? (
                    <Image onClick={() => loadStory(project.folderName)} style={{maxHeight: 225, overflow: 'hidden', cursor: 'pointer'}} wrapped ui={false}>
                      <div className='cover' style={{ backgroundImage: 'url(' + project.cover + ')' }} />
                    </Image>
                  ) : (
                    <Image onClick={() => loadStory(project.folderName)} src={'/assets/image-wireframe.png'} wrapped ui={false} style={{ height: 225, display: 'flex', cursor: 'pointer' }} />
                  )}
                  { project.numNodes === project.numVocalized && (
                    <Label ribbon color='green' style={{ position: 'absolute', left: -14, top: 10 }}>
                      <Icon name='check' /> fini !
                    </Label>
                  )}
                  <ProjectMenu
                    onRemove={() => removeProjectHandler(project)}
                  />
                  <Card.Content extra header={project.title} />
                  <Card.Content extra>
                    <div><Icon name='calendar alternate' /> créée {moment(project.creationDate).fromNow()}</div>
                  </Card.Content>
                  <Card.Content extra>
                    <Icon name='sound' /> {project.numVocalized} / {project.numNodes} passages vocalisés
                  </Card.Content>
                </Card>
              )) : (
                <p>Auncune histoire n'a été trouvé. Commencez par en importer une&nbsp;!</p>
              ) }
            </div>
          )}
        </div>
      </div>
      <Confirm
        size='tiny'
        header={`Etes-vous sur de vouloir supprimer ce projet ?`}
        content={`Une fois cette action effectuée, il ne sera pas possible de revenir en arrière !`}
        cancelButton='Annuler'
        confirmButton={<Button negative>Continuer</Button>}
        open={showConfirmDelete}
        onCancel={handleCloseConfirm}
        onConfirm={handleConfirmDelete}
      />
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  pending: state.projects.pending,
  error: state.projects.error,
  projects: state.projects.list,
  importError: state.story.error,
  importPending: state.story.pending
})

const mapDispatchToProps = (dispatch) => ({
  getList: bindActionCreators(projectsActions.getList, dispatch),
  removeProject: bindActionCreators(projectsActions.remove, dispatch),
  importStory: bindActionCreators(storyActions.import, dispatch),
  loadStory: bindActionCreators(storyActions.load, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Projects)