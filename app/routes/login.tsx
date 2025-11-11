import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { data, Form, redirect, useActionData, useNavigation } from "@remix-run/react";
import speakeasy from "speakeasy";
import { Button } from "~/components/ui/button";
import {
	Card,
	CardContent,
	CardDescription,
	CardFooter,
	CardHeader,
	CardTitle,
} from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { getSystemSettingAsBoolean } from "~/models/system-settings.server";
import { verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/services/session.server";
import { validatePassword, validateUsername } from "~/utils/validation.server";

export const meta: MetaFunction = () => {
	return [{ title: "Login" }];
};

interface ActionData {
	errors?: {
		username?: string;
		password?: string;
	};
}

export async function action({ request }: ActionFunctionArgs) {
	const formData = await request.formData();
	const username = (formData.get("username") as string) ?? "";
	const password = (formData.get("password") as string) ?? "";

	if (!validateUsername(username)) {
		return data<ActionData>({ errors: { username: "Username is invalid" } }, { status: 400 });
	}

	if (!validatePassword(password)) {
		return data<ActionData>({ errors: { password: "Password is invalid" } }, { status: 400 });
	}

	const user = await verifyLogin(username, password);

	if (!user) {
		return data<ActionData>(
			{ errors: { password: "Invalid username or password" } },
			{ status: 400 },
		);
	}

	const require2FA = await getSystemSettingAsBoolean("require2FA");

	if (user.mfaEnabled) {
		const params = new URLSearchParams({
			userId: user.id,
			mfaEnabled: "true",
		});
		return redirect(`/two-factor?${params.toString()}`);
	}

	if (require2FA) {
		const generatedSecret = speakeasy.generateSecret({
			name: user.username,
			issuer: "Template MFA", // TODO: Change this to the name of your app
		});

		const params = new URLSearchParams({
			userId: user.id,
			mfaEnabled: "false",
			mfaSecret: generatedSecret.base32,
			mfaUrl: generatedSecret.otpauth_url ?? "",
		});

		return redirect(`/two-factor?${params.toString()}`);
	}

	return createUserSession({
		request,
		userId: user.id,
		remember: false,
		redirectTo: "/",
	});
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request);
	if (userId) return redirect("/");
	return {};
}

export default function Login() {
	const actionData = useActionData<ActionData>();
	const errors = actionData?.errors;
	const navigation = useNavigation();

	return (
		<div className="flex justify-center items-center h-screen">
			<Form className="flex max-w-md flex-col gap-4" method="post">
				<Card className="min-w-[400px]">
					<CardHeader>
						<CardTitle>Login</CardTitle>
						<CardDescription>Login to your account</CardDescription>
					</CardHeader>
					<CardContent>
						<div>
							<div className="mb-2 block">
								<Label htmlFor="username" className="font-bold">
									Username
								</Label>
							</div>
							<Input id="username" name="username" type="text" autoComplete="username" required />
							{errors?.username && (
								<p className="pt-1 text-destructive" id="username-error">
									{errors?.username}
								</p>
							)}
						</div>
						<div>
							<div className="mb-2 block">
								<Label htmlFor="password" className="font-bold">
									Password
								</Label>
							</div>
							<Input
								id="password"
								name="password"
								type="password"
								autoComplete="current-password"
								required
							/>
							{errors?.password && (
								<p className="pt-1 text-destructive" id="password-error">
									{errors?.password}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter>
						<Button type="submit" isLoading={navigation.state === "submitting"} className="w-full">
							Login
						</Button>
					</CardFooter>
				</Card>
			</Form>
		</div>
	);
}
