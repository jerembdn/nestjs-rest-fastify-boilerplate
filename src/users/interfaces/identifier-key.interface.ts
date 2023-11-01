export type IdentifierKeyType = "email" | "phoneNumber" | "username";

export class IdentifierKey {
  key: IdentifierKeyType | undefined;
  value: string;
}
