import { vitePlugin as remix } from "@remix-run/dev";
import { defineConfig, type Plugin } from "vite";
import tsconfigPaths from "vite-tsconfig-paths";
import tailwindcss from "@tailwindcss/vite";

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
		remix({
			future: {
				v3_fetcherPersist: true,
				v3_relativeSplatPath: true,
				v3_throwAbortReason: true,
				v3_singleFetch: true,
			},
		}),
		tsconfigPaths(),
	],
});
