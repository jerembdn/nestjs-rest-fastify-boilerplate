import { BadRequestException, Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { MailjetService } from "@tonightpass/nestjs-mailjet";
import { User } from "@tonightpass/shared-types";
import { Contact, SendEmailV3_1 } from "node-mailjet";
import { MailjetTemplates } from "src/common/constants/mailjet";

@Injectable()
export class MailService {
  constructor(
    private readonly mailerService: MailjetService,
    private readonly configService: ConfigService,
  ) {}

  async addContact(
    email: string,
    name?: string,
    isExcludedFromCampaigns?: boolean,
  ): Promise<Contact.Contact> {
    const contact: Contact.Contact = await this.mailerService.addContact({
      Email: email,
      Name: name,
      IsExcludedFromCampaigns: isExcludedFromCampaigns,
    });

    return contact;
  }

  async contactExists(email: string): Promise<boolean> {
    const contact: Contact.Contact = await this.mailerService.findContact(
      email,
    );

    return !!contact;
  }

  async contactSubscribe(
    email: string,
    listId: string,
  ): Promise<Contact.Contact> {
    return await this.mailerService.subscribeContactToList(email, listId);
  }

  async contactUnsubscribe(
    email: string,
    listId: string,
    reason: string,
  ): Promise<Contact.Contact> {
    // TODO: Send email to user with reason
    reason;

    return await this.mailerService.unsubscribeContactFromList(email, listId);
  }

  private async sendEmail<TVars>(
    messages: SendEmailV3_1.Body<undefined, TVars>,
  ): Promise<SendEmailV3_1.ResponseMessage[]> {
    return await this.mailerService.sendEmail<TVars>(messages);
  }

  async sendWelcomeMessage(to: User): Promise<SendEmailV3_1.ResponseMessage[]> {
    if (!to.identifier.email)
      throw new BadRequestException("User has no email");
    if (!to.identifier.email)
      throw new BadRequestException("User email is not verified");

    const userEmail: string = to.identifier.email;

    type MailData = unknown;

    const messages: SendEmailV3_1.Body<undefined, MailData> = {
      Messages: [
        {
          From: {
            Email: this.configService.get<string>("MAILJET_FROM_EMAIL"),
            Name: this.configService.get<string>("MAILJET_FROM_NAME"),
          },
          To: [
            {
              Email: userEmail,
              Name: to.identity.firstName,
            },
          ],
          TemplateID: MailjetTemplates.WELCOME,
        },
      ],
    };

    return await this.sendEmail<MailData>(messages);
  }
}
