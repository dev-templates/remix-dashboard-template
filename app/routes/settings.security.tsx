import { type ActionFunctionArgs, type LoaderFunctionArgs, redirect } from "@remix-run/node";
import { data, Form, useActionData, useLoaderData } from "@remix-run/react";
import ErrorMessage from "~/components/error-message";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Dialog,
	DialogClose,
	DialogContent,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "~/components/ui/dialog";
import { getSystemSettingAsBoolean } from "~/models/system-settings.server";
import { disable2FA } from "~/models/user.server";
import { logout, requireUserId } from "~/services/session.server";

interface ActionData {
	error?: string;
}

interface LoaderData {
	require2FA: boolean;
}

export async function loader({ request }: LoaderFunctionArgs) {
	await requireUserId(request);
	const require2FA = await getSystemSettingAsBoolean("require2FA");
	return data<LoaderData>({ require2FA });
}

export async function action({ request }: ActionFunctionArgs) {
	const userId = await requireUserId(request);
	if (!userId) {
		return redirect("/login");
	}
	const formData = await request.formData();
	const _action = formData.get("_action");
	if (_action !== "delete-two-factor") {
		return null;
	}
	const user = await disable2FA(userId);
	if (!user) {
		return data<ActionData>(
			{ error: "Failed to disable two-factor authentication" },
			{ status: 500 },
		);
	}
	return logout(request);
}

export default function Security() {
	const loaderData = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();
	const error =
		actionData && typeof actionData === "object" && "error" in actionData
			? (actionData.error as string | undefined)
			: undefined;

	const canDisable2FA = !loaderData.require2FA;

	return (
		<Card>
			<CardHeader>
				<CardTitle>Two-factor authentication</CardTitle>
				<CardDescription>Manage your two-factor authentication settings.</CardDescription>
			</CardHeader>
			<CardContent>
				<div className="flex items-center justify-between">
					<div className="flex flex-col space-y-2">
						<div className="text-sm text-accent-foreground">
							Your already configured two-factor authentication
						</div>
						{loaderData.require2FA && (
							<p className="text-sm text-muted-foreground">
								System administrator requires all users to enable two-factor authentication. You
								cannot disable it.
							</p>
						)}
						{error && <ErrorMessage error={error} />}
						<Dialog>
							<DialogTrigger asChild>
								<Button variant="destructive" disabled={!canDisable2FA}>
									Delete two-factor authentication
								</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Two-factor Delete confirmation</DialogTitle>
								</DialogHeader>
								<div className="flex flex-col space-y-2">
									<p>Are you sure you want to delete two-factor authentication?</p>
									<p>You will be logout of current session, return to the login page.</p>
								</div>
								<DialogFooter>
									<DialogClose asChild>
										<Button type="button" variant="secondary">
											Cancel
										</Button>
									</DialogClose>
									<Form method="post">
										<input type="hidden" name="_action" value="delete-two-factor" />
										<Button type="submit" variant="destructive">
											Delete
										</Button>
									</Form>
								</DialogFooter>
							</DialogContent>
						</Dialog>
					</div>
				</div>
			</CardContent>
		</Card>
	);
}
