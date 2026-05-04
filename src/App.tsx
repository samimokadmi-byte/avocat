import Nav from './components/Nav'
import Hero from './components/Hero'
import System from './components/System'
import Method from './components/Method'
import Results from './components/Results'
import Filter from './components/Filter'
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
        <Method />
        <Results />
        <Filter />
        <Testimonials />
        <FAQ />
        <Booking />
      </main>
    </div>
  )
}
