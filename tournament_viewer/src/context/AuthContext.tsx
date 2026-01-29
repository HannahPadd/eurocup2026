import { createContext, useState } from "react";

export interface Auth {
    username: string,
    accessToken: string
    roles: []
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
    const [auth, setAuth] = useState<Auth | null>(null);

    return (
        <AuthContext.Provider value={{ auth, setAuth }}>
            {children}
        </AuthContext.Provider>
    )
}

export default AuthContext;

