import React from 'react'
import { connect } from 'react-redux'
import { getLocation } from 'connected-react-router'
import { Link } from 'react-router-dom'
import { Menu, Icon } from 'semantic-ui-react'

const entries = [
  {icon: 'home', uid: '/', htmlId: 'btHome'},
  {name: 'Projets', icon: 'th', uid: '/projects', htmlId: 'btStories'},
  {name: 'Histoire', icon: 'book', uid: '/story', htmlId: 'btStory'}
]

const MenuItem = ({name, icon, img, padding, uid, htmlId, activePath, imgStyle={}}) => {
  const active = uid === activePath
  return (
    <Menu.Item
      style={{
        color: active ? '#154f6b' : '#fff',
        fontWeight: 'bold',
        background: active ? 'rgba(255,255,255,.85)' : 'rgba(255,255,255,.15)',
        padding: padding ? padding : 10,
        borderRadius: 6,
        marginLeft: 10,
        marginRight: 10
      }}
      id={ htmlId }
      as={ Link }
      to={ `${uid}` }
    >
      { icon && <div><Icon size='big' name={icon} style={{ margin: 'auto' }} /></div> }
      { name && <span> {name}</span> }
    </Menu.Item>
  )
}

const AppMenu = ({ story, activePath }) => {
  return (
    <Menu text style={{ margin: 'auto 0.5em', height: '100%' }} vertical>
      { entries && entries.map((item, idx) => (
        <MenuItem key={ 'link-' + idx } {...{...item, activePath}} />
      ))}
    </Menu>
  )
}


const mapStateToProps = (state) => ({
  activePath: getLocation(state).pathname,
  story: state.story.story
})

export default connect(mapStateToProps)(AppMenu)
