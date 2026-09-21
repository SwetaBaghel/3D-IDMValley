import { Suspense } from 'react'
import { Canvas } from '@react-three/fiber'
import { Environment, Preload } from '@react-three/drei'
import { brand, outcomes, stats } from '../../data/siteContent'
import CountUp from '../ui/CountUp'
import GradientText from '../ui/GradientText'
import Section from '../ui/Section'
import SectionHeading from '../ui/SectionHeading'
import AboutModel from '../../three/AboutModel'

/**
 * About. The hub rotates in tight behind this grid, so the matrix sits on a
 * translucent card that lets the satin framing read through it.
 */
export default function About() {
  return (
    <Section id="about" className="py-24 sm:py-32">
      <SectionHeading
        eyebrow="About Us"
        title={
          <>
            A full-service digital agency built around{' '}
            <GradientText italic>automation</GradientText>.
          </>
        }
        lead={brand.description}
      />

      <div className="mt-14 grid items-center gap-10 lg:grid-cols-[minmax(0,0.95fr)_minmax(0,1fr)] lg:gap-6">
        <div className="pointer-events-none mx-auto aspect-square w-full max-w-[40rem]">
          <Canvas
            className="w-full h-full"
            camera={{ fov: 45, position: [0, 0.5, 4.5], near: 0.1, far: 100 }}
            gl={{ alpha: true, antialias: true }}
          >
            <Suspense fallback={null}>
              <AboutModel />
              <Environment preset="studio" />
              <Preload all />
            </Suspense>
          </Canvas>
        </div>

        <div className="rounded-2xl border border-rule bg-snow-raised/80 p-6 shadow-lift backdrop-blur-md sm:p-9">
        <p className="text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
          Agency statistics matrix
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-rule lg:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-snow-raised px-5 py-7">
              <dd className="font-display text-[2.1rem] leading-none font-semibold text-ink">
                <CountUp value={stat.value} suffix={stat.suffix} />
              </dd>
              <dt className="mt-2.5 text-[12.5px] leading-snug text-body">
                {stat.label}
              </dt>
            </div>
          ))}
        </dl>

        <p className="mt-9 text-[11px] font-semibold tracking-[0.2em] text-muted uppercase">
          Measured outcomes
        </p>

        <dl className="mt-6 grid grid-cols-2 gap-px overflow-hidden rounded-xl bg-rule lg:grid-cols-4">
          {outcomes.map((outcome) => (
            <div key={outcome.label} className="hatch-matrix bg-snow-raised px-5 py-7">
              <dd className="font-display text-[2.1rem] leading-none font-semibold text-signal">
                <CountUp
                  value={outcome.value}
                  prefix={outcome.prefix ?? ''}
                  suffix={outcome.suffix}
                />
              </dd>
              <dt className="mt-2.5 text-[12.5px] leading-snug text-body">
                {outcome.label}
              </dt>
            </div>
          ))}
        </dl>
      </div>
      </div>
    </Section>
  )
}
