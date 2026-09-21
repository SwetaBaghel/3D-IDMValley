import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import PricingCalculator from './pages/PricingCalculator.jsx'
import './index.css'

/* Always start at the top on every page load — prevents the browser from
   restoring the previous scroll position or jumping to a hash anchor. */
if (window.history.scrollRestoration) {
  window.history.scrollRestoration = 'manual'
}
window.scrollTo(0, 0)
if (window.location.hash) {
  window.history.replaceState(null, '', window.location.pathname)
}

const isPricingCalc = window.location.pathname === '/pricing-calculator'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {isPricingCalc ? <PricingCalculator /> : <App model="bracket" />}
  </StrictMode>,
)
