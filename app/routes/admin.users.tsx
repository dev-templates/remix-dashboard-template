import { ActionFunctionArgs, json, LoaderFunctionArgs, redirect } from "@remix-run/node";
import { Form, MetaFunction, useActionData, useLoaderData, useNavigation, useSubmit } from "@remix-run/react";
import { FormProvider, useForm } from "react-hook-form";
import { MdContentCopy, MdDelete, MdEdit, MdMoreVert, MdRefresh } from "react-icons/md";
import { TbAuth2Fa } from "react-icons/tb";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "~/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Table, TableBody, TableCell, TableFooter, TableHead, TableHeader, TableRow } from "~/components/ui/table";
import { cn, formatDate } from "~/lib/utils";
import { getRoles } from "~/models/role.server";
import { createUser, deleteUser, disable2FA, getUsers, requireUserPermission, resetPassword } from "~/models/user.server";
import { getUserId, requireUser } from "~/services/session.server";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from "~/components/ui/command";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import { useEffect, useState } from "react";
import { isAdmin } from "~/types/public-user";
import { NumberPagination } from "~/components/number-pagination";

export const meta: MetaFunction = () => {
  return [{ title: "Admin Users" }];
};

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
  action?: string;
  user?: {
    id: string;
    username: string;
  };
  error?: string;
}

function randomString(length: number) {
  const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  let result = "";
  for (let i = 0; i < length; i++) {
    result += characters.charAt(Math.floor(Math.random() * characters.length));
  }
  return result;
}

export async function action({ request }: ActionFunctionArgs) {
  const currentUser = await requireUser(request);
  if (!isAdmin(currentUser)) {
    return json<ActionData>({}, { status: 403 });
  }
  const formData = await request.formData();
  const _action = formData.get("_action");
  switch (_action) {
    case "delete-two-factor": {
      const userId = formData.get("userId") as string;
      try {
        const user = await disable2FA(userId);
        return json<ActionData>({
          action: _action,
          user: {
            id: user.id,
            username: user.username,
          },
        });
      } catch (error: any) {
        return json<ActionData>({
          action: _action,
          error: `Failed to disable two-factor authentication for user ${userId}`,
        });
      }
    }
    case "delete-user": {
      const userId = formData.get("userId") as string;
      try {
        const user = await deleteUser(userId);
        if (!user) {
          return json<ActionData>({
            action: _action,
            error: "User not found",
          });
        }
        return json<ActionData>({
          action: _action,
          user: {
            id: userId,
            username: user.username,
          },
        });
      } catch (error: any) {
        return json<ActionData>({
          action: _action,
          error: `Failed to delete user ${userId}`,
        });
      }
    }
    case "new-user": {
      const username = formData.get("username") as string;
      const password = formData.get("password") as string;
      const role = formData.get("role") as string;
      try {
        const user = await createUser(username, password, role);
        return json<ActionData>({
          action: _action,
          user: {
            id: user.id,
            username: user.username,
          },
        });
      } catch (error: any) {
        return json<ActionData>({
          action: _action,
          error: `Failed to create user ${username}. Maybe username already exists?`,
        });
      }
    }
    case "reset-password": {
      const userId = formData.get("userId") as string;
      const password = formData.get("password") as string;
      try {
        const user = await resetPassword(userId, password);
        return json<ActionData>({
          action: _action,
          user: {
            id: user.id,
            username: user.username,
          },
        });
      } catch (error: any) {
        return json<ActionData>({
          action: _action,
          error: `Failed to reset password for user ${userId}`,
        });
      }
    }
  }
  return json<ActionData>({});
}

export async function loader({ request }: LoaderFunctionArgs) {
  const userId = await getUserId(request);
  if (!userId) {
    return redirect('/login');
  }
  if (!await requireUserPermission(userId, 'manage_users')) {
    return redirect('/');
  }
  const url = new URL(request.url);
  const searchParams = new URLSearchParams(url.search);
  const page = Number(searchParams.get("page") || 1);
  const pageSize = Number(searchParams.get("pageSize") || 10);
  const [items, roles] = await Promise.all([getUsers(page, pageSize), getRoles()]);
  return json({ items: items, userId, roles });
}

interface SelectedUser {
  id: string;
  username: string;
  password?: string;
}

