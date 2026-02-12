import { createContext, useEffect, useState } from "react";

export interface Auth {
    username: string,
    accessToken: string,
    isAdmin: boolean
}

interface AuthContextProps {
    auth: Auth | null;
    setAuth: React.Dispatch<React.SetStateAction<Auth | null>>;
}


const AuthContext = createContext<AuthContextProps>({
    auth: null,
    setAuth: () => null,
});

export const AuthProvider = ({ children }: { children?: React.ReactNode}) => {
    const [auth, setAuth] = useState<Auth | null>(() => {
        const stored = localStorage.getItem("auth");
        return stored ? (JSON.parse(stored) as Auth) : null;
    });

    useEffect(() => {
        if (auth) {
            localStorage.setItem("auth", JSON.stringify(auth));
        } else {
            localStorage.removeItem("auth");
        }
    }, [auth]);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;
