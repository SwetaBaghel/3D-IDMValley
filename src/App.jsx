import { Suspense, lazy } from 'react'
import Footer from './components/Footer'
import Navbar from './components/Navbar'
import About from './components/sections/About'
import Contact from './components/sections/Contact'
import HeroCarousel from './components/sections/HeroCarousel'
import Home from './components/sections/Home'
import Portfolio from './components/sections/Portfolio'
import Pricing from './components/sections/Pricing'
import Services from './components/sections/Services'
import { useActivePageObserver } from './hooks/useActivePage'
import { useReducedMotionSync, useScrollTimeline } from './hooks/useScrollTimeline'

/* The WebGL stage is split out of the initial bundle: the document is fully
   readable and interactive before three.js has finished parsing. */
const Scene = lazy(() => import('./three/Scene'))

/** @param {{ model?: 'screen' | 'bracket' }} props — which 3D asset to stage. */
export default function App({ model = 'screen' }) {
  useReducedMotionSync()
  useActivePageObserver()
  useScrollTimeline()

  return (
    <>
      {/* Base layer, bottom to top:
            body            #fbfbfb
            grid-matrix     opaque snow + engineering grid lines (-z-20)
            ambient-mesh    translucent chroma wash (-z-10)
            canvas          alpha:true, so both show through (z-0)
          The mesh sits ABOVE the grid so its violet/cyan wash tints the grid
          lines too and the base reads as one surface rather than two. */}
      <div
        aria-hidden="true"
        className="grid-matrix grid-matrix-mask pointer-events-none fixed inset-0 -z-20"
      />
      <div
        aria-hidden="true"
        className="ambient-mesh pointer-events-none fixed inset-0 -z-10"
      />

      <Suspense fallback={null}>
        <Scene model={model} />
      </Suspense>

      <a
        href="#home"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:left-4 focus:z-[60] focus:rounded-full focus:bg-ink focus:px-4 focus:py-2 focus:text-sm focus:text-white"
      >
        Skip to content
      </a>

      <Navbar />

      <main>
        {model === 'bracket' ? <HeroCarousel /> : <Home />}
        <About />
        <Services />
        <Portfolio />
        <Pricing />
        <Contact planeSlot={model === 'bracket'} />
      </main>

      <Footer credits={model === 'bracket'} />
    </>
  )
}
