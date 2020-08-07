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
    importStory
  } = props

  useEffect(() => {
    getList()
  }, [])

  return (
    <Fragment>
      { error && (
        <Segment className="error-message" color='red'>
          Une erreur est survenue :-(
        </Segment>
      )}
      <div style={{ textAlign: 'center' }}>
        <Header>Vos histoires</Header>
        <Divider />
        { importPending ? (
          <div style={{ margin: '3em auto', padding: '1em', height: 200, display: 'flex', alignItems: 'center', fontSize: '1.5em' }}>
            <Loader active={true} />
          </div>
        ) : (
          <Fragment>
            { importError && (
              <Segment color='red'>
                { importError }
              </Segment>
            )}
            <Dropzone
              onDataLoaded={ importStory }
              content={<p>Glissez ici votre histoire au format <em>.zip</em></p>}
            />
          </Fragment>
        )}
        { pending ? (
          <Loader active={true} />
        ) : (
          <div style={{ justifyContent: 'center', display: 'flex', flexWrap: 'wrap' }}>
            { projects && projects.length > 0 ? projects.map((project, idx) => (
              <Card key={'project-' + idx} className="project-card">
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
  importStory: bindActionCreators(storyActions.import, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(Projects)