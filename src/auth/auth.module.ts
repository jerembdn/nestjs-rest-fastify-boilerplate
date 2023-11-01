import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { JwtService } from "@nestjs/jwt";
import { MongooseModule } from "@nestjs/mongoose";
import { PassportModule } from "@nestjs/passport";
import MongoDBConnection from "src/common/constants/mongoDbConnections";
import { MongoDBConfigService } from "src/config/database/mongodb.config";
import { NotificationModule } from "src/notifications/notification.module";
import { NotificationService } from "src/notifications/notification.service";
import { UserSchema } from "src/users/schemas/user.schema";
import { UserService } from "src/users/user.service";
import { PasswordUtils } from "src/utils/password.utils";

import { AuthController } from "./auth.controller";
import { AuthService } from "./auth.service";
import { AuthenticationGuard } from "./guards/authentication.guard";
import { PermissionGuard } from "./guards/permission.guard";
import { TokenSchema } from "./schemas/token.schema";
import { JwtRefreshStrategy } from "./strategies/jwt-refresh.strategy";
import { JwtStrategy } from "./strategies/jwt.strategy";
import { TokenService } from "./token.service";

@Module({
  imports: [
    PassportModule.register({ defaultStrategy: "jwt" }),
    MongooseModule.forRootAsync({
      useClass: MongoDBConfigService,
      inject: [ConfigService],
      connectionName: MongoDBConnection.AUTHENTICATION,
    }),
    MongooseModule.forFeature([
      {
        name: "User",
        schema: UserSchema,
        collection: "users",
      },
    ]),
    MongooseModule.forFeature([
      {
        name: "Token",
        schema: TokenSchema,
        collection: "tokens",
      },
    ]),
    NotificationModule,
  ],
  controllers: [AuthController],
  providers: [
    NotificationService,
    UserService,
    PasswordUtils,
    JwtStrategy,
    JwtRefreshStrategy,
    {
      provide: "JwtAccessTokenService",
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtService => {
        return new JwtService({
          secret: configService.get<string>("JWT_ACCESSTOKEN_SECRET"),
          signOptions: {
            audience: configService.get<string>("JWT_AUDIENCE"),
            issuer: configService.get<string>("JWT_ISSUER"),
            expiresIn: configService.get<string>("JWT_ACCESSTOKEN_EXPIRESIN"),
          },
        });
      },
    },
    {
      provide: "JwtRefreshTokenService",
      inject: [ConfigService],
      useFactory: (configService: ConfigService): JwtService => {
        return new JwtService({
          secret: configService.get<string>("JWT_REFRESHTOKEN_SECRET"),
          signOptions: {
            audience: configService.get<string>("JWT_AUDIENCE"),
            issuer: configService.get<string>("JWT_ISSUER"),
            expiresIn: configService.get<string>("JWT_REFRESHTOKEN_EXPIRESIN"),
          },
        });
      },
    },
    AuthService,
    TokenService,
    {
      provide: APP_GUARD,
      useClass: AuthenticationGuard,
    },
    {
      provide: APP_GUARD,
      useClass: PermissionGuard,
    },
  ],
})
export class AuthModule {}
