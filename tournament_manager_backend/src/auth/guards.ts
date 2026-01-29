import { LocalAuthGuard } from "./guards/local-auth.guard";
import { RolesGuard } from "./guards/roles.guard";
import { JwtAuthGuard } from "./guards/jwt-auth.guard";

export { LocalAuthGuard };
export { RolesGuard };
export { JwtAuthGuard };

export const Guards = [
    LocalAuthGuard,
    RolesGuard,
    JwtAuthGuard
]