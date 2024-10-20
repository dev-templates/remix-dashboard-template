import { User } from "@prisma/client";
import { useOptionalUser } from "./useOptionalUser";
import { redirect } from "@remix-run/react";

export function useUser() {
  const maybeUser = useOptionalUser();
  if (!maybeUser) {
    throw redirect("/login");
  }
  return maybeUser;
}
