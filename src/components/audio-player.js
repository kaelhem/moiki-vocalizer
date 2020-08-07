import React, { useEffect } from 'react'
import { useAudioPlayer } from 'react-use-audio-player'
import { Button } from 'semantic-ui-react'

const AudioPlayer = ({ file, disabled, onPlay, onStop }) => {
  const { togglePlayPause, ready, loading, playing } = useAudioPlayer({
    src: file,
    format: "mp3",
    autoplay: false
  })

  useEffect(() => {
    if (playing) {
      onPlay()
    } else {
      onStop()
    }
  }, [onPlay, onStop, playing])

  return (
    <Button
      style={{ margin: 2 }} 
      loading={loading}
      disabled={(!ready && !loading) || disabled}
      icon={playing ? "pause" : "play"}
      primary
      onClick={togglePlayPause}
    />
  )
}

export default AudioPlayer