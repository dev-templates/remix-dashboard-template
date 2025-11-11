import type { ActionFunctionArgs, LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import {
	data,
	Form,
	redirect,
	useActionData,
	useLoaderData,
	useNavigation,
} from "@remix-run/react";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { QRCodeSVG } from "qrcode.react";
import { useEffect, useRef, useState } from "react";
import speakeasy from "speakeasy";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import { Label } from "~/components/ui/label";
import { enrollAuthenticationFactor, getUserById } from "~/models/user.server";
import { createUserSession } from "~/services/session.server";

export const meta: MetaFunction = () => {
	return [{ title: "Two-Factor Authentication" }];
};

interface ActionData {
	userId?: string;
	mfaEnabled?: boolean;
	mfaSecret?: string;
	mfaUrl?: string;
	errors?: {
		verificationCode?: string;
	};
}

interface LoaderData {
	userId: string;
	mfaEnabled: boolean;
	mfaSecret?: string;
	mfaUrl?: string;
}

export async function loader({ request }: LoaderFunctionArgs) {
	
	const url = new URL(request.url);
	const userId = url.searchParams.get("userId");
	const mfaSecret = url.searchParams.get("mfaSecret");
	const mfaUrl = url.searchParams.get("mfaUrl");
	const mfaEnabled = url.searchParams.get("mfaEnabled") === "true";

	if (!userId) {
		return redirect("/login");
	}

	return data<LoaderData>({
		userId,
		mfaEnabled,
		mfaSecret: mfaSecret || undefined,
		mfaUrl: mfaUrl || undefined,
	});
}

export async function action({ request }: ActionFunctionArgs) {
	
	const url = new URL(request.url);
	const userId = url.searchParams.get("userId") || "";
	const mfaEnabled = url.searchParams.get("mfaEnabled") === "true";
	let mfaSecret = url.searchParams.get("mfaSecret") || "";
	const mfaUrl = url.searchParams.get("mfaUrl") || "";

	const formData = await request.formData();
	const authenticationCode = (formData.get("authenticationCode") as string) || "";
	const remember = formData.get("remember") === "on";

	if (!userId) {
		return redirect("/login");
	}

	if (mfaEnabled) {
		
		const user = await getUserById(userId);
		if (!user) {
			return data<ActionData>({ errors: { verificationCode: "User not found" } }, { status: 400 });
		}
		mfaSecret = user.mfaSecret ?? "";
	}

	
	const verified = speakeasy.totp.verify({
		secret: mfaSecret,
		encoding: "base32",
		token: authenticationCode,
	});

	if (!verified) {
		return data<ActionData>(
			{
				userId: userId,
				mfaEnabled: mfaEnabled,
				mfaSecret: mfaSecret,
				mfaUrl: mfaUrl,
				errors: {
					verificationCode: `Invalid verification code`,
				},
			},
			{ status: 400 },
		);
	}

	
	if (!mfaEnabled) {
		const updatedUser = await enrollAuthenticationFactor(userId, {
			mfaEnabled: true,
			mfaSecret: mfaSecret,
		});
		if (!updatedUser) {
			return data<ActionData>(
				{ errors: { verificationCode: "Failed to enroll in MFA" } },
				{ status: 500 },
			);
		}
	}

	
	return createUserSession({
		request,
		userId: userId,
		remember: remember,
		redirectTo: "/",
	});
}

export default function LoginVerify() {
	const loaderData = useLoaderData<LoaderData>();
	const actionData = useActionData<ActionData>();
	const navigation = useNavigation();

	const mfaEnabled = actionData?.mfaEnabled ?? loaderData.mfaEnabled;
	const mfaUrl = actionData?.mfaUrl || loaderData.mfaUrl || "";
	const errors = actionData?.errors;

	const [authenticationCode, setAuthenticationCode] = useState<string>("");
	const inputRef = useRef<HTMLInputElement>(null);

	useEffect(() => {
		if (inputRef.current) {
			inputRef.current.focus();
		}
	}, []);

	const userAgent = navigator.userAgent.toLowerCase();
	const appleDevices = ["iphone", "ipad", "ipod", "mac"];
	const isApple = appleDevices.some((device) => userAgent.includes(device));
	let googleAuthenticatorUrl =
		"https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2";
	if (isApple) {
		googleAuthenticatorUrl = "https://apps.apple.com/us/app/google-authenticator/id388497605";
	}

	return (
		<div className="flex justify-center items-center h-screen">
			<Form className="flex max-w-md flex-col gap-4" method="post">
				<Input type="hidden" name="authenticationCode" value={authenticationCode} />
				<Card>
					<CardHeader>
						<CardTitle>Two Factor Authentication</CardTitle>
					</CardHeader>
					<CardContent>
						<div className="mb-4">
							<span className="text-sm text-muted-foreground">
								Authenticator apps and browser extensions like
								<ul>
									<li>
										<a
											className="underline"
											href={googleAuthenticatorUrl}
											target="_blank"
											rel="noopener noreferrer"
										>
											Google Authenticator
										</a>
									</li>
									<li>
										<a
											className="underline"
											href="https://support.1password.com/one-time-passwords/"
											target="_blank"
											rel="noopener noreferrer"
										>
											1Password
										</a>
									</li>
									<li>
										<a
											className="underline"
											href="https://authy.com/guides/github/"
											target="_blank"
											rel="noopener noreferrer"
										>
											Authy
										</a>
									</li>
									<li>
										<a
											className="underline"
											href="https://www.microsoft.com/en-us/account/authenticator/"
											target="_blank"
											rel="noopener noreferrer"
										>
											Microsoft Authenticator
										</a>
									</li>
								</ul>
								etc. generate one-time passwords that are used as a second factor to verify your
								identity when prompted during sign-in.
							</span>
						</div>
						{!mfaEnabled && mfaUrl && (
							<>
								<div className="flex flex-col items-center mb-4">
									<h5 className="text-lg font-bold">Scan the QR code</h5>
									<div className="text-sm text-muted-foreground">
										Use an authenticator app or browser extension to scan.
									</div>
								</div>
								<div className="flex justify-center mb-4">
									<QRCodeSVG value={mfaUrl} size={212} className="p-4 bg-white" />
								</div>
							</>
						)}
						<div className="flex flex-col items-center justify-center mb-4">
							<Label htmlFor="verification-code" className="mb-2">
								Verify the code from the app
							</Label>
							<InputOTP
								maxLength={6}
								pattern={REGEXP_ONLY_DIGITS}
								className="m-4"
								onChange={(value) => setAuthenticationCode(value)}
								ref={inputRef}
								name="verification-code"
							>
								<InputOTPGroup className="flex justify-center">
									<InputOTPSlot index={0} />
									<InputOTPSlot index={1} />
									<InputOTPSlot index={2} />
									<InputOTPSlot index={3} />
									<InputOTPSlot index={4} />
									<InputOTPSlot index={5} />
								</InputOTPGroup>
							</InputOTP>
							{errors?.verificationCode && navigation.state !== "submitting" && (
								<p className="pt-1 text-destructive" id="verification-code-error">
									{errors?.verificationCode}
								</p>
							)}
						</div>
					</CardContent>
					<CardFooter>
						<Button
							type="submit"
							isLoading={navigation.state === "submitting"}
							disabled={navigation.state === "submitting"}
							className="w-full"
						>
							Verify
						</Button>
					</CardFooter>
				</Card>
			</Form>
		</div>
	);
}
