import { useState } from 'react';
import Button from './ui/Button';
import './Topbar.css';

const Topbar = ({ userEmail, view, onToggle, onSignOut }) => {
  const isProfile = view === 'profile';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const handleToggleMenu = () => setIsMenuOpen((v) => !v);
  const handleNavToggle = () => {
    onToggle?.();
    setIsMenuOpen(false);
  };
  const handleSignOut = () => {
    onSignOut?.();
    setIsMenuOpen(false);
  };

  return (
    <header className="topbar" role="banner">
      <div className="topbar__left">
        <div className="topbar__chip" title={userEmail || ''}>
          Welcome back <strong className="topbar__email">{userEmail}</strong>
        </div>
      </div>

      <div className="topbar__right">
        {/* Desktop actions */}
        <div className="topbar__actions">
          <Button
            type="button"
            className="topbar__btn topbar__toggle"
            variant="ghost"
            onClick={handleNavToggle}
            aria-pressed={isProfile}
            title={isProfile ? 'Go to tasks' : 'Open profile'}
          >
            {isProfile ? 'Tasks' : 'Profile'}
          </Button>

          <Button
            type="button"
            className="topbar__btn topbar__signout"
            variant="danger"
            onClick={handleSignOut}
          >
            SIGN OUT
          </Button>
        </div>

        {/* Burger on the right (mobile) */}
        <button
          className="topbar__burger"
          aria-label="Open menu"
          aria-expanded={isMenuOpen}
          aria-controls="topbar-menu"
          aria-haspopup="menu"
          onClick={handleToggleMenu}
          type="button"
        >
          <span className="topbar__burger-bar" />
          <span className="topbar__burger-bar" />
          <span className="topbar__burger-bar" />
        </button>
      </div>

      {/* Mobile dropdown menu (aligns to right) */}
      <nav
        id="topbar-menu"
        className={`topbar__menu ${isMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <ul className="topbar__menu-list" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="topbar__menu-item"
              onClick={handleNavToggle}
              // убрали aria-pressed, чтобы не было предупреждения
              data-active={isProfile || undefined}
            >
              {isProfile ? 'Tasks' : 'Profile'}
            </button>
          </li>
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="topbar__menu-item topbar__menu-signout"
              onClick={handleSignOut}
            >
              Sign out
            </button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Topbar;
