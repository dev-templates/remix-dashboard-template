import type { ActionFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/react";
import { requireUserPermission, resetPassword } from "~/models/user.server";
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
		return data<ActionData>({ error: "You cannot reset your own password" }, { status: 400 });
	}

	const formData = await request.formData();
	const password = formData.get("password") as string;

	if (!password || password.length < 3) {
		return data<ActionData>(
			{ error: "Password must be at least 3 characters long" },
			{ status: 400 },
		);
	}

	try {
		const user = await resetPassword(userId, password);
		return data<ActionData>({
			success: true,
			user: {
				id: user.id,
				username: user.username,
			},
		});
	} catch (_error: unknown) {
		return data<ActionData>(
			{ error: `Failed to reset password for user ${userId}` },
			{ status: 500 },
		);
	}
}
