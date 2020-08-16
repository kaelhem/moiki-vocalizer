import React from 'react'
import { connect } from 'react-redux'
import { getLocation } from 'connected-react-router'
import { Link } from 'react-router-dom'
import { Menu, Icon } from 'semantic-ui-react'

const MenuItem = ({name, icon, img, padding, uid, htmlId, activePath, imgStyle={}}) => {
  const active = uid === activePath
  return (
    <Menu.Item
      style={{
        color: active ? '#154f6b' : '#fff',
        fontWeight: 'bold',
        background: active ? '#d3e3f3' : 'rgba(255,255,255,.5)',
        padding: padding ? padding : 10,
        borderRadius: 6,
        marginLeft: 10,
        marginRight: 10
      }}
      className={ active ? 'active' : ''}
      id={ htmlId }
      as={ Link }
      to={ `${uid}` }
    >
      { icon && <div><Icon size='big' name={icon} style={{ margin: 'auto' }} /></div> }
      { name && <span style={{ marginTop: icon ? 10 : 0 }}>{name}</span> }
    </Menu.Item>
  )
}

const AppMenu = ({ story, activePath }) => {
  const entries = [
    {icon: 'home', uid: '/', htmlId: 'btHome'},
    {name: 'Projets', icon: 'th', uid: '/projects', htmlId: 'btStories'},
  ]
  if (story) {
    entries.push({name: 'Histoire', icon: 'book', uid: '/story', htmlId: 'btStory'})
  }
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
