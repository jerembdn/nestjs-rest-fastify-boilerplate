import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MongooseModule } from "@nestjs/mongoose";
import MongoDBConnection from "src/common/constants/mongoDbConnections";
import { MongoDBConfigService } from "src/config/database/mongodb.config";
import { NotificationModule } from "src/notifications/notification.module";
import { NotificationService } from "src/notifications/notification.service";

import { UserSchema } from "./schemas/user.schema";
import { UserService } from "./user.service";
import { UsersController } from "./users.controller";

@Module({
  imports: [
    MongooseModule.forRootAsync({
      useClass: MongoDBConfigService,
      inject: [ConfigService],
      connectionName: MongoDBConnection.USERS,
    }),
    MongooseModule.forFeature([
      {
        name: "User",
        schema: UserSchema,
        collection: "users",
      },
    ]),
    NotificationModule,
  ],
  controllers: [UsersController],
  providers: [NotificationService, UserService],
  exports: [UserService],
})
export class UserModule {}
