import {
	createContext,
	useCallback,
	useContext,
	useEffect,
	useMemo,
	useState,
} from "react"
import type { Theme } from "./theme.server"

type ThemeContextType = {
	theme: Theme | null
	setTheme: (theme: Theme | null) => void
	resolvedTheme: Theme | null
}

const ThemeContext = createContext<ThemeContextType | undefined>(undefined)

const prefersLightMQ = "(prefers-color-scheme: light)"

function getPreferredTheme(): Theme {
	return window.matchMedia(prefersLightMQ).matches ? "light" : "dark"
}

export function PreventFlashOnWrongTheme({
	ssrTheme,
}: { ssrTheme: boolean }) {
	const { resolvedTheme } = useTheme()

	return (
		<>
			<meta
				name="color-scheme"
				content={resolvedTheme === "dark" ? "dark light" : "light dark"}
			/>
			{ssrTheme ? null : (
				<script
					dangerouslySetInnerHTML={{
						__html: `
              (function() {
                var theme = window.matchMedia("(prefers-color-scheme: light)").matches ? "light" : "dark";
                var cl = document.documentElement.classList;
                if (!cl.contains("light") && !cl.contains("dark")) {
                  cl.add(theme);
                }
              })();
            `,
					}}
					suppressHydrationWarning
				/>
			)}
		</>
	)
}

export function ThemeProvider({
	children,
	specifiedTheme,
	themeAction = "/action/set-theme",
}: {
	children: React.ReactNode
	specifiedTheme: Theme | null
	themeAction?: string
}) {
	const [theme, setThemeState] = useState<Theme | null>(() => {
		if (specifiedTheme) return specifiedTheme
		if (typeof window !== "object") return null
		return getPreferredTheme()
	})

	const resolvedTheme =
		theme ?? (typeof window !== "undefined" ? getPreferredTheme() : null)

	useEffect(() => {
		if (theme !== null) return
		const mq = window.matchMedia(prefersLightMQ)
		const handler = () => setThemeState(null)
		mq.addEventListener("change", handler)
		return () => mq.removeEventListener("change", handler)
	}, [theme])

	const setTheme = useCallback(
		(newTheme: Theme | null) => {
			setThemeState(newTheme)
			fetch(themeAction, {
				method: "POST",
				body: JSON.stringify({ theme: newTheme }),
				headers: { "Content-Type": "application/json" },
			})
		},
		[themeAction],
	)

	const value = useMemo(
		() => ({ theme, setTheme, resolvedTheme }),
		[theme, setTheme, resolvedTheme],
	)

	return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
	const context = useContext(ThemeContext)
	if (!context) {
		throw new Error("useTheme must be used within a ThemeProvider")
	}
	return context
}
