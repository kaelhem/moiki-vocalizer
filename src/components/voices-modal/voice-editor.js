import React, { useState, useEffect, Fragment } from 'react'
import { Button, Label, Select, Icon, Loader, TextArea, Input, Divider } from 'semantic-ui-react'
import { Range } from 'react-range'
const uuid = require('uuid')

export const VoiceEditor = (props) => {
  const {
    voiceActions,
    testVoice,
    currentVoice,
    onEnd
  } = props

  const [settings, setSettings] = useState(null)
  const [listApiVoices, setListApiVoices] = useState(null)
  const [label, setLabel] = useState('')
  const [testSentence, setTestSentence] = useState('Je suis une voix de synthèse')

  useEffect(() => {
    let cancelled = false
    let interval = setInterval(() => {
      if (cancelled) {
        return
      }
      const voices = window.speechSynthesis.getVoices()
      if (voices.length > 0) {
        clearInterval(interval)
        const availableVoices = voices.map((x, idx) => ({
          key: 'voice-' + idx,
          voice: x.name,
          value: x.name,
          lang: x.lang,
          text: x.name + ' (' + x.lang + ')'
        }))
        setListApiVoices(availableVoices)
      }
    }, 50)
    return () => {
      cancelled = true
      clearInterval(interval)
    }
  }, [])

  useEffect(() => {
    if (!listApiVoices) {
      return
    }
    setLabel(currentVoice && currentVoice.label ? currentVoice.label : listApiVoices[0].voice + ' (modifiée)')
    setTestSentence(currentVoice && currentVoice.testSentence ? currentVoice.testSentence : 'Je suis une voix de synthèse')
    setSettings(currentVoice && currentVoice.data ? currentVoice.data : {
      voice: listApiVoices[0].voice,
      lang: listApiVoices[0].lang,
      pitch: 1,
      rate: 1
    })
  }, [currentVoice, listApiVoices])

  const updateSettings = (opts) => {
    let options = settings ? {...settings, ...opts} : opts
    setSettings(options)
  }

  const changeVoice = (newVoice) => {
    const {voice, lang} = listApiVoices.find(({voice}) => voice === newVoice)
    if (!label) {
      setLabel(voice)
    }
    updateSettings({voice, lang})
  }

  const reset = () => {
    const [defaultVoice] = listApiVoices
    setSettings({
      voice: defaultVoice.voice,
      lang: defaultVoice.lang,
      pitch: 1,
      rate: 1
    })
  }

  const saveVoice = () => {
    const voiceData = {
      data: settings,
      label,
      testSentence
    }
    if (currentVoice && currentVoice.id) {
      voiceActions.updateVoice({
        ...currentVoice,
        ...voiceData
      })
    } else {
      voiceActions.addVoice({
        id: uuid.v4(),
        ...voiceData
      })
    }
    reset()
    setLabel('')
    setSettings(null)
    setTestSentence(null)
    onEnd()
  }

  return settings ? (
    <Fragment>
      <div style={{ display: 'flex', flexDirection: 'column', margin: '.6em 0' }}>
        <span style={{ marginBottom: 5 }}>Nom</span>
        <Input fluid value={label} onChange={e => setLabel(e.target.value)} style={{ flexGrow: 1, width: 'auto' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', margin: '.6em 0' }}>
        <span style={{ marginBottom: 5 }}>Voix</span>
        <Select fluid value={settings.voice} onChange={(_, opt) => changeVoice(opt.value)} options={listApiVoices} style={{ flexGrow: 1, width: 'auto' }} />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', margin: '1em 0' }}>
        <div style={{ marginBottom: 8 }}>Pitch (tonalité) <Label size="mini" color="teal">{settings.pitch}</Label></div>
        <Range
          step={0.01}
          min={0}
          max={2}
          values={[settings.pitch]}
          onChange={values => updateSettings({pitch: values[0]})}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: 4,
                width: '100%',
                borderRadius: 4,
                backgroundColor: '#ccc'
              }}
            >
              {children}
            </div>
          )}
          renderThumb={({ props }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: 16,
                width: 16,
                borderRadius: 8,
                backgroundColor: '#3399ee',
                outline: 'none'
              }}
            />
          )}
        />
      </div>
      <div style={{ display: 'flex', flexDirection: 'column', margin: '1em 0' }}>
        <span style={{ marginBottom: 8 }}>Rate (fréquence) <Label size="mini" color="teal">{settings.rate}</Label></span>
        <Range
          step={0.01}
          min={.5}
          max={3.5}
          values={[settings.rate]}
          onChange={values => updateSettings({rate: values[0]})}
          renderTrack={({ props, children }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: 4,
                width: '100%',
                borderRadius: 4,
                backgroundColor: '#ccc'
              }}
            >
              {children}
            </div>
          )}
          renderThumb={({ props }) => (
            <div
              {...props}
              style={{
                ...props.style,
                height: 16,
                width: 16,
                borderRadius: 8,
                backgroundColor: '#3399ee',
                outline: 'none'
              }}
            />
          )}
        />
      </div>
      <TextArea
        rows={4}
        value={testSentence}
        onChange={e => setTestSentence(e.target.value)}
      />
      <div style={{ display: 'flex', margin: '.6em 0', justifyContent: 'center', alignItems: 'center' }}>
        <Button circular onClick={reset}>
          <Icon name='repeat' /> Voix par défaut
        </Button>
        <Button primary circular onClick={() => testVoice(settings, testSentence)}>
          <Icon name='play' /> Tester la voix
        </Button>
      </div>
      <Divider />
      <div style={{ display: 'flex', margin: '.6em 0', justifyContent: 'center', alignItems: 'center' }}>
        <Button size="big" primary circular onClick={saveVoice}>
          <Icon name='save' /> { currentVoice && currentVoice.id ? 'Enregistrer cette voix' : 'Ajouter cette voix' }
        </Button>
      </div>
      
    </Fragment>
  ) : (
    <Loader active={true} />
  )
}