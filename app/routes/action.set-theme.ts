import type { ActionFunctionArgs } from "@remix-run/node"
import { getThemeSession } from "~/lib/theme.server"

export async function action({ request }: ActionFunctionArgs) {
	const themeSession = await getThemeSession(request)
	const { theme } = await request.json()

	if (theme === "light" || theme === "dark") {
		themeSession.setTheme(theme)
	} else {
		themeSession.setTheme(null)
	}

	return Response.json(
		{ success: true },
		{ headers: { "Set-Cookie": await themeSession.commit() } },
	)
}
