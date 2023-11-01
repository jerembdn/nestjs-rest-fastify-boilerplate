import { Module } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailjetModule } from "@tonightpass/nestjs-mailjet";

import { MailService } from "./mail.service";
import { NotificationService } from "./notification.service";
import { NotificationsController } from "./notifications.controller";

@Module({
  imports: [
    MailjetModule.forRootAsync({
      useFactory: async (configService: ConfigService) => ({
        apiKey: configService.get<string>("MAILJET_API_KEY"),
        apiSecret: configService.get<string>("MAILJET_API_SECRET"),
        sandboxMode: configService.get<string>("NODE_ENV") !== "production",
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [NotificationsController],
  providers: [MailService, NotificationService],
  exports: [MailService],
})
export class NotificationModule {}