export default function AdminUsers() {
  const actionData = useActionData<typeof action>();
  const navigation = useNavigation();
  const _action = actionData?.action;
  const user = actionData?.user;
  const loaderData = useLoaderData<typeof loader>();
  const { items, userId, roles } = loaderData;
  const { users, metadata } = items;
  const page = metadata.page;
  const pageSize = metadata.pageSize;
  const totalPages = metadata.totalPages;
  const totalItems = metadata.totalItems;
  const [roleOpened, setRoleOpened] = useState(false);
  const [newUserDialogOpened, setNewUserDialogOpened] = useState(false);
  const submit = useSubmit();
  const [deleteUser, setDeleteUser] = useState<SelectedUser | null>(null);
  const [deleteTwoFactorUser, setDeleteTwoFactorUser] = useState<SelectedUser | null>(null);
  const [resetPasswordUser, setResetPasswordUser] = useState<SelectedUser | null>(null);
  useEffect(() => {
    if (navigation.state === "idle" && _action) {
      if (actionData?.error) {
        toast.error(actionData.error);
      } else {
        switch (_action) {
          case "new-user": {
            user?.username && toast.success(`User ${user.username} created successfully`);
            break;
          }
          case "delete-user": {
            toast.success(`User ${user?.username} deleted successfully`);
            break;
          }
          case "reset-password": {
            toast.success(`User ${user?.username} password reset successfully`);
            break;
          }
          case "delete-two-factor": {
            toast.success(`User ${user?.username} two-factor authentication disabled successfully`);
            break;
          }
        }
      }
    }
  }, [navigation.state, _action, user]);

  const form = useForm<z.infer<typeof FormSchema>>({
    resolver: zodResolver(FormSchema),
    defaultValues: {
      username: "",
      password: "",
      role: "",
    },
  });
  function onSubmit(data: z.infer<typeof FormSchema>) {
    submit(
      {
        _action: "new-user",
        ...data,
      },
      {
        action: "",
        method: "post",
        encType: "application/x-www-form-urlencoded",
        preventScrollReset: false,
        replace: false,
        relative: "route",
      }
    );
    setNewUserDialogOpened(false);
  }
  return (
    <div>
      <Card>
        <CardHeader>
          <div className='flex items-center justify-between'>
            <CardTitle>Users</CardTitle>
            <Dialog open={newUserDialogOpened} onOpenChange={setNewUserDialogOpened} modal={true}>
              <DialogTrigger asChild>
                <Button type='button'>Add User</Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add User</DialogTitle>
                  <DialogDescription>Add a new user to the system.</DialogDescription>
                </DialogHeader>
                <FormProvider {...form}>
                  <form onSubmit={form.handleSubmit(onSubmit)} className='space-y-6' method='post'>
                    <input type='hidden' name='_action' value='new-user' />
                    <div className='flex flex-col space-y-2'>
                      <FormField
                        control={form.control}
                        name='username'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Username</FormLabel>
                            <FormControl>
                              <Input type='text' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='password'
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Password</FormLabel>
                            <FormControl>
                              <Input type='password' {...field} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name='role'
                        render={({ field }) => (
                          <FormItem className='flex flex-col'>
                            <FormLabel>Role</FormLabel>
                            <Popover open={roleOpened} onOpenChange={setRoleOpened}>
                              <PopoverTrigger asChild>
                                <FormControl>
                                  <Button
                                    variant='outline'
                                    role='combobox'
                                    className={cn("w-[200px] justify-between", {
                                      "text-muted-foreground": !field.value,
                                    })}
                                  >
                                    {field.value ? roles.find(role => role.name === field.value)?.name : "Select role"}
                                    <CaretSortIcon className='ml-2 h-4 w-4 shrink-0 opacity-50' />
                                  </Button>
                                </FormControl>
                              </PopoverTrigger>
                              <PopoverContent className='w-[200px] p-0'>
                                <Command>
                                  <CommandInput placeholder='Search role...' className='h-9' />
                                  <CommandList>
                                    <CommandEmpty>No role found.</CommandEmpty>
                                    <CommandGroup>
                                      {roles.map(role => (
                                        <CommandItem
                                          value={role.name}
                                          key={role.name}
                                          onSelect={() => {
                                            form.setValue("role", role.name);
                                            setRoleOpened(false);
                                          }}
                                        >
                                          {role.name}
                                          <CheckIcon
                                            className={cn(
                                              "ml-auto h-4 w-4",
                                              role.name === field.value ? "opacity-100" : "opacity-0"
                                            )}
                                          />
                                        </CommandItem>
                                      ))}
                                    </CommandGroup>
                                  </CommandList>
                                </Command>
                              </PopoverContent>
                            </Popover>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <DialogClose asChild>
                        <Button type='button' variant='secondary'>
                          Cancel
                        </Button>
                      </DialogClose>
                      <Button type='submit' disabled={form.formState.isSubmitting}>
                        Add User
                      </Button>
                    </DialogFooter>
                  </form>
                </FormProvider>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          <Table className='border rounded-md'>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Created At</TableHead>
                <TableHead>
                  <span className='sr-only'>Actions</span>
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {users.map(user => (
                <TableRow key={user.id}>
                  <TableCell>{user.username}</TableCell>
                  <TableCell>{user.role.name}</TableCell>
                  <TableCell>{formatDate(user.createdAt)}</TableCell>
                  <TableCell className='text-right select-none'>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button type='button' aria-haspopup='true' size='icon' variant='outline'>
                          <MdMoreVert className='h-4 w-4' />
                          <span className='sr-only'>Toggle menu</span>
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align='end'>
                        <DropdownMenuItem
                          disabled={user.id === userId}
                          onClick={() =>
                            setResetPasswordUser({ id: user.id, username: user.username, password: randomString(8) })
                          }
                        >
                          <MdEdit className='mr-2 h-4 w-4' />
                          <span>Reset Password</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem
                          disabled={user.id === userId || !user.mfaEnabled}
                          onClick={() => setDeleteTwoFactorUser({ id: user.id, username: user.username })}
                        >
                          <TbAuth2Fa className='mr-2 h-4 w-4' />
                          <span>Disable MFA</span>
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem
                          disabled={user.id === userId}
                          onClick={() => setDeleteUser({ id: user.id, username: user.username })}
                          className='text-destructive'
                        >
                          <MdDelete className='mr-2 h-4 w-4' />
                          <span>Delete</span>
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
            <TableFooter>
              <TableRow>
                <TableCell colSpan={4}>
                  <NumberPagination totalPages={totalPages} page={page} />
                </TableCell>
              </TableRow>
            </TableFooter>
          </Table>
        </CardContent>
      </Card>

      {deleteUser && (
        <Dialog
          open={true}
          modal={true}
          onOpenChange={opened => {
            if (!opened) {
              setDeleteUser(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete confirmation</DialogTitle>
              <DialogDescription>Delete user</DialogDescription>
            </DialogHeader>
            <div className='space-y-2'>
              Are you sure you want to delete user <span className='font-bold'>{deleteUser.username}</span>?
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='secondary'>
                  Cancel
                </Button>
              </DialogClose>
              <Form method='post'>
                <input type='hidden' name='_action' value='delete-user' />
                <input type='hidden' name='userId' value={deleteUser.id} />
                <Button type='submit' variant='destructive' onClick={() => setDeleteUser(null)}>
                  Delete
                </Button>
              </Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {deleteTwoFactorUser && (
        <Dialog
          open={true}
          modal={true}
          onOpenChange={opened => {
            if (!opened) {
              setDeleteTwoFactorUser(null);
            }
          }}
        >
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Two-factor Delete confirmation</DialogTitle>
              <DialogDescription>Delete two-factor authentication settings for user</DialogDescription>
            </DialogHeader>
            <div className='flex flex-col space-y-2'>
              Are you sure you want to delete user <span className='font-bold'>{deleteTwoFactorUser.username}</span>{" "}
              two-factor authentication settings?
            </div>
            <DialogFooter>
              <DialogClose asChild>
                <Button type='button' variant='secondary'>
                  Cancel
                </Button>
              </DialogClose>
              <Form method='post'>
                <input type='hidden' name='_action' value='delete-two-factor' />
                <input type='hidden' name='userId' value={deleteTwoFactorUser.id} />
                <Button type='submit' variant='destructive' onClick={() => setDeleteTwoFactorUser(null)}>
                  Delete
                </Button>
              </Form>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}

      {resetPasswordUser && (
        <Dialog
          open={true}
          modal={true}
          onOpenChange={opened => {
            if (!opened) {
              setResetPasswordUser(null);
            }
          }}
        >
          <DialogContent>
            <Form method='post'>
              <input type='hidden' name='_action' value='reset-password' />
              <input type='hidden' name='userId' value={resetPasswordUser.id} />
              <DialogHeader>
                <DialogTitle>Reset password confirmation</DialogTitle>
                <DialogDescription>Password will be reset to a new random string.</DialogDescription>
              </DialogHeader>
              <div className='flex flex-col space-y-2 my-4'>
                <Label>New Password</Label>
                <div className='flex flex-row space-x-2'>
                  <Input
                    type='text'
                    name='password'
                    value={resetPasswordUser.password}
                    onChange={e =>
                      resetPasswordUser && setResetPasswordUser({ ...resetPasswordUser, password: e.target.value })
                    }
                  />
                  <Button
                    type='button'
                    size='icon'
                    onClick={() =>
                      resetPasswordUser && setResetPasswordUser({ ...resetPasswordUser, password: randomString(8) })
                    }
                    title='Generate new password'
                  >
                    <MdRefresh className='h-4 w-4' />
                  </Button>
                  <Button
                    type='button'
                    size='icon'
                    onClick={() => {
                      navigator.clipboard.writeText(resetPasswordUser.password || "");
                      toast.success("Password copied to clipboard");
                    }}
                    title='Copy to clipboard'
                  >
                    <MdContentCopy className='h-4 w-4' />
                  </Button>
                </div>
              </div>
              <DialogFooter>
                <DialogClose asChild>
                  <Button type='button' variant='secondary'>
                    Cancel
                  </Button>
                </DialogClose>
                <Button type='submit' variant='destructive' onClick={() => setResetPasswordUser(null)}>
                  Reset Password
                </Button>
              </DialogFooter>
            </Form>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
