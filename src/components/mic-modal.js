import React, { useState, useEffect } from 'react'
import { selectors as settingsSelectors } from 'core/reducers/settings'
import { connect } from 'react-redux'
import { ipcRenderer as ipc } from 'electron'
import { ReactMic } from '@matuschek/react-mic'
import SpeechSynthesisRecorder from 'libs/speech-synthesis-recorder'
import { AudioPlayerProvider } from 'react-use-audio-player'
import AudioPlayer from 'components/audio-player'
import { Button, Modal, Label, Image, Header, List, Popup } from 'semantic-ui-react'
import moment from 'moment'
import './sequence-vocalizer.css'

let cancelled = false
let isSpeechSynthesis = false
let currentSequence = null

const MicModal = (props) => {
  const {
    story,
    sequence,
    speechSettings,
    onClose,
    automaticVocalization,
    safeRec,
    onLoadNextSequence,
    onLoadPreviousSequence,
    onStopAutomaticVocalization,
    onSequenceUpdated,
    configVoicesList,
    defaultVoice,
    onSetVoice
  } = props

  const [isRecording, setIsRecording] = useState(false)
  const [blobSoundURI, setBlobSoundURI] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [currentSpeechRecorder, setCurrentSpeechRecorder] = useState(null)
  const [isOpenVoiceList, setIsOpenVoiceList] = useState(false)
  const [isVocal, setIsVocal] = useState(false)

  const onSoundLoaded = (event, err, buffer) => {
    ipc.removeListener('sound-file-loaded', onSoundLoaded)
    if (err) {
      console.log(err)
    } else {
      const blob = new Blob([buffer])
      setBlobSoundURI(URL.createObjectURL(blob))
    }
  }

  const loadSound = () => {
    ipc.on('sound-file-loaded', onSoundLoaded)
    ipc.send('load-sound-file', story.projectInfo.folderName, sequence.id + '.mp3')
  }

  useEffect(() => {
    cancelled = false
    if (sequence && sequence.hasSound) {
      loadSound()
    } else {
      setBlobSoundURI(null)
    }
    return () => {
      cancelled = true
      ipc.removeListener('sound-file-loaded', onSoundLoaded)
    }
  }, [sequence])

  const onConvertComplete = (event, error, res) => {
    ipc.removeListener('ffmpeg-convert-complete', onConvertComplete)
    if (!cancelled) {
      if (error) {
        console.log('une erreur est survenue !', error, res)
      } else {
        const soundDurationRaw = res.match(/time=\d{2}:\d{2}:\d{2}.\d{2}/gm)
        let duration = 0
        if (soundDurationRaw && soundDurationRaw.length === 1) {
          duration = moment.duration(soundDurationRaw[0].replace('time=', ''))._milliseconds
          console.log(duration)
        }
      }
      sequence.hasSound = true
      setIsConverting(false)
      setIsVocal(false)
      isSpeechSynthesis = false
      if (automaticVocalization) {
        onLoadNextSequence()
      }
    }
  }

  useEffect(() => {
    if (automaticVocalization && sequence) {
      if (safeRec && sequence.hasSound) {
        onLoadNextSequence()
      } else {
        recordSpeech()
      }
    }
  }, [automaticVocalization, sequence])

  const onStop = (blob, blobURL=null, origin) => {
    console.log('stop from:', origin, isSpeechSynthesis, sequence, currentSequence)
    setIsRecording(false)
    if ((isSpeechSynthesis && origin === 'recordSpeech') || (!isSpeechSynthesis && origin !== 'recordSpeech') || isVocal) {
      console.log('-> will convert')
      setIsConverting(true)
      setBlobSoundURI(blobURL || URL.createObjectURL(blob))
      
      onSequenceUpdated && onSequenceUpdated(currentSequence || sequence, blob)
      
      const { folderName } = story.projectInfo
      const fileName = (currentSequence || sequence).id
      //const ab = await blob.arrayBuffer()
      blob.arrayBuffer().then(ab => {
        ipc.on('ffmpeg-convert-complete', onConvertComplete)
        ipc.send('ffmpeg-convert-webm2mp3', ab, folderName, fileName)
      })
    }
    currentSequence = null
  }

  const recordSpeech = () => {
    // list fr voices...
    // console.log(window.speechSynthesis.getVoices().filter(x => x.lang.toLowerCase().indexOf('fr') !== -1))
    isSpeechSynthesis = true
    setIsRecording(true)
    const defaultUtteranceOptions = {
      voice: "Thomas", // "Amelie",
      lang: "fr-FR", // "fr-CA",
      pitch: 1, // 0.8
      rate: 1, // 1.05
      volume: 2
    }
    const opts = (speechSettings || defaultVoice).data ? {
      ...defaultUtteranceOptions,
      ...(speechSettings || defaultVoice).data
    } : defaultUtteranceOptions
    const speechRecorder = new SpeechSynthesisRecorder({
      text: sequence.content, 
      utteranceOptions: opts
    })
    setCurrentSpeechRecorder(speechRecorder)
    speechRecorder.start().then(async (tts) => {
      if (tts.cancelled) {
        return
      }
      const blob = await tts.blob()
      onStop(blob.data, null, 'recordSpeech')
    })
  }

  const stopSpeech = () => {
    setIsRecording(false)
    onStopAutomaticVocalization()
    if (currentSpeechRecorder) {
      currentSpeechRecorder.cancel()
      setCurrentSpeechRecorder(null)
    }
  }

  const onSelectVoice = (voice) => {
    setIsOpenVoiceList(false)
    onSetVoice(voice)
  }

  const onVocalStart = () => {
    console.log('on start:', sequence)
    //isSpeechSynthesis = false
    currentSequence = sequence
    setIsVocal(true)
    setIsRecording(true)
  }

  if (!sequence) {
    return null
  }

  const currentIndex = story.nodes.findIndex(x => x.id === sequence.id)
  const hasPrevious = currentIndex > 0
  const hasNext = currentIndex < story.nodes.length - 1

  return (
    <Modal open={true} className="mic-modal">
      <Modal.Header style={{ background: '#4c77ac', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div style={{ display: 'flex', alignItems: 'center', width: 320 }}>
          <Label style={{ marginRight: 10 }} content={<span style={{ fontSize: '1.5em' }}>{ sequence.id }</span>} />
        </div>
        <div style={{ flexGrow: 1, display: 'flex' }}>
          <div style={{ textAlign: 'center', lineHeight: '20px' }}>
            Vocalisation de séquence
            <div>{currentIndex + 1} / {story.nodes.length}</div>
          </div>
        </div>
        <div>
          <Button disabled={!hasPrevious || isRecording || isConverting} icon="arrow left" onClick={onLoadPreviousSequence} />
          <Button disabled={!hasNext || isRecording || isConverting} icon="arrow right" onClick={onLoadNextSequence} />
        </div>
      </Modal.Header>
      <Modal.Content>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '95%', display: 'flex' }}>
            <div className="sequence-content">
              { sequence.content }
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ReactMic
              record={isRecording}
              className="sound-wave"
              onStop={({blob, blobURL}) => !isSpeechSynthesis && onStop(blob, blobURL, 'reactMic')}
              mimeType="audio/mp3"
              strokeColor="#000000"
              backgroundColor="#dadada"
              channelCount={1}
              width={300}
              height={140}
            />
            { !automaticVocalization && (
              <div style={{ display: 'flex', marginTop: 15 }}>
                { blobSoundURI && (
                  <AudioPlayerProvider>
                    <AudioPlayer
                      file={blobSoundURI}
                      disabled={isRecording || isConverting}
                      onPlay={() => setIsPlaying(true)}
                      onStop={() => setIsPlaying(false)}
                    />
                  </AudioPlayerProvider>
                )}
                {
                  (speechSettings || defaultVoice) && (
                    <Button.Group style={{ margin: 2 }}>
                      <Popup
                        on='click'
                        open={isOpenVoiceList}
                        onOpen={() => setIsOpenVoiceList(true)}
                        onClose={() => setIsOpenVoiceList(false)}
                        trigger={ <Button color='grey' style={{ width: 108, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', padding: 3 }}>{(speechSettings || defaultVoice).label}</Button> }
                      >
                        <div style={{width: 180}}>
                          <Header content={ `Voix de synthèse (${configVoicesList.length})`} />
                          <List divided selection verticalAlign='middle'  style={{ minHeight: 50, maxHeight: 200, overflowY: 'auto' }}>
                            {configVoicesList.map(voice => (
                              <List.Item key={'voice-' + voice.id} onClick={() => onSelectVoice(voice)} style={{ fontWeight: voice.id === (speechSettings || defaultVoice).id ? 'bold' : 'normal' }}>
                                { voice.label }
                              </List.Item>
                            ))}
                          </List>
                        </div>
                      </Popup>
                      <Button style={{ paddingRight: '1.2em' }} onClick={() => recordSpeech()}>
                        <Image src='assets/robot.svg' style={{width: 30}} />
                      </Button>
                    </Button.Group>
                  )
                }
                <Button style={{ margin: 2 }} disabled={isRecording || isConverting || isPlaying} positive onClick={() => onVocalStart()}>Start</Button>
              </div>
            )}
            <Button style={{ margin: 2 }} disabled={!isRecording || isConverting || isPlaying} negative onClick={() => isSpeechSynthesis ? stopSpeech() : setIsRecording(false)}>Stop</Button>
          </div>
          {/*
          <div>
            isRecording: { isRecording ? '1' : '0' }<br/>
            isConverting: { isConverting ? '1' : '0' }<br/>
            isPlaying: { isPlaying ? '1' : '0' }<br/>
            isSpeechSynthesis: { isSpeechSynthesis ? '1' : '0' }
          </div>
          */}
        </div>
      </Modal.Content>
      <Modal.Actions>
        <Button
          id='modal-cancel-button'
          onClick={ onClose }
          disabled={ isRecording || isConverting || isPlaying }
        >Fermer</Button>
      </Modal.Actions>
    </Modal>
  )
}

const mapStateToProps = (state) => ({
  configVoicesList: state.settings.speech.voices,
  defaultVoice: settingsSelectors.getDefaultVoice(state)
})

export default connect(mapStateToProps)(MicModal)
