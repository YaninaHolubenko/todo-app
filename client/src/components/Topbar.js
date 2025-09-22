import Button from './ui/Button'
import './Topbar.css'

const Topbar = ({ userEmail, view, onToggle, onSignOut }) => {
  const isProfile = view === 'profile'

  return (
    <header className="topbar" role="banner">
      <div className="topbar__chip" title={userEmail || ''}>
        Welcome back <strong className="topbar__email">{userEmail}</strong>
      </div>

      <div className="topbar__actions">
        <Button
          type="button"
          className="topbar__btn topbar__toggle"
          variant="ghost"
          onClick={onToggle}
          aria-pressed={isProfile}
          title={isProfile ? 'Go to tasks' : 'Open profile'}
        >
          {isProfile ? 'Tasks' : 'Profile'}
        </Button>

        <Button
          type="button"
          className="topbar__btn topbar__signout"
          variant="danger"
          onClick={onSignOut}
        >
          SIGN OUT
        </Button>
      </div>
    </header>
  )
}

export default Topbar
