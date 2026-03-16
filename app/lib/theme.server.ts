import { createCookieSessionStorage } from "@remix-run/node"

export type Theme = "light" | "dark"

const themeStorage = createCookieSessionStorage({
	cookie: {
		name: "theme",
		secure: process.env.NODE_ENV === "production",
		secrets: [process.env.SESSION_SECRET || "e33b3bfc-4c8c-41a3-b6fc-83a9905b90c8"],
		sameSite: "lax",
		path: "/",
		httpOnly: true,
	},
})

export async function getThemeSession(request: Request) {
	const session = await themeStorage.getSession(request.headers.get("Cookie"))

	return {
		getTheme(): Theme | null {
			const theme = session.get("theme")
			if (theme === "light" || theme === "dark") return theme
			return null
		},
		setTheme(theme: Theme | null) {
			if (theme === null) {
				session.unset("theme")
			} else {
				session.set("theme", theme)
			}
		},
		commit() {
			return themeStorage.commitSession(session)
		},
	}
}
