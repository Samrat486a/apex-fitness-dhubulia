import { CtaBanner } from '../components/home/CtaBanner'
import { Facilities } from '../components/home/Facilities'
import { Hero } from '../components/home/Hero'
import { HowItWorks } from '../components/home/HowItWorks'
import { Location } from '../components/home/Location'
import { PlansSection } from '../components/home/Plans'
import { Programs } from '../components/home/Programs'
import { Stats } from '../components/home/Stats'
import { Testimonials } from '../components/home/Testimonials'
import { Trainers } from '../components/home/Trainers'
import { usePageTitle, useReveal } from '../lib/hooks'

export default function Home() {
  usePageTitle('')
  const ref = useReveal<HTMLDivElement>()
  return (
    <div ref={ref}>
      <Hero />
      <Stats />
      <Programs limit={6} />
      <PlansSection />
      {/* Below-the-fold: the browser skips rendering these until they're close to the viewport */}
      <div className="cv-auto">
        <Facilities />
      </div>
      <div className="cv-auto">
        <HowItWorks />
      </div>
      <div className="cv-auto">
        <Trainers />
      </div>
      <div className="cv-auto">
        <Testimonials />
      </div>
      <div className="cv-auto">
        <Location />
      </div>
      <div className="cv-auto">
        <CtaBanner />
      </div>
    </div>
  )
}
