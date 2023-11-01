import { Injectable } from "@nestjs/common";
import { compare, hash } from "bcryptjs";

@Injectable()
export class PasswordUtils {
  async compare(password: string, hash: string): Promise<boolean> {
    return compare(password, hash);
  }

  async hash(password: string): Promise<string> {
    if (!password || password.length < 6) {
      throw new Error("Password must be at least 6 characters.");
    }

    return hash(password, 10);
  }
}
