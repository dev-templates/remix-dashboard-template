import type { getUser } from "~/services/session.server";
import { isUser } from "~/utils/validation";
import { useMatchesData } from "./useMatchesData";

export const useOptionalUser = (): Awaited<ReturnType<typeof getUser>> | undefined => {
	const data = useMatchesData("root") as { user: Awaited<ReturnType<typeof getUser>> };
	if (!data || !isUser(data.user)) {
		return undefined;
	}
	return data.user;
};
