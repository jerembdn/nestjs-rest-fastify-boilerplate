import { Injectable } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import {
  CreateUserDto,
  User,
  UserIdentifier,
  UserIdentity,
} from "@tonightpass/shared-types";
import { Model } from "mongoose";
import { ValidationRegex } from "src/common/validation/regex";
import { NotificationService } from "src/notifications/notification.service";

import {
  IdentifierKey,
  IdentifierKeyType,
} from "./interfaces/identifier-key.interface";
import { UserDocument } from "./schemas/user.schema";

type UsersSearchParams = {
  identifier?: Partial<UserIdentifier>;
  identity?: Partial<Pick<UserIdentity, "firstName" | "lastName" | "fullName">>;
};

@Injectable()
export class UserService {
  constructor(
    @InjectModel("User") private readonly userModel: Model<UserDocument>,
    private readonly notificationService: NotificationService,
  ) {}

  async search(
    params: UsersSearchParams = {
      identifier: {},
      identity: {},
    },
  ): Promise<User[]> {
    const query = this.userModel.find();

    if (params) {
      const identifier = params.identifier ?? {};
      const identity = params.identity ?? {};

      if (identifier.email) {
        query.or([{ "identifier.email": identifier.email }]);
      }
      if (identifier.phoneNumber) {
        query.or([{ "identifier.phoneNumber": identifier.phoneNumber }]);
      }
      if (identifier.username) {
        query.or([{ "identifier.username": identifier.username }]);
      }

      if (identity.firstName) {
        query.or([{ "identity.firstName": identity.firstName }]);
      }
      if (identity.lastName) {
        query.or([{ "identity.lastName": identity.lastName }]);
      }
      if (identity.fullName) {
        query.or([{ "identity.fullName": identity.fullName }]);
      }
    }

    const users: User[] = await query.lean().exec();

    return users;
  }

  async compareEncryptedPassword(
    userId: string,
    password: string,
  ): Promise<boolean> {
    const user = await this.userModel.findById(userId).exec();

    return user.compareEncryptedPassword(password);
  }

  private getIdentifierKey(identifier: string): IdentifierKey {
    let key: IdentifierKeyType;

    if (new RegExp(ValidationRegex.PhoneNumber).test(identifier)) {
      key = "phoneNumber";
    }
    if (new RegExp(ValidationRegex.Email).test(identifier)) {
      key = "email";
    }
    if (new RegExp(ValidationRegex.Username).test(identifier)) {
      key = "username";
    }

    return {
      key,
      value: identifier,
    };
  }

  async identify(identifier: string): Promise<UserIdentifier> {
    const query = this.userModel.find();

    query.or([
      { "identifier.email": identifier },
      { "identifier.phoneNumber": identifier },
      { "identifier.username": identifier },
    ]);

    const users: User[] = await query.lean().exec();

    if (users.length === 0) return null;

    const user: User = users[0];

    let foundIdentifier: UserIdentifier = {
      username: user.identifier.username,
    };

    if (user.identifier.email === identifier)
      foundIdentifier = { ...foundIdentifier, email: identifier };
    if (user.identifier.phoneNumber === identifier)
      foundIdentifier = { ...foundIdentifier, phoneNumber: identifier };

    return foundIdentifier;
  }

  async exists(params: UsersSearchParams): Promise<boolean> {
    const user: User = await this.userModel.findOne(params).lean().exec();

    return !!user;
  }

  async findOne(params: UsersSearchParams): Promise<User> {
    const user: User = await this.userModel.findOne(params).lean().exec();

    return user;
  }

  async findById(id: string): Promise<User> {
    return await this.userModel
      .findById(id)
      .lean({ defaults: true, virtuals: true })
      .exec();
  }

  async create(data: CreateUserDto): Promise<User> {
    // - If user is already registered in newsletter entries email
    //TODO

    const newUser: User = await this.userModel.create(data);
    const user: User = await this.findById(newUser.id);

    // - Send welcome email to user
    if (data.identifier.email)
      await this.notificationService.sendWelcomeEmail(user);

    return user;
  }
}
