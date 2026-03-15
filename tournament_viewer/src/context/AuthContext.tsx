import { createContext, useEffect, useState } from "react";
import { registerAuthTokenGetter, registerLogoutHandler } from "../api/authHelper";
import { useNavigate } from "react-router-dom";

export interface Auth {
    username: string;
    accessToken: string;
    isAdmin: boolean;
}

interface AuthContextProps {
    auth: Auth | null;
    setAuth: React.Dispatch<React.SetStateAction<Auth | null>>;
    logout: () => void;
}

const AuthContext = createContext<AuthContextProps>({
    auth: null,
    setAuth: () => null,
    logout: () => {},
});

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
    const [auth, setAuth] = useState<Auth | null>(() => {
        const stored = localStorage.getItem("auth");
        return stored ? (JSON.parse(stored) as Auth) : null;
    });

    const navigate = useNavigate();

    const logout = () => {
        setAuth(null);
        localStorage.removeItem("auth");
        navigate("/login");

    };

    useEffect(() => {
        if (auth) {
            localStorage.setItem("auth", JSON.stringify(auth));
        } else {
            localStorage.removeItem("auth");
        }

        registerAuthTokenGetter(() => auth?.accessToken ?? null);

        registerLogoutHandler(logout);
    }, [auth]);

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;