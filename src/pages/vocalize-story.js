import React, { useState, useEffect, createRef, Fragment } from 'react'
import { Redirect } from 'react-router-dom'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as storyActions } from 'core/reducers/story'
import SequenceVocalizer from 'components/sequence-vocalizer'
import MicModal from 'components/mic-modal'
import GenerateTtsModal from 'components/generate-tts-modal'
import VoicesModal from 'components/voices-modal'
import { ExportModal } from 'components/export-modal'
import { Button } from 'semantic-ui-react'

const VocalizeStory = ({ story, clearStory, exportToStudio, pendingExport }) => {
  const [currentNode, setcurrentNode] = useState(null)
  const [automaticVocalization, setAutomaticVocalization] = useState(false)
  const [vocalizerRefs, setVocalizerRefs] = useState({})
  const [ttsModalIsOpen, setTtsModalIsOpen] = useState(false)
  const [ttsModalOptionsIsOpen, setTtsModalOptionsIsOpen] = useState(false)
  const [speechSettings, setSpeechSettings] = useState(null)
  
  useEffect(() => {
    if (story) {
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
  }

  const loadNextNode = () => {
    if (automaticVocalization) {
      const currentNodeIndex = story.nodes.findIndex(({id}) => currentNode.id === id)
      if (story.nodes.length > currentNodeIndex + 1) {
        setcurrentNode(story.nodes[currentNodeIndex + 1])
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

  const words = story.nodes
    .map(x => x.content)
    .join(' ')
    .replace(/[.,'!:?"]/gim, ' ')
    .replace(/(\s)+/gim, ' ')
    .split(' ')
    .filter(x => x !== '')

  console.log('num words = ' + words.length, words)

  return !story ? (
    <Redirect to="/" />
  ) : (
    <Fragment>
      <div className="module-header">
        <div style={{ paddingTop: 20, paddingBottom: 20 }}>
          <Button disabled={pendingExport} onClick={clearStory}>Fermer</Button>
          {/*<Button disabled={pendingExport} onClick={() => setTtsModalOptionsIsOpensetTtsModalIsOpen(true)}>Options</Button>*/}
          <Button disabled={pendingExport} onClick={() => setTtsModalIsOpen(true)}>Synthèse vocale</Button>
          <Button disabled={pendingExport} loading={pendingExport} onClick={exportToStudio}>Export to STUdio</Button>
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
            onOpenOptions={() => setTtsModalOptionsIsOpen(true)}
          />
        )}
        { ttsModalOptionsIsOpen && (
          <VoicesModal
            onClose={() => setTtsModalOptionsIsOpen(false)}
          />
        )}
      </div>
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  story: state.story.story,
  pendingExport: state.story.pendingExport
})

const mapDispatchToProps = (dispatch) => ({
  clearStory: bindActionCreators(storyActions.clear, dispatch),
  exportToStudio: bindActionCreators(storyActions.exportToStudio, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(VocalizeStory)
