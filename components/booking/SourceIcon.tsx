'use client'

import type { BookingSource } from '@/types/booking'
import { siAirbnb, siBookingdotcom, siFacebook, siTiktok } from 'simple-icons'
import { Home } from 'lucide-react'

interface SourceIconProps {
  source: BookingSource
  size?: number
  /** Use currentColor instead of brand hex (for use on coloured backgrounds) */
  mono?: boolean
  className?: string
}

function BrandSVG({
  path,
  hex,
  size,
  mono,
}: {
  path: string
  hex: string
  size: number
  mono?: boolean
}) {
  return (
    <svg
      role="img"
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill={mono ? 'currentColor' : `#${hex}`}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <path d={path} />
    </svg>
  )
}

function AgodaIcon({ size, mono }: { size: number; mono?: boolean }) {
  if (mono) {
    return (
      <svg
        viewBox="0 0 24 24"
        width={size}
        height={size}
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        style={{ flexShrink: 0 }}
      >
        <circle cx="12" cy="12" r="12" fill="currentColor" fillOpacity="0.18" />
        <text
          x="12"
          y="16.5"
          textAnchor="middle"
          fill="currentColor"
          fontSize="13"
          fontWeight="800"
          fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
        >
          a
        </text>
      </svg>
    )
  }
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      xmlns="http://www.w3.org/2000/svg"
      aria-hidden="true"
      style={{ flexShrink: 0 }}
    >
      <circle cx="12" cy="12" r="12" fill="#E31837" />
      <text
        x="12"
        y="16.5"
        textAnchor="middle"
        fill="white"
        fontSize="13"
        fontWeight="800"
        fontFamily="ui-sans-serif, system-ui, -apple-system, sans-serif"
      >
        a
      </text>
    </svg>
  )
}

export default function SourceIcon({
  source,
  size = 16,
  mono,
  className,
}: SourceIconProps) {
  switch (source) {
    case 'airbnb':
      return <BrandSVG path={siAirbnb.path} hex={siAirbnb.hex} size={size} mono={mono} />
    case 'booking':
      return <BrandSVG path={siBookingdotcom.path} hex={siBookingdotcom.hex} size={size} mono={mono} />
    case 'facebook':
      return <BrandSVG path={siFacebook.path} hex={siFacebook.hex} size={size} mono={mono} />
    case 'tiktok':
      return (
        <BrandSVG
          path={siTiktok.path}
          hex={mono ? '000000' : '010101'}
          size={size}
          mono={mono}
        />
      )
    case 'agoda':
      return <AgodaIcon size={size} mono={mono} />
    case 'direct':
      return (
        <Home
          size={size}
          className={className}
          aria-hidden="true"
          style={{ flexShrink: 0, color: mono ? 'currentColor' : '#71717a' }}
        />
      )
    default:
      return null
  }
}
