import { zodResolver } from "@hookform/resolvers/zod";
import { CaretSortIcon, CheckIcon } from "@radix-ui/react-icons";
import type { LoaderFunctionArgs, MetaFunction } from "@remix-run/node";
import { redirect } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useEffect, useState } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { MdContentCopy, MdDelete, MdEdit, MdMoreVert, MdRefresh } from "react-icons/md";
import { TbAuth2Fa } from "react-icons/tb";
import { toast } from "sonner";
import { z } from "zod";
import { NumberPagination } from "~/components/number-pagination";
import { Button } from "~/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "~/components/ui/card";
import {
	Command,
	CommandEmpty,
	CommandGroup,
	CommandInput,
	CommandItem,
	CommandList,
} from "~/components/ui/command";
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
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from "~/components/ui/dropdown-menu";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "~/components/ui/form";
import { Input } from "~/components/ui/input";
import { Label } from "~/components/ui/label";
import { Popover, PopoverContent, PopoverTrigger } from "~/components/ui/popover";
import {
	Table,
	TableBody,
	TableCell,
	TableFooter,
	TableHead,
	TableHeader,
	TableRow,
} from "~/components/ui/table";
import { cn, formatDate } from "~/lib/utils";
import { getRoles } from "~/models/role.server";
import { getUsers, requireUserPermission } from "~/models/user.server";
import { getUserId } from "~/services/session.server";

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

function randomString(length: number) {
	const characters = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let result = "";
	for (let i = 0; i < length; i++) {
		result += characters.charAt(Math.floor(Math.random() * characters.length));
	}
	return result;
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request);
	if (!userId) {
		return redirect("/login");
	}
	if (!(await requireUserPermission(userId, "manage_users"))) {
		return redirect("/");
	}
	const url = new URL(request.url);
	const searchParams = new URLSearchParams(url.search);
	const page = Number(searchParams.get("page") || 1);
	const pageSize = Number(searchParams.get("pageSize") || 10);
	const [items, roles] = await Promise.all([getUsers(page, pageSize), getRoles()]);
	return { items: items, userId, roles };
}

interface SelectedUser {
	id: string;
	username: string;
	password?: string;
}

