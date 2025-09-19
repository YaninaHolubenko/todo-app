// client/src/components/ProgressBar.js
const clamp = (n) => Math.max(0, Math.min(100, Number(n) || 0))

const getColor = (p) => {
  if (p <= 33) return 'rgb(255, 175, 163)'   
  if (p <= 66) return 'rgb(255, 214, 161)'   
  return 'rgb(182, 223, 186)'                
}

const ProgressBar = ({ progress }) => {
  const pct = clamp(progress)
  return (
    <div className="outer-bar">
      <div
        className="inner-bar"
        style={{ width: `${pct}%`, backgroundColor: getColor(pct) }}
      />
    </div>
  )
}

export default ProgressBar
