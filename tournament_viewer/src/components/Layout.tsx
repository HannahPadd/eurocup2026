import { Outlet } from "react-router-dom";
import Navbar from "./layout/Navbar";

const Layout = () => {
  return (
    <main className="App">
      <Navbar />
      <div className="pt-6 pb-12 lg:container lg:mx-auto mx-3">
        <Outlet />
      </div>
    </main>
  );
};

export default Layout;
