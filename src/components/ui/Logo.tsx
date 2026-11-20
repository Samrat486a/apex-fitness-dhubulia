import { Link } from 'react-router-dom'
import { BRAND } from '../../config/site'

/**
 * Official Apex Fitness logo (public/brand/).
 *  • tone "dark"  — dark lettering, for light backgrounds (navbar, member area)
 *  • tone "light" — white lettering, for dark backgrounds (footer, admin sidebar)
 *  • size "md" for bars and sidebars, "lg" for the footer
 */
export function Logo({ tone = 'dark', to = '/', size = 'md' }: { tone?: 'dark' | 'light'; to?: string; size?: 'md' | 'lg' }) {
  const files = tone === 'dark' ? BRAND.logo : BRAND.logoOnDark
  const lg = size === 'lg'
  const height = lg ? 154 : 68
  return (
    <Link to={to} className="group inline-flex shrink-0 items-center" aria-label="Apex Fitness — home">
      <img
        src={lg ? files.full : files.small}
        srcSet={lg ? undefined : `${files.small} 320w, ${files.full} 1000w`}
        sizes={lg ? undefined : '200px'}
        alt="Apex Fitness"
        width={Math.round(height * BRAND.logoRatio)}
        height={height}
        decoding={lg ? 'async' : 'sync'}
        loading={lg ? 'lazy' : 'eager'}
        className={`w-auto transition-[transform,filter] duration-[1200ms] ease-[cubic-bezier(0.22,0.8,0.3,1)] group-hover:scale-[1.04] group-hover:delay-300 ${
          tone === 'dark'
            ? 'group-hover:drop-shadow-[0_4px_14px_rgb(6_182_212/0.35)]'
            : 'group-hover:drop-shadow-[0_0_20px_rgb(34_211_238/0.45)]'
        } ${lg ? 'h-32 sm:h-[154px]' : 'h-[54px] sm:h-[58px] lg:h-[68px]'}`}
      />
    </Link>
  )
}
