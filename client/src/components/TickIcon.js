// client/src/components/TickIcon.js
const TickIcon = ({ active = false, onClick, size = 30 }) => {
  const color = active ? 'var(--primary-600)' : '#888'
  const style = { cursor: onClick ? 'pointer' : 'default', color }

  return (
    <svg
      className={`tick${active ? ' tick--active' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      width={size}
      height={size}
      viewBox="0 0 512 512"
      onClick={onClick}
      style={style}
    >
      <title>status</title>
      <circle
        cx="256"
        cy="256"
        r="192"
        fill="none"
        stroke="currentColor"
        strokeWidth="20"
      />
      {active && (
        <polyline
          points="352 176 217.6 336 160 272"
          fill="none"
          stroke="currentColor"
          strokeWidth="40"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      )}
    </svg>
  )
}

export default TickIcon
