import {
  BadRequestException,
  Body,
  Controller,
  Post,
  Res,
} from "@nestjs/common";
import {
  CreateUserDto,
  SignInUserDto,
  User,
  APIResponse,
  UserIdentifier,
} from "@tonightpass/shared-types";
import { FastifyReply } from "fastify";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Logged } from "src/common/decorators/logged.decorator";
import { UserService } from "src/users/user.service";

import { AuthService } from "./auth.service";
import { TokenService } from "./token.service";

@Controller("auth")
export class AuthController {
  constructor(
    private readonly userService: UserService,
    private readonly authService: AuthService,
    private readonly tokenService: TokenService,
  ) {}

  @Post("sign-up")
  async signUp(
    @Res() res: FastifyReply,
    @Body() data: CreateUserDto,
  ): Promise<APIResponse<User>> {
    const userExists = await this.userService.exists({
      identifier: data.identifier,
    });
    if (userExists) {
      throw new Error("User with theses identifiers already exists.");
    }

    const user: User = await this.userService.create(data);
    const accessToken: string = await this.authService.generateAccessToken(
      user,
    );
    this.tokenService.setAccessToken(user, accessToken);

    res.setCookie("access-token", accessToken, {
      httpOnly: true,
      maxAge: 1.8e6,
    });
    res.setCookie(
      "refresh-token",
      await this.authService.generateRefreshToken(user),
      {
        httpOnly: true,
        maxAge: 1.728e8,
      },
    );

    return {
      success: true,
      data: user,
    };
  }

  @Post("sign-in")
  async signIn(
    @Res() res: FastifyReply,
    @Body() data: SignInUserDto,
  ): Promise<APIResponse<User>> {
    const userIdentifier: UserIdentifier = await this.userService.identify(
      data.identifier,
    );
    if (!userIdentifier) {
      throw new BadRequestException("User is not registered.");
    }

    const user: User = await this.userService.findOne({
      identifier: userIdentifier,
    });

    const isPasswordValid: boolean =
      await this.userService.compareEncryptedPassword(user.id, data.password);
    if (!isPasswordValid) {
      throw new BadRequestException("Password is incorrect");
    }

    const accessToken: string = await this.authService.generateAccessToken(
      user,
    );
    this.tokenService.setAccessToken(user, accessToken);

    res.setCookie("access-token", accessToken, {
      httpOnly: true,
      maxAge: 1.8e6,
    });
    res.setCookie(
      "refresh-token",
      await this.authService.generateRefreshToken(user),
      {
        httpOnly: true,
        maxAge: 1.728e8,
      },
    );

    return {
      success: true,
      data: user,
    };
  }

  @Post("sign-out")
  @Logged()
  async signOut(@Res() res: FastifyReply): Promise<APIResponse> {
    res.clearCookie("access-token");
    res.clearCookie("refresh-token");

    return {
      success: true,
      data: null,
    };
  }

  @Post("refresh-token")
  @Logged()
  async refreshToken(
    @Res() res: FastifyReply,
    @CurrentUser() user: User,
  ): Promise<APIResponse> {
    res.setCookie(
      "access-token",
      await this.authService.generateAccessToken(user),
      {
        httpOnly: true,
        maxAge: 1.8e6,
      },
    );
    res.setCookie(
      "refresh-token",
      await this.authService.generateRefreshToken(user),
      {
        httpOnly: true,
        maxAge: 1.728e8,
      },
    );

    return {
      success: true,
      data: null,
    };
  }
}