export default function AdminUsers() {
	const loaderData = useLoaderData<typeof loader>();
	const { items, userId, roles } = loaderData;
	const { users, metadata } = items;
	const page = metadata.page;
	const pageSize = metadata.pageSize;
	const totalPages = metadata.totalPages;

	const newUserFetcher = useFetcher<{
		success?: boolean;
		user?: { id: string; username: string };
		error?: string;
	}>();
	const deleteUserFetcher = useFetcher<{
		success?: boolean;
		user?: { id: string; username: string };
		error?: string;
	}>();
	const resetPasswordFetcher = useFetcher<{
		success?: boolean;
		user?: { id: string; username: string };
		error?: string;
	}>();
	const disable2FAFetcher = useFetcher<{
		success?: boolean;
		user?: { id: string; username: string };
		error?: string;
	}>();

	const [roleOpened, setRoleOpened] = useState(false);
	const [newUserDialogOpened, setNewUserDialogOpened] = useState(false);
	const [deleteUserState, setDeleteUserState] = useState<SelectedUser | null>(null);
	const [deleteTwoFactorUser, setDeleteTwoFactorUser] = useState<SelectedUser | null>(null);
	const [resetPasswordUser, setResetPasswordUser] = useState<SelectedUser | null>(null);

	const form = useForm<z.infer<typeof FormSchema>>({
		resolver: zodResolver(FormSchema),
		defaultValues: {
			username: "",
			password: "",
			role: "",
		},
	});

	useEffect(() => {
		if (newUserFetcher.state === "idle" && newUserFetcher.data) {
			if (newUserFetcher.data.error) {
				toast.error(newUserFetcher.data.error);
			} else if (newUserFetcher.data.user) {
				toast.success(`User ${newUserFetcher.data.user.username} created successfully`);
				setNewUserDialogOpened(false);
				form.reset();
			}
		}
	}, [newUserFetcher.state, newUserFetcher.data, form]);

	useEffect(() => {
		if (deleteUserFetcher.state === "idle" && deleteUserFetcher.data) {
			if (deleteUserFetcher.data.error) {
				toast.error(deleteUserFetcher.data.error);
			} else if (deleteUserFetcher.data.success && deleteUserFetcher.data.user) {
				toast.success(`User ${deleteUserFetcher.data.user.username} deleted successfully`);
				setDeleteUserState(null);
			}
		}
	}, [deleteUserFetcher.state, deleteUserFetcher.data]);

	useEffect(() => {
		if (resetPasswordFetcher.state === "idle" && resetPasswordFetcher.data) {
			if (resetPasswordFetcher.data.error) {
				toast.error(resetPasswordFetcher.data.error);
			} else if (resetPasswordFetcher.data.success && resetPasswordFetcher.data.user) {
				toast.success(
					`User ${resetPasswordFetcher.data.user.username} password reset successfully`,
				);
				setResetPasswordUser(null);
			}
		}
	}, [resetPasswordFetcher.state, resetPasswordFetcher.data]);

	useEffect(() => {
		if (disable2FAFetcher.state === "idle" && disable2FAFetcher.data) {
			if (disable2FAFetcher.data.error) {
				toast.error(disable2FAFetcher.data.error);
			} else if (disable2FAFetcher.data.success && disable2FAFetcher.data.user) {
				toast.success(
					`User ${disable2FAFetcher.data.user.username} two-factor authentication disabled successfully`,
				);
				setDeleteTwoFactorUser(null);
			}
		}
	}, [disable2FAFetcher.state, disable2FAFetcher.data]);

	function onSubmit(data: z.infer<typeof FormSchema>) {
		newUserFetcher.submit(data, {
			action: "/admin/users/new",
			method: "post",
		});
	}

	return (
		<div>
			<Card>
				<CardHeader>
					<div className="flex items-center justify-between">
						<CardTitle>Users</CardTitle>
						<Dialog open={newUserDialogOpened} onOpenChange={setNewUserDialogOpened} modal={true}>
							<DialogTrigger asChild>
								<Button type="button">Add User</Button>
							</DialogTrigger>
							<DialogContent>
								<DialogHeader>
									<DialogTitle>Add User</DialogTitle>
									<DialogDescription>Add a new user to the system.</DialogDescription>
								</DialogHeader>
								<FormProvider {...form}>
									<form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" method="post">
										<div className="flex flex-col space-y-1">
											<FormField
												control={form.control}
												name="username"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Username</FormLabel>
														<FormControl>
															<Input type="text" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="password"
												render={({ field }) => (
													<FormItem>
														<FormLabel>Password</FormLabel>
														<FormControl>
															<Input type="password" {...field} />
														</FormControl>
														<FormMessage />
													</FormItem>
												)}
											/>
											<FormField
												control={form.control}
												name="role"
												render={({ field }) => (
													<FormItem className="flex flex-col">
														<FormLabel>Role</FormLabel>
														<Popover open={roleOpened} onOpenChange={setRoleOpened}>
															<PopoverTrigger asChild>
																<FormControl>
																	<Button
																		variant="outline"
																		role="combobox"
																		className={cn("w-[200px] justify-between", {
																			"text-muted-foreground": !field.value,
																		})}
																	>
																		{field.value
																			? roles.find((role) => role.name === field.value)?.name
																			: "Select role"}
																		<CaretSortIcon className="ml-2 h-4 w-4 shrink-0 opacity-50" />
																	</Button>
																</FormControl>
															</PopoverTrigger>
															<PopoverContent className="w-[200px] p-0">
																<Command>
																	<CommandInput placeholder="Search role..." className="h-9" />
																	<CommandList>
																		<CommandEmpty>No role found.</CommandEmpty>
																		<CommandGroup>
																			{roles.map((role) => (
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
																							role.name === field.value
																								? "opacity-100"
																								: "opacity-0",
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
												<Button type="button" variant="secondary">
													Cancel
												</Button>
											</DialogClose>
											<Button
												type="submit"
												disabled={
													newUserFetcher.state === "submitting" ||
													newUserFetcher.state === "loading"
												}
											>
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
					<Table className="border rounded-md">
						<TableHeader>
							<TableRow>
								<TableHead>Name</TableHead>
								<TableHead>Role</TableHead>
								<TableHead>Created At</TableHead>
								<TableHead>
									<span className="sr-only">Actions</span>
								</TableHead>
							</TableRow>
						</TableHeader>
						<TableBody>
							{users.map((user) => (
								<TableRow key={user.id}>
									<TableCell>{user.username}</TableCell>
									<TableCell>{user.role.name}</TableCell>
									<TableCell>{formatDate(user.createdAt)}</TableCell>
									<TableCell className="text-right select-none">
										<DropdownMenu>
											<DropdownMenuTrigger asChild>
												<Button type="button" aria-haspopup="true" size="icon" variant="outline">
													<MdMoreVert className="h-4 w-4" />
													<span className="sr-only">Toggle menu</span>
												</Button>
											</DropdownMenuTrigger>
											<DropdownMenuContent align="end">
												<DropdownMenuItem
													disabled={user.id === userId}
													onClick={() =>
														setResetPasswordUser({
															id: user.id,
															username: user.username,
															password: randomString(8),
														})
													}
												>
													<MdEdit className="mr-2 h-4 w-4" />
													<span>Reset Password</span>
												</DropdownMenuItem>
												<DropdownMenuItem
													disabled={user.id === userId || !user.mfaEnabled}
													onClick={() =>
														setDeleteTwoFactorUser({ id: user.id, username: user.username })
													}
												>
													<TbAuth2Fa className="mr-2 h-4 w-4" />
													<span>Disable MFA</span>
												</DropdownMenuItem>
												<DropdownMenuSeparator />
												<DropdownMenuItem
													disabled={user.id === userId}
													onClick={() =>
														setDeleteUserState({ id: user.id, username: user.username })
													}
													className="text-destructive"
												>
													<MdDelete className="mr-2 h-4 w-4" />
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
									<NumberPagination
										totalPages={totalPages}
										page={page}
										pageSize={pageSize}
										defaultPageSize={10}
									/>
								</TableCell>
							</TableRow>
						</TableFooter>
					</Table>
				</CardContent>
			</Card>

			{deleteUserState && (
				<Dialog
					open={true}
					modal={true}
					onOpenChange={(opened) => {
						if (!opened) {
							setDeleteUserState(null);
						}
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Delete confirmation</DialogTitle>
							<DialogDescription>Delete user</DialogDescription>
						</DialogHeader>
						<div className="space-y-2">
							Are you sure you want to delete user{" "}
							<span className="font-bold">{deleteUserState.username}</span>?
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button type="button" variant="secondary">
									Cancel
								</Button>
							</DialogClose>
							<deleteUserFetcher.Form
								method="post"
								action={`/admin/users/${deleteUserState.id}/delete`}
							>
								<Button
									type="submit"
									variant="destructive"
									disabled={deleteUserFetcher.state === "submitting"}
								>
									Delete
								</Button>
							</deleteUserFetcher.Form>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{deleteTwoFactorUser && (
				<Dialog
					open={true}
					modal={true}
					onOpenChange={(opened) => {
						if (!opened) {
							setDeleteTwoFactorUser(null);
						}
					}}
				>
					<DialogContent>
						<DialogHeader>
							<DialogTitle>Two-factor Delete confirmation</DialogTitle>
							<DialogDescription>
								Delete two-factor authentication settings for user
							</DialogDescription>
						</DialogHeader>
						<div className="flex flex-col space-y-2">
							Are you sure you want to delete user{" "}
							<span className="font-bold">{deleteTwoFactorUser.username}</span> two-factor
							authentication settings?
						</div>
						<DialogFooter>
							<DialogClose asChild>
								<Button type="button" variant="secondary">
									Cancel
								</Button>
							</DialogClose>
							<disable2FAFetcher.Form
								method="post"
								action={`/admin/users/${deleteTwoFactorUser.id}/disable-2fa`}
							>
								<Button
									type="submit"
									variant="destructive"
									disabled={disable2FAFetcher.state === "submitting"}
								>
									Delete
								</Button>
							</disable2FAFetcher.Form>
						</DialogFooter>
					</DialogContent>
				</Dialog>
			)}

			{resetPasswordUser && (
				<Dialog
					open={true}
					modal={true}
					onOpenChange={(opened) => {
						if (!opened) {
							setResetPasswordUser(null);
						}
					}}
				>
					<DialogContent>
						<resetPasswordFetcher.Form
							method="post"
							action={`/admin/users/${resetPasswordUser.id}/reset-password`}
						>
							<DialogHeader>
								<DialogTitle>Reset password confirmation</DialogTitle>
								<DialogDescription>
									Password will be reset to a new random string.
								</DialogDescription>
							</DialogHeader>
							<div className="flex flex-col space-y-2 my-4">
								<Label>New Password</Label>
								<div className="flex flex-row space-x-2">
									<Input
										type="text"
										name="password"
										value={resetPasswordUser.password}
										onChange={(e) =>
											resetPasswordUser &&
											setResetPasswordUser({ ...resetPasswordUser, password: e.target.value })
										}
									/>
									<Button
										type="button"
										size="icon"
										onClick={() =>
											resetPasswordUser &&
											setResetPasswordUser({ ...resetPasswordUser, password: randomString(8) })
										}
										title="Generate new password"
									>
										<MdRefresh className="h-4 w-4" />
									</Button>
									<Button
										type="button"
										size="icon"
										onClick={() => {
											navigator.clipboard.writeText(resetPasswordUser.password || "");
											toast.success("Password copied to clipboard");
										}}
										title="Copy to clipboard"
									>
										<MdContentCopy className="h-4 w-4" />
									</Button>
								</div>
							</div>
							<DialogFooter>
								<DialogClose asChild>
									<Button type="button" variant="secondary">
										Cancel
									</Button>
								</DialogClose>
								<Button
									type="submit"
									variant="destructive"
									disabled={resetPasswordFetcher.state === "submitting"}
								>
									Reset Password
								</Button>
							</DialogFooter>
						</resetPasswordFetcher.Form>
					</DialogContent>
				</Dialog>
			)}
		</div>
	);
}
