import { Inject, Injectable } from "@nestjs/common";
import { JwtService } from "@nestjs/jwt";
import { User } from "@tonightpass/shared-types";

@Injectable()
export class AuthService {
  constructor(
    @Inject("JwtAccessTokenService")
    private readonly accessTokenService: JwtService,
    @Inject("JwtRefreshTokenService")
    private readonly refreshTokenService: JwtService,
  ) {}

  async generateAccessToken(user: User): Promise<string> {
    return this.accessTokenService.sign(
      {
        user: user.id,
      },
      {
        subject: user.id,
      },
    );
  }

  async generateRefreshToken(user: User): Promise<string> {
    const identifier = user.identifier.email || user.identifier.phoneNumber;

    return this.refreshTokenService.sign(
      {
        user: identifier,
      },
      {
        subject: user.id,
      },
    );
  }
}
