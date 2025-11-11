import { redirect } from "@remix-run/react";
import { useOptionalUser } from "./useOptionalUser";

export function useUser() {
	const maybeUser = useOptionalUser();
	if (!maybeUser) {
		throw redirect("/login");
	}
	return maybeUser;
}
