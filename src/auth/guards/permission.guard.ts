import {
  BadRequestException,
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { UserRole } from "@tonightpass/shared-types";

@Injectable()
export class PermissionGuard implements CanActivate {
  constructor(private readonly reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const roles: UserRole[] = this.reflector.get<UserRole[]>(
      "roles",
      context.getHandler(),
    );

    if (!roles || roles.length === 0) return true;

    const { user } = context.switchToHttp().getRequest();
    if (!user) throw new BadRequestException("Invalid request context");

    const hasAccess = (): boolean => {
      return roles.includes(user.role);
    };

    if (!hasAccess()) throw new UnauthorizedException("Restricted access");

    return true;
  }
}
