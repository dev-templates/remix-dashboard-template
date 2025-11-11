import type { LoaderFunctionArgs } from "@remix-run/node";
import { Outlet, redirect } from "@remix-run/react";
import Sidebar from "~/layouts/sidebar";
import { requireUser } from "~/services/session.server";

export async function loader({ request }: LoaderFunctionArgs) {
	const user = await requireUser(request);
	if (!user) {
		return redirect("/login");
	}
	return {
		id: user.id,
		username: user.username,
		role: {
			name: user.role.name,
		},
	};
}

export default function Layout() {
	return (
		<div className="flex h-screen">
			<Sidebar />
			<main className="flex-1 p-8">
				<Outlet />
			</main>
		</div>
	);
}
