import type { ReactNode } from 'react'

interface ManorFrameProps {
  children: ReactNode
}

/**
 * Ornamental "cutaway" frame around the floor plan: gable roofline + chimney +
 * weathervane on top, stone foundation below, brick pillars on the sides.
 * Purely visual — the floor plan grid still lives inside.
 */
export function ManorFrame({ children }: ManorFrameProps) {
  return (
    <div className="relative">
      {/* Roofline */}
      <svg
        viewBox="0 0 100 14"
        preserveAspectRatio="none"
        aria-hidden
        className="absolute -top-[3.2rem] left-0 w-full h-12"
      >
        {/* Gable — using the lighter oak so it reads against any theme */}
        <polygon
          points="0,14 50,0 100,14"
          fill="var(--color-bastion-oak)"
          stroke="var(--color-bastion-gold)"
          strokeWidth="0.4"
          strokeLinejoin="round"
        />
        {/* Roof shingles — gold hatch */}
        <line x1="0" y1="14" x2="50" y2="0" stroke="var(--color-bastion-gold)" strokeWidth="0.2" opacity="0.6" />
        <line x1="100" y1="14" x2="50" y2="0" stroke="var(--color-bastion-gold)" strokeWidth="0.2" opacity="0.6" />
        {/* Chimney on the right side of the gable */}
        <rect
          x="65"
          y="-1"
          width="3"
          height="6"
          fill="var(--color-bastion-oak-deep)"
          stroke="var(--color-bastion-gold)"
          strokeWidth="0.2"
        />
        <rect
          x="64.5"
          y="-1.5"
          width="4"
          height="0.7"
          fill="var(--color-bastion-oak)"
        />
        {/* Weathervane on the apex — a small banner */}
        <line x1="50" y1="0" x2="50" y2="-3" stroke="var(--color-bastion-gold-bright)" strokeWidth="0.5" />
        <polygon
          points="50,-3 53,-2.5 50,-2"
          fill="var(--color-bastion-crimson)"
          stroke="var(--color-bastion-gold-bright)"
          strokeWidth="0.2"
        />
      </svg>

      {/* Manor body — wraps the actual children */}
      <div className="relative border-x-4 border-bastion-oak-deep bg-bastion-night/30 p-3 shadow-[0_0_0_1px_var(--color-bastion-oak)]">
        {/* Side brick texture (left) */}
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 left-0 w-1 bg-gradient-to-r from-bastion-oak-deep to-transparent"
        />
        <div
          aria-hidden
          className="pointer-events-none absolute inset-y-0 right-0 w-1 bg-gradient-to-l from-bastion-oak-deep to-transparent"
        />
        {children}
      </div>

      {/* Stone foundation */}
      <svg
        viewBox="0 0 100 6"
        preserveAspectRatio="none"
        aria-hidden
        className="block w-full h-5"
      >
        <rect
          x="0"
          y="0"
          width="100"
          height="6"
          fill="var(--color-bastion-stone)"
          stroke="var(--color-bastion-oak-deep)"
          strokeWidth="0.3"
        />
        {/* Stone block hatching */}
        {[10, 30, 50, 70, 90].map((x) => (
          <line
            key={`a${x}`}
            x1={x}
            y1="0"
            x2={x}
            y2="3"
            stroke="var(--color-bastion-oak-deep)"
            strokeWidth="0.15"
          />
        ))}
        {[20, 40, 60, 80].map((x) => (
          <line
            key={`b${x}`}
            x1={x}
            y1="3"
            x2={x}
            y2="6"
            stroke="var(--color-bastion-oak-deep)"
            strokeWidth="0.15"
          />
        ))}
        <line x1="0" y1="3" x2="100" y2="3" stroke="var(--color-bastion-oak-deep)" strokeWidth="0.15" />
      </svg>
    </div>
  )
}
