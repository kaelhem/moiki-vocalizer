import React, { useEffect, Fragment } from 'react'
import { bindActionCreators } from 'redux'
import { connect } from 'react-redux'
import { actions as storyActions } from 'core/reducers/story'
import { actions as projectsActions } from 'core/reducers/projects'
import { Segment, Divider, Loader, Header, Card, Icon, Image } from 'semantic-ui-react'
import Dropzone from 'components/dropzone'
import moment from 'moment'
import './projects.css'

const Projects = (props) => {
  const {
    error,
    pending,
    projects,
    getList,
    importPending,
    importError,
    importStory,
    loadStory
  } = props

  useEffect(() => {
    getList()
  }, [])

  console.log(projects)

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
                <Card key={'project-' + idx} className="project-card" onClick={() => loadStory(project.folderName)}>
                  { project.cover ? (
                    <Image style={{maxHeight: 225, overflow: 'hidden'}} wrapped ui={false}>
                      <div className='cover' style={{ backgroundImage: 'url(' + project.cover + ')' }} />
                    </Image>
                  ) : (
                    <Image src={'/assets/image-wireframe.png'} wrapped ui={false} style={{ height: 225, display: 'flex' }} />
                  )}
                  <Card.Content extra header={project.title} />
                  <Card.Content extra>
                    <div><Icon name='calendar alternate' /> créée {moment(project.creationDate).fromNow()}</div>
                  </Card.Content>
                  <Card.Content extra>
                    <Icon name='sound' /> {project.numNodes} passages à vocaliser
                  </Card.Content>
                </Card>
              )) : (
                <p>Auncune histoire n'a été trouvé. Commencez par en importer une&nbsp;!</p>
              ) }
            </div>
          )}
        </div>
      </div>
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
  importStory: bindActionCreators(storyActions.import, dispatch),
  loadStory: bindActionCreators(storyActions.load, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Projects)