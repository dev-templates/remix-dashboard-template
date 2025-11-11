import type { ActionFunctionArgs } from "@remix-run/node";
import { data, redirect } from "@remix-run/react";
import { z } from "zod";
import { createUser, requireUserPermission } from "~/models/user.server";
import { getUserId } from "~/services/session.server";

const FormSchema = z.object({
	username: z
		.string()
		.min(3, { message: "Username must be at least 3 characters long" })
		.max(64, { message: "Username must be at most 64 characters long" }),
	password: z
		.string()
		.min(3, { message: "Password must be at least 3 characters long" })
		.max(64, { message: "Password must be at most 64 characters long" }),
	role: z.string().min(1, { message: "Role must be selected" }),
});

interface ActionData {
	success?: boolean;
	user?: {
		id: string;
		username: string;
	};
	error?: string;
	errors?: {
		username?: string;
		password?: string;
		role?: string;
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await getUserId(request);
	if (!userId) {
		return redirect("/login");
	}

	if (!(await requireUserPermission(userId, "manage_users"))) {
		return data<ActionData>({ error: "Permission denied" }, { status: 403 });
	}

	const formData = await request.formData();
	const username = formData.get("username") as string;
	const password = formData.get("password") as string;
	const role = formData.get("role") as string;

	const result = FormSchema.safeParse({ username, password, role });

	if (!result.success) {
		const errors: ActionData["errors"] = {};
		for (const issue of result.error.issues) {
			const path = issue.path[0] as keyof NonNullable<ActionData["errors"]>;
			if (path === "username" || path === "password" || path === "role") {
				errors[path] = issue.message;
			}
		}
		return data<ActionData>({ errors }, { status: 400 });
	}

	try {
		const user = await createUser(username, password, role);
		return data<ActionData>(
			{
				success: true,
				user: { id: user.id, username: user.username },
			},
			{ status: 200 },
		);
	} catch (_error: unknown) {
		return data<ActionData>(
			{
				error: `Failed to create user ${username}. Maybe username already exists?`,
			},
			{ status: 500 },
		);
	}
}
