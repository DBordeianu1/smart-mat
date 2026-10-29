// Line icons for the Home screen cards (24x24, inherit text color)

function Icon({ children }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function SunIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M2.5 12h2M19.5 12h2M5.3 5.3l1.4 1.4M17.3 17.3l1.4 1.4M5.3 18.7l1.4-1.4M17.3 6.7l1.4-1.4" />
    </Icon>
  )
}

export function SoundIcon() {
  return (
    <Icon>
      <path d="M4 10.5v3M6.5 8v8M9 5v14M11.5 8.5v7M14 6v12M16.5 9v6M19 10.5v3" />
    </Icon>
  )
}

export function TreatIcon() {
  return (
    <Icon>
      <path
        transform="rotate(-30 12 12)"
        d="M6.5 9.5H17.5A2.4 2.4 0 1 1 19.4 12A2.4 2.4 0 1 1 17.5 14.5H6.5A2.4 2.4 0 1 1 4.6 12A2.4 2.4 0 1 1 6.5 9.5Z"
      />
    </Icon>
  )
}

export function CalmIcon() {
  return (
    <Icon>
      <path d="M3 10c1.5-3 4.5-4.5 7.5-3.5-2 1-2.5 3-1.5 4.5 1.5-1.5 3.5-1.5 5 0s3.5 1.5 5 0" />
      <path d="M3 14.5c1.5-1.5 3.5-1.5 5 0s3.5 1.5 5 0 3.5-1.5 5 0 2 1 3 .5" />
      <path d="M3 18.5c1.5-1.5 3.5-1.5 5 0s3.5 1.5 5 0 3.5-1.5 5 0 2 1 3 .5" />
    </Icon>
  )
}

export function WhistleIcon() {
  return (
    <Icon>
      <path d="M3 8.5h11a2.5 2.5 0 1 0-2.5-2.5" />
      <path d="M3 12h15a2.5 2.5 0 1 1-2.5 2.5" />
      <path d="M3 15.5h7" />
    </Icon>
  )
}

export function PowerIcon() {
  return (
    <Icon>
      <path d="M12 3v8" />
      <path d="M7 6a7.5 7.5 0 1 0 10 0" />
    </Icon>
  )
}

export function InfoIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v5.5M12 7.8v.2" />
    </Icon>
  )
}
