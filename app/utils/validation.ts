import type { User } from "~/models/user.server";

// Check if the user is valid
export function isUser(user: any) {
  return user && typeof user === "object" && typeof user.username === "string";
}
