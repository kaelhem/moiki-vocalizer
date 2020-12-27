import React, { Fragment, useEffect } from 'react'

const KEYCODE_ACTIONS = {
  PREVIOUS: 37,   // ArrowLeft
  NEXT: 39,       // ArrowRight
  TOGGLE_REC: 32  // Space

}

export const ControlsShortcuts = ({ onPrevious, onNext, onToggleRec }) => {  
  const onKeyDown = (e) => {
    //if ((window.navigator.platform.match('Mac') ? e.metaKey : e.ctrlKey)) {
    switch (e.keyCode) {
      case KEYCODE_ACTIONS.PREVIOUS: {
        e.preventDefault()
        if (onPrevious && typeof onPrevious === 'function') {
          onPrevious()
        }
        break
      }
      case KEYCODE_ACTIONS.NEXT: {
        e.preventDefault()
        if (onNext && typeof onNext === 'function') {
          onNext()
        }
        break
      }
      case KEYCODE_ACTIONS.TOGGLE_REC: {
        e.preventDefault()
        if (onToggleRec && typeof onToggleRec === 'function') {
          onToggleRec()
        }
        break
      }
      default: {
        // nothing
      }
    }
    //}
  }

  useEffect(() => {
    document.addEventListener('keydown', onKeyDown, false)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
    }
  })
  
  return <Fragment />
}