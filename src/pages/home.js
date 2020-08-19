import React, { Fragment } from 'react'
import { connect } from 'react-redux'
import { Segment, Divider, Loader, Header, Button, Image } from 'semantic-ui-react'

const Home = (props) => {
  return (
    <Fragment>
      <div className="module-header" style={{ height: 240 }}>
        <div style={{ paddingTop: 20, paddingBottom: 20, textAlign: 'center' }}>
          <Header size="huge">Moiki Vocalizer</Header>
          <Image src='./logo512.png' size='small' centered />
        </div>
      </div>
      <div style={{ paddingTop: 240 }}>
        <div style={{ textAlign: 'center' }}>
          <p style={{ margin: '5em auto', fontSize: '1.2em', lineHeight: '1.2em' }}><b>Moiki Vocalizer</b> : transformez vos histoires faites avec <a href="https://moiki.fr" target="_blank" rel="noopener noreferrer">Moiki</a> en audio !</p>
          {/*<Button className="link-button" as='a' href="https://github.com/kaelhem/moiki-vocalizer" target="_blank" primary size="big" style={{ marginBottom: '2em' }}>Comment ça marche ?</Button>*/}
          <div style={{ textAlign: 'left', display: 'flex', flexDirection: 'column', width: 500, margin: 'auto' }}>
            <Divider horizontal>en bref</Divider>
            <ul style={{ margin: '2em auto', marginTop: 0, fontSize: '1.2em', lineHeight: '1.2em', listStyleType: 'none', padding: 0 }}>
              <li><span role="img" aria-label="Microphone">🎙️</span> enregistrements avec <b>micro</b> ou <b>synthèse vocale</b></li>
              <li><span role="img" aria-label="Snowman">♻️</span> conservation des <b>actions</b> et <b>conditions</b></li>
              <li><span role="img" aria-label="Musique">🎵</span> conservation des <b>boucles</b> et <b>effets sonores</b></li>
              <li><span role="img" aria-label="Feu">🔥</span> export en html5</li>
              <li><span role="img" aria-label="Licorne">🦄</span> export vers <a href="https://github.com/marian-m12l/studio" target="_blank" rel="noopener noreferrer">STUdio</a>*</li>
            </ul>
          </div>
          <Divider />
          <em>* STUdio est un outil non-officiel pour créer des histoires et les transférer vers une <a href="https://www.lunii.fr/" target="_blank" rel="noopener noreferrer">Fabrique à histoires de Lunii</a></em>
        </div>
      </div>
    </Fragment>
  )
}

const mapStateToProps = (state) => ({
  
})

const mapDispatchToProps = (dispatch) => ({
  
})
export default connect(mapStateToProps, mapDispatchToProps)(Home)