import { Navigate, useLocation } from "react-router-dom";
import Login from "../components/LoginComponent";
import useAuth from "../hooks/useAuth";



export default function LoginPage() {
    const { auth } = useAuth();
    const location = useLocation();
    const alertMessage =
        typeof location.state?.alert === "string" ? location.state.alert : null;

    if (auth?.accessToken) {
        return <Navigate to="/" replace />;
    }

    return (
        <div className=" flex items-center justify-center px-4">
            <div className="w-full max-w-sm">
                {alertMessage && (
                    <div className="mb-4 rounded-md border border-emerald-400/40 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-100">
                        {alertMessage}
                    </div>
                )}
                <Login />
            </div>
        </div>
    )
}
