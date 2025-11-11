import { prisma } from "./prisma.server";

export interface DatabaseStatus {
	connected: boolean;
	migrationsTableExists: boolean;
	hasPendingMigrations: boolean;
	isEmpty: boolean;
	error?: string;
}

export async function checkDatabaseConnection(): Promise<boolean> {
	try {
		await prisma.$queryRaw`SELECT 1`;
		return true;
	} catch (error) {
		console.error("Database connection failed:", error);
		return false;
	}
}

export async function checkMigrationTableExists(): Promise<boolean> {
	try {
		const result = await prisma.$queryRawUnsafe<Array<{ name: string }>>(
			"SELECT name FROM sqlite_master WHERE type='table' AND name='_prisma_migrations'",
		);
		return result.length > 0;
	} catch (error) {
		try {
			const result = await prisma.$queryRawUnsafe<Array<{ tablename: string }>>(
				"SELECT tablename FROM pg_tables WHERE tablename='_prisma_migrations'",
			);
			return result.length > 0;
		} catch (_pgError) {
			console.error("Failed to check migration table:", error);
			return false;
		}
	}
}

export async function isDatabaseEmpty(): Promise<boolean> {
	try {
		const userCount = await prisma.user.count();
		return userCount === 0;
	} catch (_error) {
		return true;
	}
}

export async function checkDatabaseStatus(): Promise<DatabaseStatus> {
	const status: DatabaseStatus = {
		connected: false,
		migrationsTableExists: false,
		hasPendingMigrations: false,
		isEmpty: false,
	};

	status.connected = await checkDatabaseConnection();
	if (!status.connected) {
		status.error = "Unable to connect to database";
		return status;
	}

	status.migrationsTableExists = await checkMigrationTableExists();
	status.isEmpty = await isDatabaseEmpty();

	return status;
}
