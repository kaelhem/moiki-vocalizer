import React, { useState } from 'react'
import { connect } from 'react-redux'
import { bindActionCreators } from 'redux'
import { actions as storyActions } from 'core/reducers/story'
import SequenceVocalizer from 'components/sequence-vocalizer'
import { MicModal } from 'components/mic-modal'
import { Button } from 'semantic-ui-react'

import kebabCase from 'lodash.kebabcase'
import JSZip from 'jszip'

const VocalizeStory = ({ story, clearStory }) => {
  const [currentNode, setcurrentNode] = useState(null)
  const [automaticVocalization, setAutomaticVocalization] = useState(false)

  const openMicModal = (seq) => {
    setcurrentNode(seq)
  }

  const closeMicModal = () => {
    setcurrentNode(null)
  }

  const exportStudio = async () => {
    const filename = kebabCase(story.meta.name)
    const zip = new JSZip()
    zip.file(filename + '.json', JSON.stringify(story, null, 4))
    const blob = await zip.generateAsync({type: 'blob'})
    const element = document.createElement("a")
    element.href = URL.createObjectURL(blob)
    element.download = filename + '.zip'
    element.click()
  }

  const generateAllSounds = () => {
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

  return (
    <div style={{ display: 'flex', flexDirection: 'column', padding: 30 }}>
      <div className="module-header">
        <div>
          <Button onClick={clearStory}>Fermer</Button>
          <Button onClick={generateAllSounds}>TTS generation...</Button>
          <Button onClick={exportStudio}>Export to STUdio</Button>
          { automaticVocalization ? ' true ' : ' false ' }
        </div>
      </div>
      { story && story.nodes && story.nodes.map((node, index) => (
        <SequenceVocalizer
          key={'node-' + index}
          index={(index + 1)}
          sequence={node}
          editSound={openMicModal}
        />
        
      ))}
      <MicModal
        story={story}
        sequence={currentNode}
        automaticVocalization={automaticVocalization}
        onStopAutomaticVocalization={onStopAutomaticVocalization}
        onClose={closeMicModal}
        onLoadNextSequence={() => loadNextNode()}
      />
    </div>
  )
}

const mapStateToProps = (state) => ({
  story: state.story.story
})

const mapDispatchToProps = (dispatch) => ({
  clearStory: bindActionCreators(storyActions.clear, dispatch)
})

export default connect(mapStateToProps, mapDispatchToProps)(VocalizeStory)
