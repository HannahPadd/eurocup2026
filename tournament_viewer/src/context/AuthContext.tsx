import { createContext, useCallback, useEffect, useState } from "react";
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

const isTokenExpired = (token?: string): boolean => {
    if (!token) return false;
    try {
        const [, payload] = token.split(".");
        if (!payload) return false;
        const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
        const padded = normalized.padEnd(
            normalized.length + ((4 - (normalized.length % 4)) % 4),
            "="
        );
        const parsed = JSON.parse(atob(padded)) as { exp?: number };
        if (typeof parsed.exp !== "number") return false;
        return Date.now() >= parsed.exp * 1000;
    } catch {
        return false;
    }
};

export const AuthProvider = ({ children }: { children?: React.ReactNode }) => {
    const [auth, setAuth] = useState<Auth | null>(() => {
        const stored = localStorage.getItem("auth");
        if (!stored) return null;
        try {
            const parsed = JSON.parse(stored) as Auth;
            if (parsed?.accessToken && isTokenExpired(parsed.accessToken)) {
                localStorage.removeItem("auth");
                return null;
            }
            return parsed;
        } catch {
            localStorage.removeItem("auth");
            return null;
        }
    });

    const navigate = useNavigate();

    const logout = useCallback(() => {
        setAuth(null);
        localStorage.removeItem("auth");
        navigate("/login", { replace: true });
    }, [navigate]);

    useEffect(() => {
        if (auth) {
            localStorage.setItem("auth", JSON.stringify(auth));
        } else {
            localStorage.removeItem("auth");
        }

        registerAuthTokenGetter(() => auth?.accessToken ?? null);

        registerLogoutHandler(logout);
    }, [auth, logout]);

    useEffect(() => {
        if (!auth?.accessToken) return;

        const checkToken = () => {
            if (isTokenExpired(auth.accessToken)) {
                logout();
            }
        };

        checkToken();
        const intervalId = window.setInterval(checkToken, 60_000);

        return () => {
            window.clearInterval(intervalId);
        };
    }, [auth?.accessToken, logout]);

    return (
        <AuthContext.Provider value={{ auth, setAuth, logout }}>
            {children}
        </AuthContext.Provider>
    );
};

export default AuthContext;
