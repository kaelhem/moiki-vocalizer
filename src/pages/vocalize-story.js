import React, { useState, useEffect, createRef, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as storyActions } from 'core/reducers/story'
import SequenceVocalizer from 'components/sequence-vocalizer'
import MicModal from 'components/mic-modal'
import GenerateTtsModal from 'components/generate-tts-modal'
import VoicesModal from 'components/voices-modal'
import ExportModal from 'components/export-modal'
import { Button, Icon } from 'semantic-ui-react'
import moment from 'moment'

const VocalizeStory = ({ story, clearStory, exportToStudio }) => {
  const [currentNode, setcurrentNode] = useState(null)
  const [automaticVocalization, setAutomaticVocalization] = useState(false)
  const [vocalizerRefs, setVocalizerRefs] = useState({})
  const [ttsModalIsOpen, setTtsModalIsOpen] = useState(false)
  const [ttsModalOptionsIsOpen, setTtsModalOptionsIsOpen] = useState(false)
  const [speechSettings, setSpeechSettings] = useState(null)
  const [stats, setStats] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  
  useEffect(() => {
    if (story) {
      const words = story.nodes
        .map(x => x.content)
        .join(' ')
        .replace(/[.,'!:?"]/gim, ' ')
        .replace(/(\s)+/gim, ' ')
        .split(' ')
        .filter(x => x !== '')

      console.log('num words = ' + words.length, words)
      console.log('temps estimé pour la vocalisation: ', (words.length / 150 * 60))
      setStats({
        numNodes: story.nodes.length,
        numWords: words.length,
        estimatedTime: (words.length / 150) * 60
      })
      let refs = {}
      for (let node of story.nodes) {
        refs[node.id] = createRef()
      }
      setVocalizerRefs(refs)
    }
  }, [story])

  const openMicModal = (seq) => {
    setcurrentNode(seq)
  }

  const closeMicModal = () => {
    setcurrentNode(null)
  }

  const onGenerateTts = (settings) => {
    setTtsModalIsOpen(false)
    setSpeechSettings(settings)
    setAutomaticVocalization(true)
    setcurrentNode(story.nodes[0])
    setStats({
      ...stats,
      startAt: new Date().getTime()
    })
  }

  const loadNextNode = () => {
    if (automaticVocalization) {
      const currentNodeIndex = story.nodes.findIndex(({id}) => currentNode.id === id)
      if (story.nodes.length > currentNodeIndex + 1) {
        setcurrentNode(story.nodes[currentNodeIndex + 1])
      } else {
        const now = new Date().getTime()
        const duration = moment.duration(now - stats.startAt, 'milliseconds').as('milliseconds')
        console.log('fini en: ', moment.utc(duration).format('mm:ss'))
      }
    }
  }

  const onStopAutomaticVocalization = () => {
    setAutomaticVocalization(false)
  }

  const onSequenceUpdated = (node, blob) => {
    node.hasSound = true
    vocalizerRefs[node.id].current.updateSound(blob)
  }

  return !story ? (
    <Redirect to="/" />
  ) : (
    <Fragment>
      <div className="module-header">
        <div style={{ paddingTop: 20, paddingBottom: 20 }}>
          <Button onClick={clearStory}>Fermer</Button>
          {/*<Button onClick={() => setTtsModalOptionsIsOpensetTtsModalIsOpen(true)}>Options</Button>*/}
          <Button onClick={() => setTtsModalIsOpen(true)}>Synthèse vocale</Button>
          <Button primary onClick={() => setShowExportModal(true)}>
            <Icon name='download'/> Exporter
          </Button>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: 30, paddingTop: 100 }}>
        { story && story.nodes && story.nodes.map((node, index) => (
          <SequenceVocalizer
            ref={vocalizerRefs[node.id]}
            key={'node-' + index}
            index={(index + 1)}
            sequence={node}
            editSound={openMicModal}
            hasSound={node.hasSound}
            folderName={story.projectInfo.folderName}
          />
        ))}
        <MicModal
          story={story}
          sequence={currentNode}
          automaticVocalization={automaticVocalization}
          onStopAutomaticVocalization={onStopAutomaticVocalization}
          onSequenceUpdated={onSequenceUpdated}
          onClose={closeMicModal}
          onLoadNextSequence={() => loadNextNode()}
          speechSettings={speechSettings}
        />
        { ttsModalIsOpen && !ttsModalOptionsIsOpen && (
          <GenerateTtsModal
            onClose={() => setTtsModalIsOpen(false)}
            onValidate={onGenerateTts}
            stats={stats}
            onOpenOptions={() => setTtsModalOptionsIsOpen(true)}
          />
        )}
        { ttsModalOptionsIsOpen && (
          <VoicesModal
            onClose={() => setTtsModalOptionsIsOpen(false)}
          />
        )}
        { showExportModal && (
          <ExportModal
            onClose={() => setShowExportModal(false)}
          />
        )}
      </div>
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  story: state.story.story
})

const mapDispatchToProps = (dispatch) => ({
  clearStory: bindActionCreators(storyActions.clear, dispatch),
  exportToStudio: bindActionCreators(storyActions.exportToStudio, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(VocalizeStory)
