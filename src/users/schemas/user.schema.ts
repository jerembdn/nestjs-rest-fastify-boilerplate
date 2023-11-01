/* eslint-disable @typescript-eslint/no-explicit-any */
import { Prop, Schema, SchemaFactory } from "@nestjs/mongoose";
import {
  User as SharedUser,
  UserConnection,
  UserConnectionClient,
  UserConnectionDevice,
  UserConnectionOS,
  UserIdentifier,
  UserIdentity,
  UserPreferences,
  UserRole,
  Currency,
  Language,
  Location,
} from "@tonightpass/shared-types";
import * as bcrypt from "bcryptjs";
import { HydratedDocument } from "mongoose";
import * as mongooseLeanDefaults from "mongoose-lean-defaults";
import * as mongooseLeanVirtuals from "mongoose-lean-virtuals";
import { LocationSchema } from "src/common/schemas/location.schema";

@Schema({
  _id: false,
})
class Identifier implements UserIdentifier {
  @Prop({
    type: String,
    match:
      /[a-z0-9!#$%&'*+/=?^_`{|}~-]+(?:\.[a-z0-9!#$%&'*+/=?^_`{|}~-]+)*@(?:[a-z0-9](?:[a-z0-9-]*[a-z0-9])?\.)+[a-z0-9](?:[a-z0-9-]*[a-z0-9])?/g,
    required: false,
  })
  email?: string;

  @Prop({
    type: String,
    match:
      /^(?:(?:(?:\+|00)33\D?(?:\D?\(0\)\D?)?)|0){1}[1-9]{1}(?:\D?\d{2}){4}$/gm,
    required: false,
  })
  phoneNumber?: string;

  @Prop({
    type: String,
    max: 20,
    min: 6,
    required: true,
  })
  username: string;

  [key: string]: string;
}

@Schema({
  _id: false,
  virtuals: true,
})
class Identity implements UserIdentity {
  fullName: string;

  @Prop({
    type: String,
    required: true,
  })
  firstName: string;

  @Prop({
    type: String,
    required: true,
  })
  lastName: string;

  @Prop({
    type: String,
    required: false,
  })
  displayName: string;

  @Prop({
    type: String,
    required: false,
  })
  description: string;

  @Prop({
    type: String,
    required: true,
  })
  gender: string;

  @Prop({
    type: String,
    match:
      /^[-a-zA-Z0-9@:%_\\+.~#?&//=]{2,256}\.[a-z]{2,4}\b(\/[-a-zA-Z0-9@:%_\\+.~#?&//=]*)?(\.(jpg|png)?)$/gi,
    required: false,
  })
  profilePictureUrl?: string;

  @Prop({
    type: Date,
    required: true,
  })
  birthDate: Date;

  @Prop({
    type: Boolean,
    default: false,
    required: false,
  })
  idValid: boolean;
}

@Schema()
class Preferences implements UserPreferences {
  language: Language;
  currency: Currency;
  notifications: {
    email: { newsletter: boolean; message: boolean };
    push: { message: boolean };
  };
}

@Schema()
class Connection implements UserConnection {
  ip: string;
  os: UserConnectionOS;
  device: UserConnectionDevice;
  client: UserConnectionClient;
  updatedAt: Date;
  createdAt: Date;
}
const ConnectionSchema =
  SchemaFactory.createForClass<UserConnection>(Connection);

export type UserDocument = HydratedDocument<
  User & {
    generateAccountValidationToken: (size: number) => Promise<string>;
    getEncryptedPassword: (password: string) => Promise<string>;
    compareEncryptedPassword: (password: string) => Promise<boolean>;
  }
>;

const SALT_ROUNDS = 10;

function transformValue(_: unknown, ret: { [key: string]: any }) {
  delete ret._id;
  delete ret.password;
}

export const DEFAULT_USER_PREFERENCES: UserPreferences = {
  language: Language.FR,
  currency: Currency.EUR,
  notifications: {
    email: {
      newsletter: true,
      message: true,
    },
    push: {
      message: true,
    },
  },
};

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
class User implements SharedUser {
  id: string;

  @Prop({
    type: Identifier,
    required: true,
  })
  identifier: UserIdentifier;

  @Prop({
    type: String,
    match: /^(?=.*\d)(?=.*[a-z])(?=.*[A-Z])(?=.*[a-zA-Z]).{8,}$/gm,
    required: true,
  })
  password: string;

  @Prop({
    type: Identity,
    required: true,
  })
  identity: UserIdentity;

  @Prop({
    type: String,
    enum: Object.values(UserRole),
    default: UserRole.USER,
  })
  role: UserRole;

  @Prop({
    type: [LocationSchema],
    default: [],
  })
  addresses: Location[];

  @Prop({
    type: Preferences,
    default: DEFAULT_USER_PREFERENCES,
  })
  preferences: UserPreferences;

  @Prop({
    type: [ConnectionSchema],
    default: [],
  })
  connections: UserConnection[];

  @Prop({
    type: Date,
  })
  updatedAt: Date;

  @Prop({
    type: Date,
  })
  createdAt: Date;
}

export const UserSchema = SchemaFactory.createForClass<User, UserDocument>(
  User,
);

UserSchema.plugin(mongooseLeanVirtuals.mongooseLeanVirtuals);
UserSchema.plugin(mongooseLeanDefaults.default);

UserSchema.virtual("identity.fullName").get(function (this: User) {
  return `${this.identity.firstName} ${this.identity.lastName}`;
});

UserSchema.methods.generateAccountValidationToken = function (size: number) {
  return bcrypt.hash(this.id, SALT_ROUNDS).then((hash) => {
    return hash.slice(0, size).toString();
  });
};

UserSchema.methods.getEncryptedPassword = (
  password: string,
): Promise<string> => {
  return bcrypt.hash(String(password), SALT_ROUNDS);
};

UserSchema.methods.compareEncryptedPassword = function (password: string) {
  return bcrypt.compare(password, this.password);
};

UserSchema.pre("save", async function (next: any) {
  this.createdAt = new Date();

  if (this.isModified("password")) {
    this.password = await (this as UserDocument).getEncryptedPassword(
      this.password,
    );
  }
  next();
});

UserSchema.pre("updateOne", function (next: any) {
  this.updateOne({}, { $set: { updatedAt: new Date() } });
  next();
});
