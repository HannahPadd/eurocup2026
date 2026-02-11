import { Route, Routes } from "react-router-dom";

import RequireAuth from "./components/RequireAuth";

import "./index.css";
import "./themes/Eurocup.css";
import ViewPage from "./pages/ViewPage";
import ManagePage from "./pages/ManagePage";
import SignUpPage from "./pages/SignUpPage";
import Unauthorized from "./pages/Unauthorized";
import "react-toastify/dist/ReactToastify.css";
import LoginPage from "./pages/LoginPage";
import Layout from "./components/Layout";
import Missing from "./pages/Missing";

function App() {

  return (
    <>
      <Routes>
        <Route path="*" element={<ViewPage />} />

        {/* Public Routes */}
        <Route path="/" element={<Layout />}>
        <Route path="view" element={<ViewPage />} />
        <Route path="signup" element={<SignUpPage />} />
        <Route path="login" element={<LoginPage />} />
        <Route path="unauthorized" element={<Unauthorized />} />

        { /* Protected routes */ }
        { /* Admin routes */ }
        <Route element={<RequireAuth /*allowedRoles={["admin"]} *//>}>
          <Route path="/" element={<ViewPage />} />
          <Route path="manage" element={<ManagePage />} />
        </Route>

        {/* Catch all */}
        <Route path="*" element={<Missing />} />
        </Route>
      </Routes>
      { /*
        <div>
          <Navbar theme={theme} setTheme={setTheme} />
          <ToastContainer />
          <div className="lg:container lg:mx-auto mx-3 mt-3">
            <Routes>
              <Route path="/" element={<ViewPage />} />
              <Route path="/view" element={<ViewPage />} />
              <Route path="/manage" element={<ManagePage />} />
              <Route path="/signup" element={<SignUpPage />} />
              <Route path="/signin" element={<SignInPage />} />
              <Route path="*" element={<ViewPage />}></Route>
            </Routes>
          </div>
        </div>
        */ }
    </>
  );
}

export default App;
