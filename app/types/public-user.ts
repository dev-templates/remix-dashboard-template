import { Role, User } from "@prisma/client";

export interface PublicUser {
  id: User["id"];
  role: {
    name: Role["name"];
  };
  username: User["username"];
}

export function isAdmin(user: PublicUser) {
  return user.role?.name === "admin";
}

