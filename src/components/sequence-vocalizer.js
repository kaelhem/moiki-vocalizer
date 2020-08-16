import React, { forwardRef, useImperativeHandle, useState, Fragment } from 'react'
import { ipcRenderer as ipc } from 'electron'
import { AudioPlayerProvider } from 'react-use-audio-player'
import AudioPlayer from 'components/audio-player'
import { Button, Segment, Label } from 'semantic-ui-react'

const SequenceLabel = ({index, identifier}) => (
  <Label
    attached='top left'
    content={
      <Fragment>
        <span style={{ fontSize: '1.5em' }}>{ index }</span> (<em>{identifier}</em>)
      </Fragment>
    }
  />
)

const SequenceVocalizer = forwardRef((props, ref) => {
  const {
    sequence,
    index,
    hasSound,
    folderName,
    editSound
  } = props

  const [blobSoundURI, setBlobSoundURI] = useState(null)
  const [isPlaying, setIsPlaying] = useState(false)
  const [isLoadingSound, setIsLoadingSound] = useState(false)
  const [autoplay, setAutoplay] = useState(false)

  useImperativeHandle(ref, () => ({
    updateSound: (blob) => {
      setAutoplay(false)
      setBlobSoundURI(URL.createObjectURL(blob))
    }
  }))

  const onSoundLoaded = (event, err, buffer) => {
    ipc.removeListener('sound-file-loaded', onSoundLoaded)
    if (err) {
      console.log(err)
    } else {
      const blob = new Blob([buffer])
      setAutoplay(true)
      setBlobSoundURI(URL.createObjectURL(blob))
    }
    setIsLoadingSound(false)
  }

  const loadSound = () => {
    setIsLoadingSound(true)
    ipc.on('sound-file-loaded', onSoundLoaded)
    ipc.send('load-sound-file', folderName, sequence.id + '.mp3')
  }

  const onPlay = () => {
    setIsPlaying(true)
    if (!blobSoundURI && !isLoadingSound) {
      loadSound()
    }
  }

  const onStop = () => {
    setIsPlaying(false)
  }

  return (
    <div className="sequence-vocalizer" style={{ marginBottom: 10 }}>
      <Segment padded>
        <SequenceLabel index={index} identifier={sequence.id} />
        <div>{sequence.content}</div>
        <div>
          { (hasSound && blobSoundURI) ? (
            <AudioPlayerProvider>
              <AudioPlayer
                file={blobSoundURI}
                autoplay={autoplay}
                onStop={onStop}
              />
            </AudioPlayerProvider>
          ) : (
            <Button
              style={{ margin: 2 }} 
              loading={isLoadingSound}
              disabled={!hasSound}
              icon={isPlaying ? "pause" : "play"}
              primary={hasSound}
              onClick={onPlay}
            />
          )}
          <Button negative onClick={() => editSound(sequence)}>Edit sound...</Button>
        </div>
      </Segment>
    </div>
  )
})

export default SequenceVocalizer
