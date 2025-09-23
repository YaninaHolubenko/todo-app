import { useEffect, useRef, useState } from 'react';
import Button from './ui/Button';
import './Topbar.css';

const Topbar = ({ userEmail, view, onToggle, onSignOut }) => {
  const isProfile = view === 'profile';
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef(null);

  const handleToggleMenu = () => setIsMenuOpen(v => !v);

  const handleNavToggle = () => {
    onToggle?.();
    setIsMenuOpen(false);
  };

  const handleSignOut = () => {
    onSignOut?.();
    setIsMenuOpen(false);
  };

  // When menu opens, push content down by the menu height
  useEffect(() => {
    const root = document.documentElement;
    const body = document.body;

    if (isMenuOpen) {
      // measure menu height
      const h = (menuRef.current?.offsetHeight || 0) + 8; // small gap
      root.style.setProperty('--topbar-menu-push', `${h}px`);
      body.classList.add('topbar-menu-open');
    } else {
      root.style.setProperty('--topbar-menu-push', '0px');
      body.classList.remove('topbar-menu-open');
    }

    return () => {
      root.style.setProperty('--topbar-menu-push', '0px');
      body.classList.remove('topbar-menu-open');
    };
  }, [isMenuOpen]);

  return (
    <header className="topbar" role="banner">
      <div className="topbar__left">
        <div className="topbar__chip" title={userEmail || ''}>
          <span className="topbar__welcome">Welcome,&nbsp;</span>
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

        {/* Burger / Close on mobile (right) */}
        <button
          className={`topbar__burger ${isMenuOpen ? 'is-open' : ''}`}
          aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
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

      {/* Mobile dropdown menu (right aligned) */}
      <nav
        id="topbar-menu"
        className={`topbar__menu ${isMenuOpen ? 'is-open' : ''}`}
        aria-hidden={!isMenuOpen}
        ref={menuRef}
      >
        <ul className="topbar__menu-list" role="menu">
          <li role="none">
            <button
              type="button"
              role="menuitem"
              className="topbar__menu-item"
              onClick={handleNavToggle}
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
