import cluster from "node:cluster";
import { execSync } from "node:child_process";
import os from "node:os";
import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";
import { createRequestHandler } from "@remix-run/node";

const PORT = Number(process.env.PORT) || 3000;
const HOST = process.env.HOST || "0.0.0.0";
const isProduction = process.env.NODE_ENV === "production";

// Detect PM2 cluster mode to avoid double-forking
const isPM2 = "NODE_APP_INSTANCE" in process.env;
const isPM2Primary = process.env.NODE_APP_INSTANCE === "0";
const useCluster = isProduction && !isPM2;

async function initDatabase() {
	const { PrismaClient } = await import("./app/generated/prisma/client");
	const { PrismaBetterSqlite3 } = await import(
		"@prisma/adapter-better-sqlite3"
	);

	const adapter = new PrismaBetterSqlite3({
		url: process.env.DATABASE_URL ?? "file:./dev.db",
	});
	const prisma = new PrismaClient({ adapter });

	try {
		// Verify connection
		await prisma.$queryRaw`SELECT 1`;
	} catch {
		console.error(
			"❌ Database connection failed. Check DATABASE_URL and database service.",
		);
		await prisma.$disconnect();
		process.exit(1);
	}

	try {
		// prisma migrate deploy has built-in advisory lock — safe for concurrent execution
		console.log("🔄 Checking database migrations...");
		execSync("npx prisma migrate deploy", {
			stdio: "inherit",
			cwd: process.cwd(),
		});
	} catch (error) {
		console.error("❌ Database migration failed:", error);
		await prisma.$disconnect();
		process.exit(1);
	}

	try {
		// Seed only if database is empty (upsert-based seed is idempotent)
		const userCount = await prisma.user.count();
		if (userCount === 0) {
			console.log("🌱 Seeding database...");
			execSync("npx tsx prisma/seed.js", {
				stdio: "inherit",
				cwd: process.cwd(),
			});
		}
	} catch {
		console.warn("⚠️  Seed check/execution failed (app can still continue)");
	}

	await prisma.$disconnect();
	console.log("✅ Database is ready");
}

async function startServer() {
	const app = new Hono();

	// Versioned assets — immutable, long-term cache
	app.use(
		"/assets/*",
		serveStatic({
			root: "./build/client",
			onFound(_path, c) {
				c.header("Cache-Control", "public, max-age=31536000, immutable");
			},
		}),
	);

	// Other static files (favicon, robots.txt, etc.) — short cache
	app.use(
		"/*",
		serveStatic({
			root: "./build/client",
			onFound(_path, c) {
				c.header("Cache-Control", "public, max-age=3600");
			},
		}),
	);

	// Remix request handler
	const build = await import("./build/server/index.js" as string);
	const handler = createRequestHandler(build, process.env.NODE_ENV);

	app.all("*", async (c) => {
		return handler(c.req.raw);
	});

	serve({ fetch: app.fetch, hostname: HOST, port: PORT }, () => {
		console.log(`[worker ${process.pid}] http://${HOST}:${PORT}`);
	});
}

// --- Entrypoint ---

if (useCluster && cluster.isPrimary) {
	// Native cluster mode: primary handles DB init, then forks workers
	await initDatabase();

	const numWorkers = os.availableParallelism?.() ?? os.cpus().length;
	console.log(`🚀 Forking ${numWorkers} workers...`);

	for (let i = 0; i < numWorkers; i++) {
		cluster.fork();
	}

	cluster.on("exit", (worker, code) => {
		if (code !== 0) {
			console.log(
				`Worker ${worker.process.pid} exited (code: ${code}), restarting...`,
			);
			cluster.fork();
		}
	});
} else {
	// Single process, PM2 cluster, or native cluster worker
	if (!useCluster) {
		// PM2 cluster: only instance 0 runs init (others skip, prisma lock + upsert ensure safety)
		if (!isPM2 || isPM2Primary) {
			await initDatabase();
		}
	}

	await startServer();
}
