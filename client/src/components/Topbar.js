// client/src/components/Topbar.js
import './Topbar.css'

const Topbar = ({ userEmail, view, onToggle, onSignOut }) => {
  const isProfile = view === 'profile'

  return (
    <header className="topbar">
      <div className="topbar__chip">
        Welcome back <strong>{userEmail}</strong>
      </div>

      <div className="topbar__actions">
        <button
          type="button"
          className="topbar__btn topbar__toggle"
          onClick={onToggle}
          aria-pressed={isProfile}
          title={isProfile ? 'Go to tasks' : 'Open profile'}
        >
          {isProfile ? 'Tasks' : 'Profile'}
        </button>

        <button
          type="button"
          className="topbar__btn topbar__signout"
          onClick={onSignOut}
        >
          SIGN OUT
        </button>
      </div>
    </header>
  )
}

export default Topbar
