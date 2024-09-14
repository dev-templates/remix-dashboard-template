import { LoaderFunctionArgs } from "@remix-run/node";
import { json, Outlet, redirect, useLoaderData } from "@remix-run/react";
import Sidebar from "~/layouts/sidebar";
import { requireUser } from "~/services/session.server";
import { isAdmin, PublicUser } from '~/types/public-user';

export async function loader({ request }: LoaderFunctionArgs) {
  const user = await requireUser(request);
  if (!user || !isAdmin(user)) {
    return redirect("/login");
  }
  return json<PublicUser>({
    id: user.id,
    username: user.username,
    role: {
      name: user.role.name,
    },
  });
}

export default function Layout() {
  const user = useLoaderData<typeof loader>();
  return (
    <div className='flex h-screen bg-gray-100'>
      <Sidebar user={user} />
      <main className='flex-1 p-8'>
        <Outlet />
      </main>
    </div>
  );
}
