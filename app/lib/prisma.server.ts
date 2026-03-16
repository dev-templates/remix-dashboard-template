import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

let prisma: PrismaClient;

declare global {
	var __db__: PrismaClient;
}

function createPrismaClient() {
	const adapter = new PrismaBetterSqlite3({
		url: process.env.DATABASE_URL ?? "file:./dev.db",
	});
	return new PrismaClient({ adapter });
}

if (process.env.NODE_ENV === "production") {
	prisma = createPrismaClient();
} else {
	if (!global.__db__) {
		global.__db__ = createPrismaClient();
	}
	prisma = global.__db__;
}

export { prisma };
