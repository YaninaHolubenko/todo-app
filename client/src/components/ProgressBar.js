// client/src/components/ProgressBar.js
import './ProgressBar.css'

const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0))

const ProgressBar = ({ progress }) => {
  const pct = clamp(progress)

  let colorClass = 'low'
  if (pct > 66) colorClass = 'high'
  else if (pct > 33) colorClass = 'medium'

  return (
    <div className="outer-bar">
      <div
        className={`inner-bar ${colorClass}`}
        style={{ width: `${pct}%` }}
      />
    </div>
  )
}

export default ProgressBar
