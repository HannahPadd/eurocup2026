import { Link } from "react-router-dom";
import { useState } from "react";
import useAuth from "../../hooks/useAuth";

export default function Navbar() {
  const { auth, setAuth } = useAuth();
  const [menuOpen, setMenuOpen] = useState(false);

  const handleLogout = () => {
    setAuth(null);
  };
  return (
    <nav className="w-full h-16 navbar-bg relative z-50">
      <div className="lg:container lg:mx-auto mx-3 flex flex-row gap-6 items-center h-full">
        <span className="hidden lg:inline">
          <img src="/icon.png" alt="logo" className="h-12 w-12 rounded-lg" />
        </span>
        <h2 className="text-white font-bold text-xl">
          Eurocup 2026 Standings
        </h2>
        <div className="ml-auto flex items-center gap-4">
          <div className="hidden md:flex items-center gap-4">
            <Link
              to="/tournament"
              className="text-white hover:text-gray-200 px-3 py-2"
            >
              Tournament
            </Link>
            <Link to="/" className="text-white hover:text-gray-200 px-3 py-2">
              Overview
            </Link>
            {auth?.username ? (
              <button type="button" onClick={handleLogout} className="px-3 py-2">
                Logout
              </button>
            ) : (
              <Link to="/login" className="px-3 py-2">
                Login
              </Link>
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
            <Link
              to="/tournament"
              className="text-white hover:text-gray-200 px-3 py-2 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              Tournament
            </Link>
            <Link
              to="/"
              className="text-white hover:text-gray-200 px-3 py-2 rounded-md"
              onClick={() => setMenuOpen(false)}
            >
              Overview
            </Link>
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
              <Link
                to="/login"
                onClick={() => setMenuOpen(false)}
                className="px-3 py-2 rounded-md"
              >
                Login
              </Link>
            )}
          </div>
        </div>
      ) : null}
    </nav>
  );
}
