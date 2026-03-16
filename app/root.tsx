import {
	Links,
	Meta,
	Outlet,
	Scripts,
	ScrollRestoration,
	useLoaderData,
} from "@remix-run/react"
import "./tailwind.css"
import type { LoaderFunctionArgs } from "@remix-run/node"
import { Toaster } from "~/components/ui/sonner"
import {
	PreventFlashOnWrongTheme,
	ThemeProvider,
	useTheme,
} from "~/lib/theme-provider"
import { getThemeSession } from "~/lib/theme.server"
import { cn } from "./lib/utils"
import { cookieSessionStorage, getSession, getUser } from "./services/session.server"

export async function loader({ request }: LoaderFunctionArgs) {
	const { session } = await getSession(request)
	const user = await getUser(request)
	const themeSession = await getThemeSession(request)
	return Response.json(
		{
			theme: themeSession.getTheme(),
			user,
		},
		{
			headers: {
				"Set-Cookie": await cookieSessionStorage.commitSession(session),
			},
		},
	)
}

export default function AppWithProviders() {
	const data = useLoaderData<typeof loader>()
	return (
		<ThemeProvider specifiedTheme={data.theme} themeAction="/action/set-theme">
			<App />
		</ThemeProvider>
	)
}

export function App() {
	const data = useLoaderData<typeof loader>()
	const { resolvedTheme } = useTheme()
	return (
		<html lang="en" className={cn(resolvedTheme)} suppressHydrationWarning>
			<head>
				<meta charSet="utf-8" />
				<meta name="viewport" content="width=device-width, initial-scale=1" />
				<Meta />
				<PreventFlashOnWrongTheme ssrTheme={Boolean(data.theme)} />
				<Links />
			</head>
			<body>
				<Outlet />
				<Toaster expand={true} richColors />
				<ScrollRestoration />
				<Scripts />
			</body>
		</html>
	)
}
