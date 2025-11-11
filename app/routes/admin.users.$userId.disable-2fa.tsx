import type { ActionFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/react";
import { disable2FA, getUserById, requireUserPermission } from "~/models/user.server";
import { getUserId } from "~/services/session.server";

interface ActionData {
	success?: boolean;
	user?: {
		id: string;
		username: string;
	};
	error?: string;
}

export async function action({ params, request }: ActionFunctionArgs) {
	const currentUserId = await getUserId(request);
	if (!currentUserId) {
		return redirect("/login");
	}

	if (!(await requireUserPermission(currentUserId, "manage_users"))) {
		return data<ActionData>({ error: "Permission denied" }, { status: 403 });
	}

	const { userId } = params;
	if (!userId) {
		return data<ActionData>({ error: "User ID is required" }, { status: 400 });
	}

	
	if (userId === currentUserId) {
		return data<ActionData>({ error: "You cannot disable your own 2FA" }, { status: 400 });
	}

	
	const targetUser = await getUserById(userId);
	if (!targetUser) {
		return data<ActionData>({ error: "User not found" }, { status: 404 });
	}

	if (!targetUser.mfaEnabled) {
		return data<ActionData>({ error: "User does not have 2FA enabled" }, { status: 400 });
	}

	try {
		const user = await disable2FA(userId);
		return data<ActionData>({
			success: true,
			user: {
				id: user.id,
				username: user.username,
			},
		});
	} catch (_error: unknown) {
		return data<ActionData>(
			{
				error: `Failed to disable two-factor authentication for user ${userId}`,
			},
			{ status: 500 },
		);
	}
}
