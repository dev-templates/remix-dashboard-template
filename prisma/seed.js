import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
	console.log("🌱 Seeding database...");

	const adminRole = await prisma.role.upsert({
		where: { name: "admin" },
		update: {
			description: "Administrator with full access",
		},
		create: {
			name: "admin",
			description: "Administrator with full access",
		},
	});
	console.log("✓ Created/updated role: admin");

	const editorRole = await prisma.role.upsert({
		where: { name: "editor" },
		update: {
			description: "Can create and edit content",
		},
		create: {
			name: "editor",
			description: "Can create and edit content",
		},
	});
	console.log("✓ Created/updated role: editor");

	await prisma.role.upsert({
		where: { name: "user" },
		update: {
			description: "Regular user with limited access",
		},
		create: {
			name: "user",
			description: "Regular user with limited access",
		},
	});
	console.log("✓ Created/updated role: user");

	const permissionCreatePost = await prisma.permission.upsert({
		where: { name: "create_post" },
		update: {
			description: "Can create new posts",
		},
		create: {
			name: "create_post",
			description: "Can create new posts",
		},
	});
	console.log("✓ Created/updated permission: create_post");

	const permissionEditPost = await prisma.permission.upsert({
		where: { name: "edit_post" },
		update: {
			description: "Can edit existing posts",
		},
		create: {
			name: "edit_post",
			description: "Can edit existing posts",
		},
	});
	console.log("✓ Created/updated permission: edit_post");

	const permissionDeletePost = await prisma.permission.upsert({
		where: { name: "delete_post" },
		update: {
			description: "Can delete posts",
		},
		create: {
			name: "delete_post",
			description: "Can delete posts",
		},
	});
	console.log("✓ Created/updated permission: delete_post");

	const permissionManageUsers = await prisma.permission.upsert({
		where: { name: "manage_users" },
		update: {
			description: "Can manage user accounts",
		},
		create: {
			name: "manage_users",
			description: "Can manage user accounts",
		},
	});
	console.log("✓ Created/updated permission: manage_users");

	const rolePermissions = [
		// Admin role permissions
		{ roleName: adminRole.name, permissionName: permissionCreatePost.name },
		{ roleName: adminRole.name, permissionName: permissionEditPost.name },
		{ roleName: adminRole.name, permissionName: permissionDeletePost.name },
		{ roleName: adminRole.name, permissionName: permissionManageUsers.name },
		// Editor role permissions
		{ roleName: editorRole.name, permissionName: permissionCreatePost.name },
		{ roleName: editorRole.name, permissionName: permissionEditPost.name },
	];

	for (const rp of rolePermissions) {
		await prisma.rolePermission.upsert({
			where: {
				roleName_permissionName: {
					roleName: rp.roleName,
					permissionName: rp.permissionName,
				},
			},
			update: {},
			create: rp,
		});
	}
	console.log("✓ Assigned role permissions");

	const hashedPassword = await bcrypt.hash("admin", 10);
	const existingAdmin = await prisma.user.findUnique({
		where: { username: "admin" },
	});

	if (!existingAdmin) {
		await prisma.user.create({
			data: {
				username: "admin",
				password: hashedPassword,
				roleName: adminRole.name,
			},
		});
		console.log("✓ Created default admin user (username: admin, password: admin)");
	} else {
		console.log("⏭️  Admin user already exists, skipping creation");
	}

	await prisma.systemSettings.upsert({
		where: { key: "require2FA" },
		update: {
			value: "false",
			description: "Whether to require all users to enable two-factor authentication",
		},
		create: {
			key: "require2FA",
			value: "false",
			description: "Whether to require all users to enable two-factor authentication",
		},
	});
	console.log("✓ Created/updated system setting: require2FA");

	console.log("✅ Database seeding completed successfully");
}

main()
	.catch((e) => {
		console.error(e);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});
