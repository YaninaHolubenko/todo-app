import { useEffect, useState } from 'react';
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

  useEffect(() => {
    const onResize = () => setIsMenuOpen(false);
    const onKey = (e) => e.key === 'Escape' && setIsMenuOpen(false);
    window.addEventListener('resize', onResize);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener('resize', onResize);
      window.removeEventListener('keydown', onKey);
    };
  }, []);

  return (
    <>
      <header className="topbar" role="banner">
        <div className="topbar__left">
          <div className="topbar__chip" title={userEmail || ''}>
            <span className="topbar__hello">Welcome,</span>
            <strong className="topbar__email">{userEmail}</strong>
          </div>
        </div>

        <div className="topbar__right">
          {/* desktop */}
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

          {/* mobile burger on the right */}
          <button
            type="button"
            className={`topbar__burger ${isMenuOpen ? 'topbar__burger--open' : ''}`}
            aria-label={isMenuOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isMenuOpen}
            aria-controls="topbar-menu"
            aria-haspopup="menu"
            onClick={handleToggleMenu}
          >
            <span className="topbar__burger-bar" />
            <span className="topbar__burger-bar" />
            <span className="topbar__burger-bar" />
          </button>
        </div>
      </header>

      {/* full-width mobile dropdown mounted right under the topbar */}
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
    </>
  );
};

export default Topbar;
