import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import { User, UserToken, UserTokenType } from "@tonightpass/shared-types";
import * as mongoose from "mongoose";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function transformValue(_: unknown, ret: { [key: string]: any }) {
  delete ret._id;
}

export type TokenDocument = Token & mongoose.Document;

@Schema({
  toObject: {
    virtuals: true,
    versionKey: false,
    transform: transformValue,
  },
  toJSON: {
    virtuals: true,
    versionKey: false,
    transform: transformValue,
  },
  id: true,
})
class Token implements UserToken {
  id: string;

  @Prop({ type: mongoose.Schema.Types.ObjectId, ref: "User", required: true })
  user: User;

  @Prop({ required: true })
  type: UserTokenType;

  @Prop({ type: String, required: true })
  value: string;

  @Prop({ type: Date })
  createdAt: Date;

  @Prop({ type: Date, required: false })
  expiresAt: Date;
}

export const TokenSchema = SchemaFactory.createForClass<Token, TokenDocument>(
  Token,
);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
TokenSchema.pre("save", async function (next: any) {
  this.createdAt = new Date();

  next();
});
