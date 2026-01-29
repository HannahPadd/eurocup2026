import { 
    CanActivate, 
    ExecutionContext, 
    Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";

import { Roles } from "@auth/decorators";

import { Observable } from "rxjs";


@Injectable()
export class RolesGuard implements CanActivate {
    constructor(private reflector: Reflector) {}

    canActivate(context: ExecutionContext): boolean {
        const roles = this.reflector.get(Roles, context.getHandler());
        console.log(roles);
        if (!roles) {
            return true;
        }
    
        const request = context.switchToHttp().getRequest();
        const user = request.user;
        console.log(user.roles);
        return this.matchRoles(roles, user.roles);
    }

    //TODO: add actual role checking.
    matchRoles = (roles, userRoles) => {
        return true;
    }
}