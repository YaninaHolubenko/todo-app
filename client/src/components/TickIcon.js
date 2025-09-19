// client/src/components/TickIcon.js
const TickIcon = ({ active = false, onClick }) => {
  const color = active ? 'rgb(141, 181, 145)' : '#888'
  const style = { cursor: onClick ? 'pointer' : 'default', color }

  return (
    <svg
      className={`tick${active ? ' tick--active' : ''}`}
      xmlns="http://www.w3.org/2000/svg"
      width="25"
      height="25"
      viewBox="0 0 512 512"
      onClick={onClick}
      style={style}
    >
      <title>status</title>
      <path
        d="M448,256c0-106-86-192-192-192S64,150,64,256s86,192,192,192S448,362,448,256Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="32"
      />
      <polyline
        points="352 176 217.6 336 160 272"
        fill="none"
        stroke="currentColor"
        strokeWidth="32"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}

export default TickIcon
