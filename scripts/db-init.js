import { execSync } from "node:child_process";
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function checkConnection() {
	try {
		await prisma.$queryRaw`SELECT 1`;
		console.log("✅ Database connection successful");
		return true;
	} catch (error) {
		console.error("❌ Database connection failed:", error.message);
		return false;
	}
}

async function main() {
	console.log("🚀 Production database initialization...\n");

	const connected = await checkConnection();
	if (!connected) {
		console.error("\nPlease check:");
		console.error("  1. DATABASE_URL environment variable is correctly configured");
		console.error("  2. Database service is running");
		console.error("  3. Network connection is available\n");
		process.exit(1);
	}

	try {
		console.log("\n🔄 Deploying database migrations...");
		execSync("npx prisma migrate deploy", {
			stdio: "inherit",
			cwd: process.cwd(),
		});
		console.log("✅ Database migration deployment successful");
	} catch (error) {
		console.error("\n❌ Database migration failed:", error.message);
		process.exit(1);
	}

	if (process.env.SKIP_SEED !== "true") {
		try {
			console.log("\n🌱 Inserting seed data...");
			execSync("node prisma/seed.js", {
				stdio: "inherit",
				cwd: process.cwd(),
			});
			console.log("✅ Seed data insertion successful");
		} catch (error) {
			console.warn("\n⚠️  Seed data insertion failed (may already exist):", error.message);
		}
	} else {
		console.log("\n⏭️  Skipping seed data insertion (SKIP_SEED=true)");
	}

	console.log("\n🎉 Database initialization completed!\n");
	await prisma.$disconnect();
}

main().catch((error) => {
	console.error("\n💥 Error during initialization:", error);
	prisma.$disconnect();
	process.exit(1);
});
