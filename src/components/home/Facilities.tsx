import { FACILITIES, srcSet } from '../../config/site'
import { SectionHeading } from '../ui/Misc'

export function Facilities() {
  return (
    <section className="relative overflow-hidden bg-ink text-white">
      <div className="pointer-events-none absolute -top-48 -left-48 size-[36rem] rounded-full glow-cyan" />
      <div className="relative mx-auto max-w-7xl px-4 py-20 sm:px-6 sm:py-28 lg:px-8">
        <SectionHeading dark eyebrow="The facility" title="Everything you need." accent="Nothing you don’t." text="Purpose-built training space with premium, commercial-grade equipment — designed around how athletes actually train." />
        <div className="relative mt-12 grid auto-rows-[220px] gap-4 sm:grid-cols-2 lg:auto-rows-[250px] lg:grid-cols-4">
          {FACILITIES.map((f, i) => (
            <figure
              key={f.title}
              style={{ '--reveal-delay': `${i * 80}ms` } as React.CSSProperties}
              className={`reveal group relative overflow-hidden rounded-3xl bg-ink-3 ${f.size === 'lg' ? 'sm:col-span-2 lg:row-span-2' : ''}`}
            >
              <img src={f.image} srcSet={srcSet(f.image, [480, 800, 1000])} sizes="(min-width: 1024px) 50vw, 100vw" style={{ objectPosition: f.position }} alt={f.title} loading="lazy" decoding="async" className="size-full object-cover opacity-80 transition duration-700 ease-out group-hover:scale-110 group-hover:opacity-100" />
              <div className="absolute inset-0 bg-gradient-to-t from-ink via-ink/25 to-transparent" />
              <figcaption className="absolute inset-x-0 bottom-0 p-5 sm:p-6">
                <p className={`font-wide font-extrabold uppercase ${f.size === 'lg' ? 'text-2xl sm:text-3xl' : 'text-lg'}`}>{f.title}</p>
                <p className="mt-1 max-w-sm text-sm text-white/65 transition-all duration-500 group-hover:text-white/85">{f.text}</p>
                <span className="mt-3 block h-0.5 w-8 origin-left rounded bg-cyan-400 transition-all duration-500 group-hover:w-20" />
              </figcaption>
              <span className="absolute top-4 right-4 size-2 rounded-full bg-cyan-400 shadow-[0_0_12px_2px_rgb(34_211_238/0.8)] transition-transform duration-500 group-hover:scale-150" />
              <span className="pointer-events-none absolute inset-0 rounded-3xl ring-1 ring-white/0 transition duration-500 ring-inset group-hover:ring-cyan-300/60" />
            </figure>
          ))}
        </div>
      </div>
    </section>
  )
}
