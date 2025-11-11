import type { getUser } from "~/services/session.server";

// export interface PublicUser {
//   id: User["id"];
//   role: {
//     name: Role["name"];
//   };
//   username: User["username"];
// }

export function isAdmin(user: Awaited<ReturnType<typeof getUser>>) {
	return user?.role?.name === "admin";
}
