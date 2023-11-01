import { BadRequestException, Injectable, Logger } from "@nestjs/common";
import { User } from "@tonightpass/shared-types";
import { MailjetContactLists } from "src/common/constants/mailjet";

import { MailService } from "./mail.service";

@Injectable()
export class NotificationService {
  private readonly logger = new Logger(NotificationService.name);

  constructor(private readonly mailService: MailService) {}

  async subscribeToNewsletter(userEmail: string): Promise<boolean> {
    if (!(await this.mailService.contactExists(userEmail))) {
      await this.mailService.addContact(userEmail);
    }

    await this.mailService.contactSubscribe(
      userEmail,
      MailjetContactLists.NEWSLETTER,
    );

    return true;
  }

  async unsubscribeFromNewsletter(
    userEmail: string,
    reason: string,
  ): Promise<boolean> {
    if (!(await this.mailService.contactExists(userEmail))) {
      throw new BadRequestException("Email is not registered in our lists.");
    }

    await this.mailService.contactUnsubscribe(
      userEmail,
      MailjetContactLists.NEWSLETTER,
      reason,
    );

    return false;
  }

  async sendWelcomeEmail(user: User): Promise<void> {
    await this.mailService.sendWelcomeMessage(user);
  }
}
