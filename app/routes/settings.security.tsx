import { Form, useActionData } from "@remix-run/react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "~/components/ui/card";
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "~/components/ui/dialog";
import { Button } from "~/components/ui/button";
import { ActionFunctionArgs, json, redirect } from "@remix-run/node";
import { logout, requireUserId } from "~/services/session.server";
import { disable2FA } from "~/models/user.server";
import ErrorMessage from "~/components/error-message";

interface ActionData {
  error?: string;
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
    return json<ActionData>({ error: "Failed to disable two-factor authentication" }, { status: 500 });
  }
  return logout(request);
}

export default function Security() {
  const actionData = useActionData<typeof action>();
  const error = actionData?.error;
  return (
    <Card>
      <CardHeader>
        <CardTitle>Two-factor authentication</CardTitle>
        <CardDescription>Manage your two-factor authentication settings.</CardDescription>
      </CardHeader>
      <CardContent>
        <div className='flex items-center justify-between'>
          <div className='flex flex-col space-y-2'>
            <div className='text-sm text-accent-foreground'>Your already configured two-factor authentication</div>
            {error && <ErrorMessage error={error} />}
            <Dialog>
              <DialogTrigger asChild>
                <Button variant='destructive'>Delete two-factor authentication</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Two-factor Delete confirmation</DialogTitle>
                </DialogHeader>
                <div className='flex flex-col space-y-2'>
                  <p>Are you sure you want to delete two-factor authentication?</p>
                  <p>You will be logout of current session, return to the login page.</p>
                </div>
                <DialogFooter>
                  <DialogClose asChild>
                    <Button type='button' variant='secondary'>
                      Cancel
                    </Button>
                  </DialogClose>
                  <Form method='post'>
                    <input type='hidden' name='_action' value='delete-two-factor' />
                    <Button type='submit' variant='destructive'>
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
