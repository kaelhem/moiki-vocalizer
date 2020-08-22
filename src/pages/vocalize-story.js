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
import { Button, Icon, Label, Image, Radio } from 'semantic-ui-react'
import moment from 'moment'
import './vocalize-story.css'

const VocalizeStory = ({ story, clearStory, exportToStudio }) => {
  const [currentNode, setcurrentNode] = useState(null)
  const [automaticVocalization, setAutomaticVocalization] = useState(false)
  const [vocalizerRefs, setVocalizerRefs] = useState({})
  const [ttsModalIsOpen, setTtsModalIsOpen] = useState(false)
  const [ttsModalOptionsIsOpen, setTtsModalOptionsIsOpen] = useState(false)
  const [speechSettings, setSpeechSettings] = useState(null)
  const [stats, setStats] = useState(null)
  const [showExportModal, setShowExportModal] = useState(false)
  const [safeRec, setSafeRec] = useState(false)
  const [showOnlySequencesWitoutSounds, setShowOnlySequencesWitoutSounds] = useState(false)
  
  const exctractWords = (str) => str
    .replace(/[.,'!:?"]/gim, ' ')
    .replace(/(\s)+/gim, ' ')
    .trim()
    .split(' ')
    .filter(x => x !== '')

  const getEstimatedTime = (words) => words.length / 150 * 60

  useEffect(() => {
    if (story) {
      const words = story.nodes.map(x => exctractWords(x.content)).join(' ')
      console.log('temps estimé pour la vocalisation: ', getEstimatedTime(words))
      setStats({
        nodes: story.nodes.map(node => ({
          ...node,
          estimatedTime: getEstimatedTime(exctractWords(node.content))
        })),
        numWords: words.length,
        totalEstimatedTime: getEstimatedTime(words)
      })
      let refs = {}
      for (let node of story.nodes) {
        refs[node.id] = createRef()
      }
      setVocalizerRefs(refs)
    }
  }, [story])

  if (!story) {
    return <Redirect to="/" />
  }

  const openMicModal = (seq) => {
    setcurrentNode(seq)
  }

  const closeMicModal = () => {
    setcurrentNode(null)
  }

  const onGenerateTts = (settings, safe) => {
    setSafeRec(safe)
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
    const currentNodeIndex = story.nodes.findIndex(({id}) => currentNode.id === id)
    if (story.nodes.length > currentNodeIndex + 1) {
      setcurrentNode(story.nodes[currentNodeIndex + 1])
    } else if (automaticVocalization) {
      setAutomaticVocalization(false)
      const now = new Date().getTime()
      const duration = moment.duration(now - stats.startAt, 'milliseconds').as('milliseconds')
      console.log('fini en: ', moment.utc(duration).format('mm:ss'))
    }
  }

  const loadPreviousNode = () => {
    const currentNodeIndex = story.nodes.findIndex(({id}) => currentNode.id === id)
    if (currentNodeIndex > 0) {
      setcurrentNode(story.nodes[currentNodeIndex - 1])
    }
  }

  const onStopAutomaticVocalization = () => {
    setAutomaticVocalization(false)
  }

  const sequencesWithSound = story.nodes.filter(x => x.hasSound).length

  const onSequenceUpdated = (node, blob) => {
    const seq = story.nodes.find(n => n.id === node.id)
    seq.hasSound = true
    vocalizerRefs[seq.id].current.updateSound(blob)
    if (sequencesWithSound === story.nodes.length && showOnlySequencesWitoutSounds) {
      setShowOnlySequencesWitoutSounds(false)
    }
  }

  const onSetVoice = (voice) => {
    console.log(voice)
    setSpeechSettings(voice)
  }

  return (
    <Fragment>
      <div className="module-header" style={{ height: 120 }}>
        <div style={{ paddingTop: 20, paddingBottom: 20 }}>
          <div style={{ display: 'flex' }}>
            <Button style={{ marginBottom: 5 }} onClick={clearStory}>
              <Icon size='big' name='power off' style={{ width: 50, margin: '16px auto' }} />
              <div>Fermer</div>
            </Button>
            <div style={{ display: 'block', width: 1, background: '#ccc', marginBottom: 5, marginLeft: 5, marginRight: 2 }}></div>
            <div style={{ flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '0 .5em' }}>
              <div className='story-title'><b>{story.meta.name}</b></div>
              <div style={{ display: 'flex', margin: '.5em 0' }}>
                <div style={{ padding: '0 5px', paddingLeft: 0 }}><Label basic color="green">{sequencesWithSound} Séquences vocalisées</Label></div>
                <div style={{ padding: '0 5px' }}><Label basic color="blue">{story.nodes.length} Séquences au total</Label></div>
              </div>
              <div className='filter-box'>
                { sequencesWithSound === story.nodes.length ? (
                  <span><Icon color='green' name='check' size='small' /> Toutes les séquences sont vocalisées !</span>
                ) : (
                  <Radio
                    toggle
                    label={'Afficher seulement les séquences non-vocalisées'}
                    checked={showOnlySequencesWitoutSounds}
                    onChange={() => setShowOnlySequencesWitoutSounds(!showOnlySequencesWitoutSounds)}
                  />
                )}
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'row', paddingBottom: 5 }}>
              <div className="vocalize-percent-box">
                { Math.round((sequencesWithSound / story.nodes.length) * 100) }%
              </div>
              <Button style={{ width: 143 }} onClick={() => setTtsModalIsOpen(true)}>
                <Image src='assets/robot.svg' style={{ width: 50, margin: '5px auto' }} />Synthèse vocale
              </Button>
              <Button style={{ width: 143 }} disabled={sequencesWithSound < story.nodes.length} primary onClick={() => setShowExportModal(true)}>
                <Icon size='big' name='download' style={{ width: 50, margin: '16px auto' }} />
                <div>Exporter</div>
              </Button>
            </div>
          </div>
        </div>
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', padding: 30, paddingTop: 120 }}>
        { story && story.nodes && story.nodes.map((x, index) => ({...x, index})).filter(x => !showOnlySequencesWitoutSounds || !x.hasSound).map(node => (
          <SequenceVocalizer
            ref={vocalizerRefs[node.id]}
            key={'node-' + node.index}
            index={(node.index + 1)}
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
          onLoadPreviousSequence={() => loadPreviousNode()}
          speechSettings={speechSettings}
          safeRec={safeRec}
          onSetVoice={onSetVoice}
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
