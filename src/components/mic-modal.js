import React, { useState, useEffect } from 'react'
import { ipcRenderer as ipc } from 'electron'
import { ReactMic } from '@matuschek/react-mic'
import SpeechSynthesisRecorder from 'libs/speech-synthesis-recorder'
import { AudioPlayerProvider } from 'react-use-audio-player'
import AudioPlayer from 'components/audio-player'
import { Button, Modal, Label } from 'semantic-ui-react'
import kebabCase from 'lodash.kebabcase'

let isSpeechSynthesis = false

export const MicModal = ({ story, sequence, onClose, automaticVocalization, onLoadNextSequence, onStopAutomaticVocalization }) => {
  const [isRecording, setIsRecording] = useState(false)
  const [blobSound, setBlobSound] = useState(null)
  const [isConverting, setIsConverting] = useState(false)
  const [isPlaying, setIsPlaying] = useState(false)

  useEffect(() => {
    let cancelled = false

    ipc.on('ffmpeg-convert-complete', (event, res) => {
      if (!cancelled) {
        setIsConverting(false)
        console.log('ffmpeg-convert-complete - automaticVocalization: ' + automaticVocalization)
        isSpeechSynthesis = false
        onLoadNextSequence()
      }
    })

    return () => {
      cancelled = true
    }
  }, [automaticVocalization, onLoadNextSequence])

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
    setBlobSound({data: blob, uri: blobURL || URL.createObjectURL(blob)})
    
    const { folderName } = story.projectInfo
    const fileName = sequence.id
    const ab = await blob.arrayBuffer()
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
        voice: "Thomas", //"Amelie",
        lang: "fr-FR", //"fr-CA",
        pitch: .75,
        rate: 1.2,
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
                { blobSound && blobSound.uri && (
                  <AudioPlayerProvider>
                    <AudioPlayer
                      file={blobSound.uri}
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