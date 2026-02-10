import { Outlet } from "react-router-dom";
import { useEffect, useState } from "react";
import Navbar from './layout/Navbar';

import TagTeamCss from "../themes/TagTeam.css?url";
import EurocupCss from "../themes/Eurocup.css?url";


const themeFiles: Record<string, string> = {
  TagTeam: TagTeamCss,
  Eurocup: EurocupCss,
};

const Layout= () => {

    // Add new theme CSS
    const [theme, setTheme] = useState("Eurocup");

  useEffect(() => {
    // Remove previous theme CSS
    const prev = document.getElementById("theme-css") as HTMLLinkElement;
    if (prev) prev.remove();
    // Add new theme CSS
    const link = document.createElement("link");
    link.id = "theme-css";
    link.rel = "stylesheet";
    link.href = themeFiles[theme] || themeFiles["Eurocup"];
    document.head.appendChild(link);
    return () => {
      link.remove();
    };
  }, [theme]);


    return (
        <main className="App">
            <Navbar theme={theme} setTheme={setTheme}/>
            <div className="pt-6">
                <Outlet />
            </div>
        </main>
    )
}

export default Layout;
