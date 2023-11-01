import { applyDecorators, SetMetadata } from "@nestjs/common";
import { UserRole } from "@tonightpass/shared-types";

// eslint-disable-next-line @typescript-eslint/explicit-module-boundary-types
export const Logged = (...roles: UserRole[]) =>
  applyDecorators(SetMetadata("secured", true), SetMetadata("roles", roles));
