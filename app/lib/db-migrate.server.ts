import { execSync } from "node:child_process";
import { existsSync, readFileSync, unlinkSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const LOCK_FILE = join(process.cwd(), ".db-init.lock");
const LOCK_TIMEOUT = 120000;

function checkAndCleanLock(): boolean {
	if (!existsSync(LOCK_FILE)) {
		return false;
	}

	try {
		const lockContent = readFileSync(LOCK_FILE, "utf-8");
		const lockTime = Number.parseInt(lockContent.split(":")[1] || "0", 10);

		if (Date.now() - lockTime > LOCK_TIMEOUT) {
			console.log("⚠️  Detected expired lock file, cleaning up...");
			unlinkSync(LOCK_FILE);
			return false;
		}

		return true;
	} catch {
		unlinkSync(LOCK_FILE);
		return false;
	}
}

async function waitForLock(): Promise<void> {
	const startTime = Date.now();

	while (existsSync(LOCK_FILE)) {
		if (Date.now() - startTime > LOCK_TIMEOUT) {
			console.log("⚠️  Lock wait timeout, forcing continue...");
			unlinkSync(LOCK_FILE);
			break;
		}

		console.log("⏳ Waiting for other process to complete database initialization...");
		await new Promise((resolve) => setTimeout(resolve, 2000));
	}
}

function createLock(): void {
	writeFileSync(LOCK_FILE, `${process.pid}:${Date.now()}`);
}

function releaseLock(): void {
	if (existsSync(LOCK_FILE)) {
		unlinkSync(LOCK_FILE);
	}
}

export async function runMigrationDev(): Promise<void> {
	if (checkAndCleanLock()) {
		await waitForLock();
		return;
	}

	createLock();

	try {
		console.log("🔄 Applying database migrations...");

		execSync("npx prisma migrate dev", {
			stdio: "inherit",
			cwd: process.cwd(),
		});

		console.log("✅ Database migration completed");
	} catch (error) {
		console.error("❌ Database migration failed:", error);
		throw error;
	} finally {
		releaseLock();
	}
}

export async function runMigrationDeploy(): Promise<void> {
	if (checkAndCleanLock()) {
		await waitForLock();
		return;
	}

	createLock();

	try {
		console.log("🔄 Deploying database migrations...");

		execSync("npx prisma migrate deploy", {
			stdio: "inherit",
			cwd: process.cwd(),
		});

		console.log("✅ Database migration deployment completed");
	} catch (error) {
		console.error("❌ Database migration deployment failed:", error);
		throw error;
	} finally {
		releaseLock();
	}
}

export async function runSeed(): Promise<void> {
	if (process.env.SKIP_SEED === "true") {
		console.log("⏭️  Skipping seed data insertion (SKIP_SEED=true)");
		return;
	}

	try {
		console.log("🌱 Inserting seed data...");

		execSync("npx tsx prisma/seed.js", {
			stdio: "inherit",
			cwd: process.cwd(),
		});

		console.log("✅ Seed data insertion completed");
	} catch (error) {
		console.warn("⚠️  Seed data insertion failed (app can still continue):", error);
	}
}
