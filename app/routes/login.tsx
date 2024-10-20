import type { ActionFunctionArgs, LoaderFunctionArgs } from "@remix-run/node";
import { Form, MetaFunction, redirect, useNavigation, json, useActionData } from "@remix-run/react";
import { Button } from "~/components/ui/button";
import { Label } from "~/components/ui/label";
import { Input } from "~/components/ui/input";
import { enrollAuthenticationFactor, getUserById, User, verifyLogin } from "~/models/user.server";
import { createUserSession, getUserId } from "~/services/session.server";
import { validatePassword, validateUsername } from "~/utils/validation.server";
import speakeasy from "speakeasy";
import { InputOTP, InputOTPGroup, InputOTPSlot } from "~/components/ui/input-otp";
import { REGEXP_ONLY_DIGITS } from "input-otp";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { QRCodeSVG } from "qrcode.react";

export const meta: MetaFunction = () => {
  return [{ title: "Login" }];
};

// First we create our UI with the form doing a POST and the inputs with the
// names we are going to use in the strategy
export default function Login() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;
  const userId = actionData?.userId;
  const mfaEnabled = actionData?.mfaEnabled;
  const mfaSecret = actionData?.mfaSecret;
  const mfaUrl = actionData?.mfaUrl;
  return (
    <div className='flex justify-center items-center h-screen'>
      {/* <div className='w-full max-w-sm p-4 bg-white border border-gray-200 rounded-lg shadow sm:p-6 md:p-8 dark:bg-gray-800 dark:border-gray-700'> */}
      {!userId ? <LoginForm /> : <TwoFactorForm />}
      {/* </div> */}
    </div>
  );
}

interface ActionData {
  userId?: User["id"];
  username?: string;
  password?: string;
  mfaEnabled?: User["mfaEnabled"];
  mfaSecret?: User["mfaSecret"];
  mfaUrl?: string;
  errors?: {
    username?: string;
    password?: string;
    verificationCode?: string;
  };
}

// Second, we need to export an action function, here we will use the
// `authenticator.authenticate method`
export async function action({ request }: ActionFunctionArgs) {
  const formData = await request.formData();
  const remember = formData.get("remember");
  const _action = (formData.get("_action") as string) ?? "";

  switch (_action) {
    case "login":
      const username = (formData.get("username") as string) ?? "";
      const password = (formData.get("password") as string) ?? "";
      if (!validateUsername(username)) {
        return json<ActionData>({ errors: { username: "Username is invalid" } }, { status: 400 });
      }

      if (!validatePassword(password)) {
        return json<ActionData>({ errors: { password: "Password is invalid" } }, { status: 400 });
      }

      const user = await verifyLogin(username, password);

      if (!user) {
        return json<ActionData>({ errors: { password: "Invalid username or password" } }, { status: 400 });
      }

      if (user.mfaEnabled) {
        // MFA is enabled
        return json<ActionData>({
          userId: user.id,
          mfaEnabled: user.mfaEnabled,
        });
      }

      const generatedSecret = speakeasy.generateSecret({
        name: user.username,
        issuer: "Template MFA", // TODO: Change this to the name of your app
      });

      return json<ActionData>({
        userId: user.id,
        mfaEnabled: user.mfaEnabled,
        mfaSecret: generatedSecret.base32,
        mfaUrl: generatedSecret.otpauth_url ?? "",
      });

    // Verify the submitted verification code along with the challenge
    case "verify":
      // const { authenticationCode, userId, mfaSecret, mfaUrl } = values;
      const authenticationCode = (formData.get("authenticationCode") as string) ?? "";
      let mfaSecret = (formData.get("mfaSecret") as string) ?? "";
      const userId = (formData.get("userId") as string) ?? "";
      const mfaEnabled = (formData.get("mfaEnabled") as string) === "true";
      const mfaUrl = (formData.get("mfaUrl") as string) ?? "";
      if (mfaEnabled) {
        // MFA is not enabled
        const user = await getUserById(userId);
        if (!user) {
          return json<ActionData>({ errors: { verificationCode: "User not found" } }, { status: 400 });
        }
        mfaSecret = user.mfaSecret ?? "";
      }
      const verified = speakeasy.totp.verify({
        secret: mfaSecret,
        encoding: "base32",
        token: authenticationCode,
      });
      if (!verified) {
        return json<ActionData>(
          {
            userId: userId,
            mfaEnabled: mfaEnabled,
            mfaSecret: mfaSecret,
            mfaUrl: mfaUrl,
            errors: {
              verificationCode: `Invalid verification code`,
            },
          },
          { status: 400 }
        );
      }
      const updatedUser = await enrollAuthenticationFactor(userId, {
        mfaEnabled: true,
        mfaSecret: mfaSecret,
      });
      if (!updatedUser) {
        return json<ActionData>({ errors: { verificationCode: "Failed to enroll in MFA" } }, { status: 500 });
      }

      return createUserSession({
        request,
        userId: updatedUser.id,
        remember: remember === "on",
        redirectTo: "/",
      });
  }
}

