import React, { useState, Fragment } from 'react'
//import { AudioPlayerProvider } from 'react-use-audio-player'
//import AudioPlayer from 'components/audio-player'
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

const SequenceVocalizer = ({ sequence, index, editSound }) => {
  const [blobSound, setBlobSound] = useState(null)
  /*
  const onStart = () => {
    if (onStartRecording) {
      onStartRecording()
    }
  }
  
  const onData = () => {
    console.log('is recording... (' + sequence.content + ')')
  }

  const onStop = (blob, blobURL=null) => {
    setBlobSound({data: blob, uri: blobURL || URL.createObjectURL(blob)})
    if (onStopRecording) {
      onStopRecording()
    }
  }*/

  /*const exportSound = () => {
    const element = document.createElement("a")
    element.href = blobSound.uri
    element.download = "file.mp3"
    element.click()
  }*/

  return (
    <div className="sequence-vocalizer" style={{ marginBottom: 10 }}>
      <Segment padded>
        <SequenceLabel index={index} identifier={sequence.id} />
        <div>{sequence.content}</div>
        { /*blobSound && blobSound.uri && (
          <AudioPlayerProvider>
            <AudioPlayer file={blobSound.uri} />
          </AudioPlayerProvider>
        )*/}
        <div>
          <Button negative onClick={() => editSound(sequence)}>Edit sound...</Button>
          { /* blobSound && blobSound.uri && (
            <Fragment>
              <Button disabled={isPending} onClick={() => exportSound()}>export sound</Button>
            </Fragment>
          ) */}
        </div>
      </Segment>
    </div>
  )
}

export default SequenceVocalizer
