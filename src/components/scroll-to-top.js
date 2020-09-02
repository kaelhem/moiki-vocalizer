import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const ScrollToTop = ({target}) => {
  const { pathname } = useLocation()
  useEffect(() => {
    console.log('will scroll to top')
    document.getElementById(target).scrollTo(0, 0)
  }, [pathname, target])
  return null
}

export default ScrollToTop