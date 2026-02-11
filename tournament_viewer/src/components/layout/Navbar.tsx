import { Link } from "react-router-dom";
import useAuth from "../../hooks/useAuth";

export default function Navbar() {
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
        <div className="ml-auto">
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
