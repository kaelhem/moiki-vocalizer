import React from 'react'
import { version } from '../../package.json'
import { HEADER_HEIGHT, FOOTER_HEIGHT } from '../constants'
import AppMenu from 'containers/menu'
import ScrollToTop from 'components/scroll-to-top'

const Layout = ({ children }) => {
  return (
    <div className="app">
      <div className="app-columns">
        <div className="app-sidebar">
          <AppMenu />
          <div className="app-footer">
            <div>Moiki Vocalizer<br/>v{version}<br/>kaelhem ©2020</div>
          </div>
        </div>
        <div className="content">
          <div id='scrolling-main-content' style={{ width: '100%', height: 'calc(100vh - ' + ( HEADER_HEIGHT ) + 'px)', overflowY: 'auto' }}>
            <ScrollToTop target='scrolling-main-content' />
            <div style={{ padding: 20 }}>
              { children }
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Layout