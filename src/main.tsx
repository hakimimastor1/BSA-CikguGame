import { StrictMode, Suspense, lazy } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App'

// The projector, poster and admin pages load separately, so the game stays small on phones.
const Tv = lazy(() => import('./pages/Tv'))
const Poster = lazy(() => import('./pages/Poster'))
const Admin = lazy(() => import('./pages/Admin'))

const path = window.location.pathname.replace(/\/+$/, '') || '/'
const Page = path === '/tv' ? Tv : path === '/poster' ? Poster : path.startsWith('/admin') ? Admin : App

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <Suspense fallback={null}>
      <Page />
    </Suspense>
  </StrictMode>,
)
