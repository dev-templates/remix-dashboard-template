import type { SystemSettings } from "@prisma/client";
import { prisma } from "~/lib/prisma.server";

export type { SystemSettings } from "@prisma/client";

/**
 * Get a single system setting value
 * @param key The setting key
 * @returns The setting value, or null if not found
 */
export async function getSystemSetting(key: SystemSettings["key"]): Promise<string | null> {
	const setting = await prisma.systemSettings.findUnique({
		where: { key },
		select: { value: true },
	});
	return setting?.value ?? null;
}

/**
 * Get system setting as boolean
 * @param key The setting key
 * @returns Boolean value, returns false if not found or cannot be parsed
 */
export async function getSystemSettingAsBoolean(key: SystemSettings["key"]): Promise<boolean> {
	const value = await getSystemSetting(key);
	return value === "true";
}

/**
 * Get all system settings
 * @returns Array of all system settings
 */
export async function getAllSystemSettings(): Promise<SystemSettings[]> {
	return await prisma.systemSettings.findMany({
		orderBy: { key: "asc" },
	});
}

/**
 * Update or create system setting
 * @param key The setting key
 * @param value The setting value
 * @param description Optional setting description
 * @returns The updated or created system setting
 */
export async function updateSystemSetting(
	key: SystemSettings["key"],
	value: string,
	description?: string,
): Promise<SystemSettings> {
	return await prisma.systemSettings.upsert({
		where: { key },
		update: {
			value,
			...(description !== undefined && { description }),
		},
		create: {
			key,
			value,
			description,
		},
	});
}
