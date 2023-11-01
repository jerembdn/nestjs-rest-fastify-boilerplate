import { Controller, Get, Param } from "@nestjs/common";
import {
  APIResponse,
  User,
  UserIdentifier,
  UserRole,
} from "@tonightpass/shared-types";
import { CurrentUser } from "src/common/decorators/current-user.decorator";
import { Logged } from "src/common/decorators/logged.decorator";

import { UserService } from "./user.service";

@Controller("users")
export class UsersController {
  constructor(private readonly userService: UserService) {}

  @Get()
  @Logged(UserRole.ADMINISTRATOR)
  async getUsers(): Promise<APIResponse<User[]>> {
    return this.userService.search().then((users: User[]) => ({
      success: true,
      data: users,
    }));
  }

  @Get("me")
  @Logged()
  async me(@CurrentUser() user: User): Promise<APIResponse<User>> {
    return {
      success: true,
      data: user,
    };
  }

  @Get(":id")
  @Logged(UserRole.ADMINISTRATOR)
  async getUser(@Param("id") id: string): Promise<APIResponse<User>> {
    return this.userService.findById(id).then((user: User) => ({
      success: true,
      data: user,
    }));
  }

  @Get("identify/:identifier")
  async identifyUser(
    @Param("identifier") identifier: string,
  ): Promise<APIResponse<UserIdentifier>> {
    return this.userService
      .identify(identifier)
      .then((identifier: UserIdentifier) => {
        if (!identifier) {
          return {
            success: false,
            message: "User not found",
          };
        } else {
          return {
            success: true,
            data: identifier,
          };
        }
      });
  }
}
