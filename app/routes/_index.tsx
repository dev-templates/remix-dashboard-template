import { type LoaderFunctionArgs, type MetaFunction, redirect } from "@remix-run/node";
import { getUserId } from "~/services/session.server";

export const meta: MetaFunction = () => {
	return [{ title: "Welcome" }];
};

export default function Index() {
	return (
		<div className="font-sans p-4">
			<h1 className="text-3xl">Welcome to ...</h1>
		</div>
	);
}

export async function loader({ request }: LoaderFunctionArgs) {
	const userId = await getUserId(request);
	if (userId) return redirect("/dashboard");
	return redirect("/login");
}
