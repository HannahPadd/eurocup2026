import { useLocation, Navigate, Outlet } from "react-router-dom";
import useAuth from "../hooks/useAuth";

const RequireAuth = ({
    requireAdmin = true
    }: {requireAdmin: boolean}) => {
        
    const { auth } = useAuth();
    const location = useLocation();

    if (requireAdmin) {
        return (
        auth?.isAdmin
        ? <Outlet />
        : auth?.username 
            ? <Navigate to="/unauthorized" state={{ from: location}} replace />
            : <Navigate to="/login" state={{ from: location}} replace />
        )
    }

    return (
         auth?.username 
            ? <Outlet />
            : <Navigate to="/login" state={{ from: location}} replace />
    )
}



export default RequireAuth;