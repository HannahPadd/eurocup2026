import ReactDOM from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import axios from "axios";
import { AuthProvider } from "./context/AuthContext.tsx";
import "./api/authHelper.ts";
import { registerSW } from "virtual:pwa-register";


axios.defaults.baseURL = import.meta.env.VITE_API_BASE_URL;
axios.defaults.withCredentials = true;

ReactDOM.createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <AuthProvider>
      <Routes>
        <Route path="/*" element={<App />}></Route>
      </Routes>
    </AuthProvider>
  </BrowserRouter>,
);

registerSW({
  immediate: true,
  onRegisteredSW(_swScriptUrl, registration) {
    void registration?.update();
  },
});
