import { Outlet } from "react-router-dom";
import Navbar from "./layout/Navbar";

const Layout = () => {
  return (
    <main className="App">
      <Navbar />
      <div className="pt-6">
        <Outlet />
      </div>
    </main>
  );
};

export default Layout;
