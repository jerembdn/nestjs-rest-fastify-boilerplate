import { Injectable, Logger } from "@nestjs/common";
import { InjectModel } from "@nestjs/mongoose";
import { User, UserToken, UserTokenType } from "@tonightpass/shared-types";
import { Model } from "mongoose";

import { TokenDocument } from "./schemas/token.schema";

@Injectable()
export class TokenService {
  private readonly logger = new Logger(TokenService.name);

  constructor(
    @InjectModel("Token") private readonly tokenModel: Model<TokenDocument>,
  ) {}

  async setToken(
    user: User,
    type: UserTokenType,
    value: string,
    expiresAt: Date,
  ): Promise<UserToken> {
    return await this.tokenModel.create({
      user,
      type,
      value,
      expiresAt,
    });
  }

  async removeToken(user: User, type: UserTokenType): Promise<void> {
    await this.tokenModel
      .findOneAndDelete({
        user,
        type,
      })
      .exec();
  }

  async setAccessToken(
    user: User,
    token: string,
    expiresAt?: Date,
  ): Promise<UserToken> {
    return await this.setToken(
      user,
      UserTokenType.Authentication,
      token,
      expiresAt,
    );
  }

  async removeAccessToken(user: User): Promise<void> {
    await this.tokenModel
      .findOneAndDelete({
        user,
        type: UserTokenType.Authentication,
      })
      .exec();
  }
}
