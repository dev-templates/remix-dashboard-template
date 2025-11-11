import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
	data,
	Form,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from "@remix-run/react";
import { useEffect } from "react";
import { toast } from "sonner";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "~/components/ui/card";
import { Label } from "~/components/ui/label";
import { Switch } from "~/components/ui/switch";
import { getSystemSettingAsBoolean, updateSystemSetting } from "~/models/system-settings.server";
import { requireUser } from "~/services/session.server";
import { isAdmin } from "~/types/public-user";

export const meta: MetaFunction = () => {
	return [{ title: "System Settings" }];
};

interface LoaderData {
	require2FA: boolean;
}

interface ActionData {
	success?: boolean;
	error?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request);
	if (!user || !isAdmin(user)) {
		return redirect("/login");
	}

	const require2FA = await getSystemSettingAsBoolean("require2FA");

	return data<LoaderData>({
		require2FA,
	});
}

export async function action({ request }: ActionFunctionArgs) {
	const user = await requireUser(request);
	if (!user || !isAdmin(user)) {
		return redirect("/login");
	}

	const formData = await request.formData();
	const require2FA = formData.get("require2FA") === "true";

	try {
		await updateSystemSetting("require2FA", require2FA.toString());
		return data<ActionData>({ success: true });
	} catch (error) {
		console.error("Failed to update system settings:", error);
		return data<ActionData>({ error: "Failed to update system settings" }, { status: 500 });
	}
}

export default function AdminSettings() {
	const loaderData = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();
	const navigation = useNavigation();

	const isSubmitting = navigation.state === "submitting";

	
	useEffect(() => {
		if (navigation.state === "idle" && actionData) {
			if (actionData.error) {
				toast.error(actionData.error);
			} else if (actionData.success) {
				toast.success("System settings updated successfully");
			}
		}
	}, [navigation.state, actionData]);

	return (
		<div className="space-y-6">
			<div>
				<h1 className="text-3xl font-bold">System Settings</h1>
				<p className="text-muted-foreground">
					Manage system-wide configuration and security policies
				</p>
			</div>

			<Card>
				<CardHeader>
					<CardTitle>Security Settings</CardTitle>
					<CardDescription>Configure security policies for all users in the system</CardDescription>
				</CardHeader>
				<CardContent>
					<Form method="post">
						<div className="space-y-6">
							<div className="flex items-center justify-between space-x-4">
								<div className="flex-1 space-y-1">
									<Label htmlFor="require2FA" className="text-base">
										Require Two-Factor Authentication
									</Label>
									<p className="text-sm text-muted-foreground">
										When enabled, all users will be required to set up two-factor authentication on
										their first login. Existing users who have already enabled 2FA will keep their
										settings. When disabled, users can choose whether to enable 2FA for their
										accounts.
									</p>
								</div>
								<Switch
									id="require2FA"
									name="require2FA"
									defaultChecked={loaderData.require2FA}
									value="true"
									disabled={isSubmitting}
								/>
							</div>

							<div className="flex justify-end">
								<Button type="submit" disabled={isSubmitting} isLoading={isSubmitting}>
									Save Changes
								</Button>
							</div>
						</div>
					</Form>
				</CardContent>
			</Card>
		</div>
	);
}
