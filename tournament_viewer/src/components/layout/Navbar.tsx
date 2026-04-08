import { NavLink } from "react-router-dom";
import { useState } from "react";
import useAuth from "../../hooks/useAuth";

export default function Navbar() {
  const { auth, setAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);
  const navLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md transition ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white hover:text-gray-200"
    }`;
  const mobileNavLinkClass = ({ isActive }: { isActive: boolean }) =>
    `px-3 py-2 rounded-md transition ${
      isActive
        ? "bg-white/15 text-white"
        : "text-white hover:text-gray-200"
    }`;

  const handleLogout = () => {
    setAuth(null);
  };
  return (
    <nav className="w-full h-16 navbar-bg relative z-50">
      <div className="lg:container lg:mx-auto mx-3 flex flex-row gap-6 items-center h-full">
        <NavLink to="/login" className="hidden lg:inline" aria-label="Go to login">
          <img src="/icon.png" alt="logo" className="h-12 w-12 rounded-lg" />
        </NavLink>
        <h2 className="text-white font-bold text-xl">
          Eurocup 2026 Standings
        </h2>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            {auth?.isAdmin ? (
              <NavLink
                to="/tournament"
                className={navLinkClass}
              >
                Tournament
              </NavLink>
            ) : null}
            <NavLink
              to="/faq"
              className={navLinkClass}
            >
              FAQ
            </NavLink>
            {auth?.username ? (
              <NavLink
                to="/"
                end
                className={navLinkClass}
              >
                Profile
              </NavLink>
            ) : null}
            {auth?.isAdmin ? (
              <NavLink
                to="/manage"
                className={navLinkClass}
              >
                Manage
              </NavLink>
            ) : null}
            {auth?.username ? (
              <a
                href="http://itgeurocup.com"
                className="text-white hover:text-gray-200 px-3 py-2"
              >
                Official site
              </a>
            ) : null}
            {auth?.username ? (
              <button type="button" onClick={handleLogout} className="px-3 py-2">
                Logout
              </button>
            ) : (
              <NavLink to="/login" className={navLinkClass}>
                Login
              </NavLink>
            )}
          </div>
          <button
            type="button"
            className="md:hidden text-white"
            aria-label="Toggle menu"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
          >
            <svg
              width="24"
              height="24"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              {menuOpen ? (
                <>
                  <line x1="18" y1="6" x2="6" y2="18" />
                  <line x1="6" y1="6" x2="18" y2="18" />
                </>
              ) : (
                <>
                  <line x1="3" y1="6" x2="21" y2="6" />
                  <line x1="3" y1="12" x2="21" y2="12" />
                  <line x1="3" y1="18" x2="21" y2="18" />
                </>
              )}
            </svg>
          </button>
        </div>
      </div>
      {menuOpen ? (
        <div className="md:hidden absolute left-0 right-0 top-full border-t border-white/10 bg-black/90">
          <div className="mx-3 py-3 flex flex-col gap-2">
            <NavLink
              to="/tournament"
              className={mobileNavLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              Tournament
            </NavLink>
            <NavLink
              to="/faq"
              className={mobileNavLinkClass}
              onClick={() => setMenuOpen(false)}
            >
              FAQ
            </NavLink>
            {auth?.username ? (
              <NavLink
                to="/"
                end
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Profile
              </NavLink>
            ) : null}
            {auth?.isAdmin ? (
              <NavLink
                to="/manage"
                className={mobileNavLinkClass}
                onClick={() => setMenuOpen(false)}
              >
                Manage
              </NavLink>
            ) : null}
            {auth?.username ? (
              <a
                href="http://itgeurocup.com"
                className="text-white hover:text-gray-200 px-3 py-2 rounded-md"
                onClick={() => setMenuOpen(false)}
              >
                Official site
              </a>
            ) : null}
            {auth?.username ? (
              <button
                type="button"
                onClick={() => {
                  handleLogout();
                  setMenuOpen(false);
                }}
                className="text-left px-3 py-2 rounded-md"
              >
                Logout
              </button>
            ) : (
              <NavLink
                to="/login"
                onClick={() => setMenuOpen(false)}
                className={mobileNavLinkClass}
              >
                Login
              </NavLink>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
