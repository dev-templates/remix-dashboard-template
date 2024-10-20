import { User } from "@prisma/client";
import { useMatchesData } from "./useMatchesData";
import { isUser } from "~/utils/validation";
import { getUser } from '~/services/session.server';

export const useOptionalUser = (): Awaited<ReturnType<typeof getUser>> | undefined => {
  const data = useMatchesData("root") as { user: Awaited<ReturnType<typeof getUser>> };
  if (!data || !isUser(data.user)) {
    return undefined;
  }
  return data.user;
};
