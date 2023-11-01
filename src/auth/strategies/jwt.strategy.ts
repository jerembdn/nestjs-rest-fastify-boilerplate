import { Injectable, Logger } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { PassportStrategy } from "@nestjs/passport";
import { User } from "@tonightpass/shared-types";
import { Strategy, ExtractJwt } from "passport-jwt";
import { UserService } from "src/users/user.service";

type JwtToken = {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  [key: string]: any;
};

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, "jwt") {
  private readonly logger = new Logger(JwtStrategy.name);

  constructor(
    private readonly userService: UserService,
    private readonly configService: ConfigService,
  ) {
    super({
      secretOrKey: configService.get<string>("JWT_ACCESSTOKEN_SECRET"),
      issuer: configService.get<string>("JWT_ISSUER"),
      audience: configService.get<string>("JWT_AUDIENCE"),
      jwtFromRequest: ExtractJwt.fromAuthHeaderWithScheme(
        configService.get<string>("JWT_AUTH_SCHEMA"),
      ),
    });
  }

  async validate(payload: JwtToken): Promise<User> {
    return await this.userService.findById(payload.sub);
  }
}
