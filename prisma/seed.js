import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  // Create default roles
  const adminRole = await prisma.role.create({
    data: {
      name: "admin",
      description: "Administrator with full access",
    },
  });

  const editorRole = await prisma.role.create({
    data: {
      name: "editor",
      description: "Can create and edit content",
    },
  });

  await prisma.role.create({
    data: {
      name: "user",
      description: "Regular user with limited access",
    },
  });

  // Create default permissions
  const permissionCreatePost = await prisma.permission.create({
    data: {
      name: "create_post",
      description: "Can create new posts",
    },
  });

  const permissionEditPost = await prisma.permission.create({
    data: {
      name: "edit_post",
      description: "Can edit existing posts",
    },
  });

  const permissionDeletePost = await prisma.permission.create({
    data: {
      name: "delete_post",
      description: "Can delete posts",
    },
  });

  const permissionManageUsers = await prisma.permission.create({
    data: {
      name: "manage_users",
      description: "Can manage user accounts",
    },
  });

  // Assign permissions to roles
  await prisma.rolePermission.createMany({
    data: [
      // Admin role permissions
      { roleName: adminRole.name, permissionName: permissionCreatePost.name }, // create_post
      { roleName: adminRole.name, permissionName: permissionEditPost.name }, // edit_post
      { roleName: adminRole.name, permissionName: permissionDeletePost.name }, // delete_post
      { roleName: adminRole.name, permissionName: permissionManageUsers.name }, // manage_users

      // Editor role permissions
      { roleName: editorRole.name, permissionName: permissionCreatePost.name }, // create_post
      { roleName: editorRole.name, permissionName: permissionEditPost.name }, // edit_post

      // User role permissions
      // (no special permissions for regular users)
    ],
  });

  // Create default users
  const hashedPassword = await bcrypt.hash("admin", 10);
  await prisma.user.createMany({
    data: [
      {
        username: "admin",
        password: hashedPassword,
        roleName: adminRole.name,
      },
    ],
  });

  console.log("Seed data inserted successfully");
}

main()
  .catch(e => {
    console.error(e);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
