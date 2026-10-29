import { useId } from 'react'

// Circular "The Paw Unit" stamp shown in the corner of each screen
function PawBadge() {
  const pathId = useId()

  return (
    <svg className="paw-badge" viewBox="0 0 120 120" aria-hidden="true">
      <defs>
        <path
          id={pathId}
          d="M60 60 m-44 0 a44 44 0 1 1 88 0 a44 44 0 1 1 -88 0"
        />
      </defs>

      <text className="paw-badge-text">
        <textPath href={`#${pathId}`} textLength="272">
          The Paw Unit · The Paw Unit ·
        </textPath>
      </text>

      <g className="paw-badge-paw">
        <ellipse cx="60" cy="68" rx="13" ry="11" />
        <ellipse cx="45" cy="54" rx="5" ry="6.5" transform="rotate(-20 45 54)" />
        <ellipse cx="54" cy="46" rx="5" ry="6.5" transform="rotate(-6 54 46)" />
        <ellipse cx="66" cy="46" rx="5" ry="6.5" transform="rotate(6 66 46)" />
        <ellipse cx="75" cy="54" rx="5" ry="6.5" transform="rotate(20 75 54)" />
      </g>
    </svg>
  )
}

export default PawBadge