// Finally, we can export a loader function where we check if the user is
// authenticated with `authenticator.isAuthenticated` and redirect to the
// dashboard if it is or return null if it's not
export async function loader({ request }: LoaderFunctionArgs) {
  // If the user is already authenticated redirect to /dashboard directly
  // return await authenticator.isAuthenticated(request, {
  //   successRedirect: "/dashboard",
  // });
  const userId = await getUserId(request);
  if (userId) return redirect("/");
  return json({});
}

function LoginForm() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;
  const navigation = useNavigation();
  return (
    <Form className='flex max-w-md flex-col gap-4' method='post'>
      <Card className='min-w-[400px]'>
        <CardHeader>
          <CardTitle>Login</CardTitle>
          <CardDescription>Login to your account</CardDescription>
        </CardHeader>
        <CardContent>
          <Input type='hidden' name='_action' value='login' />
          <div>
            <div className='mb-2 block'>
              <Label htmlFor='username' className='font-bold'>
                Username
              </Label>
            </div>
            <Input id='username' name='username' type='text' autoComplete='username' required />
            {errors?.username && (
              <p className='pt-1 text-destructive' id='username-error'>
                {errors?.username}
              </p>
            )}
          </div>
          <div>
            <div className='mb-2 block'>
              <Label htmlFor='password' className='font-bold'>
                Password
              </Label>
            </div>
            <Input id='password' name='password' type='password' autoComplete='current-password' required />
            {errors?.password && (
              <p className='pt-1 text-destructive' id='password-error'>
                {errors?.password}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type='submit' isLoading={navigation.state === "submitting"} className='w-full'>
            Login
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}

function TwoFactorForm() {
  const actionData = useActionData<typeof action>();
  const errors = actionData?.errors;
  const userId = actionData?.userId;
  const mfaEnabled = actionData?.mfaEnabled ?? false;
  const mfaSecret = actionData?.mfaSecret ?? "";
  const mfaUrl = actionData?.mfaUrl ?? "";
  const navigation = useNavigation();
  const [authenticationCode, setAuthenticationCode] = useState<string>("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.focus();
    }
  }, []);
  const userAgent = navigator.userAgent.toLowerCase();
  const appleDevices = ["iphone", "ipad", "ipod", "mac"];
  const isApple = appleDevices.some(device => userAgent.includes(device));
  let googleAuthenticatorUrl = "https://play.google.com/store/apps/details?id=com.google.android.apps.authenticator2";
  if (isApple) {
    googleAuthenticatorUrl = "https://apps.apple.com/us/app/google-authenticator/id388497605";
  }

  return (
    <Form className='flex max-w-md flex-col gap-4' method='post'>
      <Input type='hidden' name='_action' value='verify' />
      <Input type='hidden' name='userId' value={userId} />
      <Input type='hidden' name='mfaSecret' value={mfaSecret} />
      <Input type='hidden' name='mfaEnabled' value={mfaEnabled.toString()} />
      <Input type='hidden' name='mfaUrl' value={mfaUrl} />
      <Input type='hidden' name='authenticationCode' value={authenticationCode} />
      <Card>
        <CardHeader>
          <CardTitle>Two Factor Authentication</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <span className='text-sm text-muted-foreground'>
              Authenticator apps and browser extensions like
              <ul>
                <li>
                  <a className='underline' href={googleAuthenticatorUrl} target='_blank' rel='noopener noreferrer'>
                    Google Authenticator
                  </a>
                </li>
                <li>
                  <a
                    className='underline'
                    href='https://support.1password.com/one-time-passwords/'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    1Password
                  </a>
                </li>
                <li>
                  <a
                    className='underline'
                    href='https://authy.com/guides/github/'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Authy
                  </a>
                </li>
                <li>
                  <a
                    className='underline'
                    href='https://www.microsoft.com/en-us/account/authenticator/'
                    target='_blank'
                    rel='noopener noreferrer'
                  >
                    Microsoft Authenticator
                  </a>
                </li>
              </ul>
              etc. generate one-time passwords that are used as a second factor to verify your identity when prompted
              during sign-in.
            </span>
          </div>
          {!mfaEnabled && (
            <>
              <div className='flex flex-col items-center mb-4'>
                <h5 className='text-lg font-bold'>Scan the QR code</h5>
                <div className='text-sm text-muted-foreground'>Use an authenticator app or browser extension to scan.</div>
              </div>
              <div className='flex justify-center mb-4'>
                <QRCodeSVG value={mfaUrl} size={212} className='p-4 bg-white' />
              </div>
            </>
          )}
          <div className='flex flex-col items-center justify-center mb-4'>
            <Label htmlFor='verification-code' className='mb-2'>
              Verify the code from the app
            </Label>
            <InputOTP
              maxLength={6}
              pattern={REGEXP_ONLY_DIGITS}
              className='m-4'
              onChange={value => setAuthenticationCode(value)}
              ref={inputRef}
              name='verification-code'
            >
              <InputOTPGroup className='flex justify-center'>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
            {errors?.verificationCode && navigation.state !== "submitting" && (
              <p className='pt-1 text-destructive' id='verification-code-error'>
                {errors?.verificationCode}
              </p>
            )}
          </div>
        </CardContent>
        <CardFooter>
          <Button type='submit' isLoading={navigation.state === "submitting"} disabled={navigation.state === "submitting"} className='w-full'>
            Verify
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
