import Nav from './components/Nav'
import Hero from './components/Hero'
import System from './components/System'
import Expertises from './components/Expertises'
import Method from './components/Method'
import Honoraires from './components/Honoraires'
import Results from './components/Results'
import CasEtudes from './components/CasEtudes'
import Filter from './components/Filter'
import Veille from './components/Veille'
import Testimonials from './components/Testimonials'
import FAQ from './components/FAQ'
import Booking from './components/Booking'

export default function App() {
  return (
    <div className="bg-offwhite text-navy font-sans">
      <Nav />
      <main>
        <Hero />
        <System />
        <Expertises />
        <Method />
        <Honoraires />
        <Results />
        <CasEtudes />
        <Filter />
        <Veille />
        <Testimonials />
        <FAQ />
        <Booking />
      </main>
    </div>
  )
}
