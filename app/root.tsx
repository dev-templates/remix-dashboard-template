import { Links, Meta, Outlet, Scripts, ScrollRestoration, useLoaderData } from "@remix-run/react";
import "./tailwind.css";
import { Toaster } from "~/components/ui/sonner";
import { cookieSessionStorage, getSession, getUser, themeSessionResolver } from "./services/session.server";
import { PreventFlashOnWrongTheme, ThemeProvider, useTheme } from "remix-themes";
import { json, LoaderFunctionArgs } from "@remix-run/node";
import { cn } from "./lib/utils";

export async function loader({ request }: LoaderFunctionArgs) {
  const { session } = await getSession(request);
  const user = await getUser(request);
  const { getTheme } = await themeSessionResolver(request);
  return json(
    {
      theme: getTheme(),
      user,
    },
    {
      headers: {
        "Set-Cookie": await cookieSessionStorage.commitSession(session),
      },
    }
  );
}

// Wrap your app with ThemeProvider.
// `specifiedTheme` is the stored theme in the session storage.
// `themeAction` is the action name that's used to change the theme in the session storage.
export default function AppWithProviders() {
  const data = useLoaderData<typeof loader>();
  return (
    <ThemeProvider specifiedTheme={data.theme} themeAction='/action/set-theme'>
      <App />
    </ThemeProvider>
  );
}

export function App() {
  const data = useLoaderData<typeof loader>();
  const [theme] = useTheme();
  return (
    <html lang='en' className={cn(theme)}>
      <head>
        <meta charSet='utf-8' />
        <meta name='viewport' content='width=device-width, initial-scale=1' />
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
  );
}
