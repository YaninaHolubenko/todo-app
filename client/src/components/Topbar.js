import { useEffect, useState } from 'react';
import Button from './ui/Button';
import './Topbar.css';

const Topbar = ({ userEmail, view, onToggle, onSignOut }) => {
  const isProfile = view === 'profile';
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  const openMenu = () => setIsMenuOpen(true);
  const closeMenu = () => setIsMenuOpen(false);
  const toggleMenu = () => setIsMenuOpen(v => !v);

  const handleNavToggle = () => {
    onToggle?.();
    closeMenu();
  };

  const handleSignOut = () => {
    onSignOut?.();
    closeMenu();
  };

  // Close on ESC
  useEffect(() => {
    if (!isMenuOpen) return;
    const onKey = (e) => e.key === 'Escape' && closeMenu();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isMenuOpen]);

  return (
    <header className="topbar" role="banner">
      <div className="topbar__left">
        <div className="topbar__chip" title={userEmail || ''}>
          <span className="topbar__hello">Welcome,</span>
          <strong className="topbar__email">{userEmail}</strong>
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

        {/* Burger (right) */}
        <button
          type="button"
          className={`topbar__burger ${isMenuOpen ? 'topbar__burger--open' : ''}`}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
          aria-expanded={isMenuOpen}
          aria-controls="topbar-menu"
          aria-haspopup="menu"
          onClick={toggleMenu}
        >
          <span className="topbar__burger-bar" />
          <span className="topbar__burger-bar" />
          <span className="topbar__burger-bar" />
        </button>
      </div>

      {/* Overlay (click to close) */}
      {isMenuOpen && <div className="topbar__overlay" onClick={closeMenu} />}

      {/* Right-aligned popover */}
      <nav
        id="topbar-menu"
        className={`topbar__menu ${isMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!isMenuOpen}
      >
        <ul className="topbar__menu-list" role="menu">
          <li role="none">
            <Button
              role="menuitem"
              type="button"
              variant="ghost"
              className="topbar__menu-btn"
              onClick={handleNavToggle}
              title={isProfile ? 'Go to tasks' : 'Open profile'}
            >
              {isProfile ? 'Tasks' : 'Profile'}
            </Button>
          </li>
          <li role="none">
            <Button
              role="menuitem"
              type="button"
              variant="danger"
              className="topbar__menu-btn topbar__menu-signout"
              onClick={handleSignOut}
              title="Sign out"
            >
              Sign out
            </Button>
          </li>
        </ul>
      </nav>
    </header>
  );
};

export default Topbar;
