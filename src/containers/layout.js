import React from 'react'
import { version } from '../../package.json'
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '../constants'
import AppMenu from 'containers/menu'

const Layout = ({ children }) => {
  return (
    <div className="app">
      <div className="app-columns">
        <div className="app-sidebar">
          <AppMenu />
        </div>
        <div className="content">
          <div style={{ width: '100%', height: 'calc(100vh - ' + ( HEADER_HEIGHT + FOOTER_HEIGHT ) + 'px)', overflowY: 'auto' }}>
            <div style={{ padding: '50px 20px' }}>
              { children }
            </div>
          </div>
        </div>
      </div>
      <div className="app-footer" style={{ height: FOOTER_HEIGHT, overflowY: 'hidden' }}>
        <div>Moiki Vocalizer - v{version} {'//'} kaelhem ©2020</div>
      </div>
    </div>
  )
}

export default Layout