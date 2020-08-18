import React, { useState, useEffect } from 'react'
import { selectors as settingsSelectors } from 'core/reducers/settings'
import { connect } from 'react-redux'
import { ipcRenderer as ipc } from 'electron'
import { ReactMic } from '@matuschek/react-mic'
import SpeechSynthesisRecorder from 'libs/speech-synthesis-recorder'
import { AudioPlayerProvider } from 'react-use-audio-player'
import AudioPlayer from 'components/audio-player'
import { Button, Modal, Label } from 'semantic-ui-react'
import moment from 'moment'
import './sequence-vocalizer.css'

let isSpeechSynthesis = false
let cancelled = false

const MicModal = (props) => {
  const {
    story,
    sequence,
    speechSettings,
    onClose,
    automaticVocalization,
    onLoadNextSequence,
    onLoadPreviousSequence,
    onStopAutomaticVocalization,
    onSequenceUpdated,
    configVoicesList,
    defaultVoice
  } = props

  const [isRecording, setIsRecording] = useState(false)
  const [blobSoundURI, setBlobSoundURI] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

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
      isSpeechSynthesis = false
      onLoadNextSequence()
    }
  }

  useEffect(() => {
    if (automaticVocalization && sequence) {
      recordSpeech()
    }
  }, [automaticVocalization, sequence])

  const onStop = async (blob, blobURL=null) => {
    setIsRecording(false)
    setIsConverting(true)
    setBlobSoundURI(blobURL || URL.createObjectURL(blob))
    
    onSequenceUpdated && onSequenceUpdated(sequence, blob)
    
    const { folderName } = story.projectInfo
    const fileName = sequence.id
    const ab = await blob.arrayBuffer()
    ipc.on('ffmpeg-convert-complete', onConvertComplete)
    ipc.send('ffmpeg-convert-webm2mp3', ab, folderName, fileName)
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
    const opts = speechSettings || (defaultVoice && defaultVoice.data) ? {
      ...defaultUtteranceOptions,
      ...(speechSettings || defaultVoice.data)
    } : defaultUtteranceOptions
    new SpeechSynthesisRecorder({
      text: sequence.content, 
      utteranceOptions: opts
    }).start()
      .then(tts => tts.blob())
      .then((blob) => onStop(blob.data))
  }

  const stopSpeech = () => {
    setIsRecording(false)
    onStopAutomaticVocalization()
  }

  return sequence !== null ? (
    <Modal open={true} className="mic-modal">
      <Modal.Header style={{ background: '#4c77ac', color: '#fff' }}>
        { sequence && (
          <Label style={{ marginRight: 10 }} content={<span style={{ fontSize: '1.5em' }}>{ sequence.id }</span>} />
        )}
        Vocalisation de séquence
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
              onStop={({blob, blobURL}) => !isSpeechSynthesis && onStop(blob, blobURL)}
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
                <Button style={{ margin: 2 }} disabled={isRecording || isConverting || isPlaying} onClick={() => recordSpeech()}>text-to-speech recorder (robot)</Button>
                <Button style={{ margin: 2 }} disabled={isRecording || isConverting || isPlaying} positive onClick={() => setIsRecording(true)}>Start</Button>
              </div>
            )}
            <Button style={{ margin: 2 }} disabled={!isRecording || isConverting || isPlaying} negative onClick={() => isSpeechSynthesis ? stopSpeech() : setIsRecording(false)}>Stop</Button>
          </div>
          {/*
          <div>
            isRecording: { isRecording ? '1' : '0' }<br/>
            isConverting: { isConverting ? '1' : '0' }<br/>
            isPlaying: { isPlaying ? '1' : '0' }
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
  ) : null
}

const mapStateToProps = (state) => ({
  configVoicesList: state.settings.speech.voices,
  defaultVoice: settingsSelectors.getDefaultVoice(state)
})

export default connect(mapStateToProps)(MicModal)
