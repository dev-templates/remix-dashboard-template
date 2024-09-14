import { ActionFunctionArgs } from "@remix-run/node";
import { Form, json, MetaFunction, redirect, useActionData, useNavigation } from "@remix-run/react";
import ErrorMessage from "~/components/error-message";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "~/components/ui/card";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { updatePassword } from "~/models/user.server";
import { requireUserId } from "~/services/session.server";
import { toast } from "sonner";
import { useEffect, useState } from "react";
import { validatePassword } from "~/utils/validation.server";

export const meta: MetaFunction = () => {
  return [{ title: "Settings - Password" }];
};

interface ActionData {
  message?: string;
  errors?: {
    currentPassword?: string;
    newPassword?: string;
    confirmPassword?: string;
  };
}

export async function action({ request }: ActionFunctionArgs) {
  const userId = await requireUserId(request);
  if (!userId) {
    return redirect("/login");
  }
  const formData = await request.formData();
  const currentPassword = formData.get("currentPassword") as string;
  const newPassword = formData.get("newPassword") as string;
  const confirmPassword = formData.get("confirmPassword") as string;

  if (!validatePassword(currentPassword)) {
    return json<ActionData>({ errors: { currentPassword: "Invalid current password" } }, { status: 400 });
  }
  if (!validatePassword(newPassword)) {
    return json<ActionData>({ errors: { newPassword: "Invalid new password" } }, { status: 400 });
  }
  if (!validatePassword(confirmPassword)) {
    return json<ActionData>({ errors: { confirmPassword: "Invalid confirm password" } }, { status: 400 });
  }

  if (newPassword !== confirmPassword) {
    return json<ActionData>({ errors: { confirmPassword: "Passwords do not match" } }, { status: 400 });
  }

  const updatedUser = await updatePassword(userId, currentPassword, newPassword);
  if (!updatedUser) {
    return json<ActionData>({ errors: { currentPassword: "Current password is incorrect" } }, { status: 400 });
  }

  return json<ActionData>({ message: "Password changed successfully" }, { status: 200 });
}

export default function Password() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const message = actionData?.message;
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  useEffect(() => {
    if (navigation.state === "idle" && message) {
      toast.success(message);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    }
  }, [navigation.state, message]);

  const errors = actionData?.errors;
  return (
    <Form method='post'>
      <Card>
        <CardHeader>
          <CardTitle>Change Password</CardTitle>
        </CardHeader>
        <CardContent>
          <div className='mb-4'>
            <Label htmlFor='currentPassword' className='block text-sm font-medium'>
              Current Password
            </Label>
            <Input
              type='password'
              id='currentPassword'
              name='currentPassword'
              autoComplete='current-password'
              className='mt-1 block w-full'
              required
              value={currentPassword}
              onChange={e => setCurrentPassword(e.target.value)}
            />
            <ErrorMessage error={errors?.currentPassword} />
          </div>
          <div className='mb-4'>
            <Label htmlFor='newPassword' className='block text-sm font-medium'>
              New Password
            </Label>
            <Input
              type='password'
              id='newPassword'
              name='newPassword'
              className='mt-1 block w-full'
              required
              value={newPassword}
              onChange={e => setNewPassword(e.target.value)}
            />
            <ErrorMessage error={errors?.newPassword} />
          </div>
          <div className='mb-4'>
            <Label htmlFor='confirmPassword' className='block text-sm font-medium'>
              Confirm New Password
            </Label>
            <Input
              type='password'
              id='confirmPassword'
              name='confirmPassword'
              className='mt-1 block w-full'
              required
              value={confirmPassword}
              onChange={e => setConfirmPassword(e.target.value)}
            />
            <ErrorMessage error={errors?.confirmPassword} />
          </div>
        </CardContent>
        <CardFooter>
          <Button type='submit' isLoading={navigation.state === "loading"} disabled={navigation.state === "loading"}>
            Change Password
          </Button>
        </CardFooter>
      </Card>
    </Form>
  );
}
