import { ExecutionContext, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { AuthGuard as JwtAuthGuard } from "@nestjs/passport";
import { Observable } from "rxjs";

@Injectable()
export class AuthenticationGuard extends JwtAuthGuard("jwt") {
  constructor(private readonly reflector: Reflector) {
    super();
  }

  canActivate(
    context: ExecutionContext,
  ): boolean | Promise<boolean> | Observable<boolean> {
    const secured: boolean = this.reflector.get<boolean>(
      "secured",
      context.getHandler(),
    );

    if (!secured) return true;

    return super.canActivate(context);
  }
}
