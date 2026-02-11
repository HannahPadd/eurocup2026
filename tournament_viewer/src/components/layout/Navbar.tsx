import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

interface NavbarProps {
  theme: string;
  setTheme: (theme: string) => void;
}

export default function Navbar({ theme, setTheme }: NavbarProps) {
  const { auth, setAuth } = useAuth();

  const handleLogout = () => {
    setAuth(null);
  };
  return (
    <nav className="w-full h-16 navbar-bg">
      <div className="lg:container lg:mx-auto mx-3 flex flex-row gap-10 items-center h-full">
        <span className="hidden lg:inline">
          <img src="/icon.png" alt="logo" className="h-12 w-12 rounded-lg" />
        </span>
        <h2 className="text-white font-bold text-xl">
          Eurocup 2026 Standings
        </h2>
        <div className="ml-auto flex items-center">
          <select
            id="theme-select"
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            className="bg-gray-800 text-white px-2 py-1 rounded"
          >
            <option value="TagTeam">TagTeam</option>
            <option value="Eurocup">Eurocup</option>
          </select>
        </div>
        <div>
          {auth?.username ? (
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          ) : (
            <Link to="/login">Login</Link>
          )}
        </div>
      </div>
    </nav>
  );
}
