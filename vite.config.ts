import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, type Plugin, type UserConfig } from "vite";
import tailwindcss from "@tailwindcss/vite";

/**
 * Wraps an array of Vite plugins, intercepting their config() hooks
 * to convert deprecated `esbuild` options to `oxc` before Vite sees them.
 */
function patchEsbuildToOxc(plugins: Plugin[]): Plugin[] {
	return plugins.map((plugin) => {
		const originalConfig = plugin.config;
		if (!originalConfig) return plugin;

		plugin.config = async function (config, env) {
			const handler =
				typeof originalConfig === "function"
					? originalConfig
					: originalConfig.handler;
			const result = (await handler.call(this, config, env)) as
				| UserConfig
				| undefined;
			if (result?.esbuild) {
				const { jsx, jsxDev } = result.esbuild as {
					jsx?: string;
					jsxDev?: boolean;
				};
				result.oxc = {
					jsx:
						jsx === "automatic"
							? { runtime: "automatic", development: jsxDev }
							: undefined,
				};
				delete result.esbuild;
			}
			return result;
		};

		return plugin;
	});
}

function dbInitPlugin(): Plugin {
	let isInitialized = false;

	return {
		name: "db-init",
		async buildStart() {
			if (process.env.NODE_ENV !== "development") {
				return;
			}

			if (process.env.SKIP_DB_INIT === "true") {
				console.log("⏭️  Skipping database auto-initialization (SKIP_DB_INIT=true)");
				return;
			}

			if (isInitialized) {
				return;
			}

			isInitialized = true;

			console.log("🔍 Checking database status...");

			try {
				const { checkDatabaseStatus } = await import(
					"./app/lib/db-check.server"
				);
				const { runMigrationDev, runSeed } = await import(
					"./app/lib/db-migrate.server"
				);

				const status = await checkDatabaseStatus();

				if (!status.connected) {
					console.error("\n❌ Unable to connect to database");
					console.error("   Please check:");
					console.error("   1. .env file exists");
					console.error("   2. DATABASE_URL is configured correctly");
					console.error(
						"   3. Database service is running (if using PostgreSQL)\n",
					);
					throw new Error("Database connection failed");
				}

				if (!status.migrationsTableExists || status.isEmpty) {
					console.log("📦 Database needs initialization");
					await runMigrationDev();

					if (status.isEmpty) {
						await runSeed();
					}
				} else {
					console.log("✅ Database is ready");
				}
			} catch (error) {
				console.error("\n❌ Database initialization failed:", error);
				console.error("\nSuggestions:");
				console.error("   - Run manually: pnpm run migrate");
				console.error("   - Check error logs for troubleshooting");
				console.error(
					"   - To skip auto-initialization, set SKIP_DB_INIT=true\n",
				);
				throw error;
			}
		},
	};
}

export default defineConfig({
	plugins: [
		dbInitPlugin(),
		tailwindcss(),
		...patchEsbuildToOxc(
			remix({
				future: {
					v3_fetcherPersist: true,
					v3_relativeSplatPath: true,
					v3_throwAbortReason: true,
					v3_singleFetch: true,
				},
			}),
		),
	],
	resolve: {
		tsconfigPaths: true,
		// Ensure a single React instance across all dependencies.
		// Without this, Vite's dep optimizer may resolve React differently
		// for pre-bundled CJS packages (e.g. @radix-ui/*) vs application code,
		// causing "Invalid hook call" errors during hydration.
		dedupe: ["react", "react-dom", "react/jsx-runtime", "react/jsx-dev-runtime"],
	},
	ssr: {
		// Radix UI packages use CJS format without "type": "module".
		// Vite 8 externalizes all SSR dependencies by default, which causes
		// ESM/CJS interop issues (e.g. `React.useState` is null during SSR).
		// Bundling them into the SSR output resolves the problem.
		noExternal: [/^@radix-ui\//],
	},
});
