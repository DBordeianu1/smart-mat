// Card with a labelled range slider, used on the Settings screens
function SliderCard({ label, display, hint, value, min = 0, max = 100, step = 1, onChange }) {
  const fill = ((value - min) / (max - min)) * 100

  return (
    <div className="card slider-card">
      <div className="card-row">
        <h2>{label}</h2>
        <span className="card-value">{display}</span>
      </div>

      <input
        type="range"
        className="slider"
        min={min}
        max={max}
        step={step}
        value={value}
        aria-label={label}
        style={{ '--fill': `${fill}%` }}
        onChange={event => onChange(Number(event.target.value))}
      />

      <p className="card-note">{hint}</p>
    </div>
  )
}

export default SliderCard
