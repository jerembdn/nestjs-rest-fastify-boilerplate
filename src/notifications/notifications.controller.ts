import { Body, Controller, Post } from "@nestjs/common";
import { APIResponse } from "@tonightpass/shared-types";

import { NotificationService } from "./notification.service";

@Controller("notifications")
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  @Post("newsletter/subscribe")
  async subscribeToNewsletter(
    @Body("email") email: string,
  ): Promise<APIResponse> {
    return this.notificationService
      .subscribeToNewsletter(email)
      .then((subscribed: boolean) => {
        if (!subscribed) throw new Error("Failed to subscribe to newsletter");

        return {
          success: true,
          data: null,
        };
      });
  }

  @Post("newsletter/unsubscribe")
  async unsubscribeFromNewsletter(
    @Body("email") email: string,
    @Body("reason") reason?: string,
  ): Promise<APIResponse> {
    return this.notificationService
      .unsubscribeFromNewsletter(email, reason)
      .then((unsubscribed: boolean) => {
        if (!unsubscribed)
          throw new Error("Failed to unsubscribe from newsletter");

        return {
          success: true,
          data: null,
        };
      });
  }
}
