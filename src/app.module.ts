import { Module } from "@nestjs/common";
import { ConfigModule, ConfigService } from "@nestjs/config";
import { APP_GUARD } from "@nestjs/core";
import { MongooseModule } from "@nestjs/mongoose";
import { ThrottlerModule } from "@nestjs/throttler";

import { AuthModule } from "./auth/auth.module";
import { GqlThrottlerGuard } from "./common/guards/gql-throttler.guard";
import { MongoDBConfigService } from "./config/database/mongodb.config";
import { NotificationModule } from "./notifications/notification.module";
import { UserModule } from "./users/user.module";

@Module({
  imports: [
    ConfigModule.forRoot({
      envFilePath:
        process.env["NODE" + "_ENV"] === "production"
          ? [".env", ".env.production"]
          : [
              ".env.local",
              ".env.development.local",
              ".env",
              ".env.development",
            ],
      isGlobal: true,
    }),
    MongooseModule.forRootAsync({
      useClass: MongoDBConfigService,
      inject: [ConfigService],
    }),
    ThrottlerModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (config: ConfigService) => ({
        ttl: config.get<number>("THROTTLE_TTL"),
        limit: config.get<number>("THROTTLE_LIMIT"),
      }),
    }),
    NotificationModule,
    UserModule,
    AuthModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: GqlThrottlerGuard,
    },
  ],
})
export class AppModule {}
