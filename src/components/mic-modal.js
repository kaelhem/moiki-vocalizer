import React, { useState, useEffect } from 'react'
import { ipcRenderer as ipc } from 'electron'
import { ReactMic } from '@matuschek/react-mic'
import SpeechSynthesisRecorder from 'libs/speech-synthesis-recorder'
import { AudioPlayerProvider } from 'react-use-audio-player'
import AudioPlayer from 'components/audio-player'
import { Button, Modal, Label } from 'semantic-ui-react'

let isSpeechSynthesis = false
let cancelled = false

export const MicModal = (props) => {
  const {
    story,
    sequence,
    onClose,
    automaticVocalization,
    onLoadNextSequence,
    onStopAutomaticVocalization,
    onSequenceUpdated
  } = props

  const [isRecording, setIsRecording] = useState(false)
  const [blobSoundURI, setBlobSoundURI] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingSound, setIsLoadingSound] = useState(false)

  const onSoundLoaded = (event, err, buffer) => {
    ipc.removeListener('sound-file-loaded', onSoundLoaded)
    if (err) {
      console.log(err)
    } else {
      const blob = new Blob([buffer])
      setBlobSoundURI(URL.createObjectURL(blob))
    }
    setIsLoadingSound(false)
  }

  const loadSound = () => {
    setIsLoadingSound(true)
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

  const onConvertComplete = () => {
    ipc.removeListener('ffmpeg-convert-complete', onConvertComplete)
    if (!cancelled) {
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

  const onStart = () => {
    //console.log('Start record')
  }

  const onData = () => {
    //console.log('is recording... (' + sequence.content + ')')
  }

  const onStop = async (blob, blobURL=null) => {
    console.log('onStop...')
    setIsRecording(false)
    setIsConverting(true)
    console.log('converting... tts ? ' + isSpeechSynthesis)
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
    onStart()
    new SpeechSynthesisRecorder({
      text: sequence.content, 
      utteranceOptions: {
        voice: "Thomas", // "Amelie",
        lang: "fr-FR", // "fr-CA",
        pitch: .75, // 0.8
        rate: 1.2, // 1.05
        volume: 2
      }
    }).start()
      .then(tts => tts.blob())
      .then((blob) => onStop(blob.data))
  }

  const stopSpeech = () => {
    setIsRecording(false)
    onStopAutomaticVocalization()
  }

  return sequence !== null ? (
    <Modal open={true}>
      <Modal.Header style={{ background: '#4c77ac', color: '#fff' }}>
        { sequence && (
          <Label style={{ marginRight: 10 }} content={<span style={{ fontSize: '1.5em' }}>{ sequence.id }</span>} />
        )}
        Vocalisation de séquence
      </Modal.Header>
      <Modal.Content>
        <div style={{ display: 'flex' }}>
          <div style={{ width: '95%', display: 'flex' }}>
            <div style={{ marginRight: 20, display: 'flex', justifyContent: 'center', alignItems: 'center', background: '#dadada', width: '100%', padding: 15, textAlign: 'center' }}>
              { sequence.content }
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <ReactMic
              record={isRecording}
              className="sound-wave"
              onStart={onStart}
              onStop={({blob, blobURL}) => !isSpeechSynthesis && onStop(blob, blobURL)}
              onData={onData}
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