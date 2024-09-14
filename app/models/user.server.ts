import type { Permission, Role, User } from "@prisma/client";
import bcrypt from "bcryptjs";
import { prisma } from "~/lib/prisma.server";
export type { User } from "@prisma/client";

export async function getUserById(userId: User["id"]) {
  return prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      username: true,
      mfaEnabled: true,
      mfaSecret: true,
      role: {
        select: {
          name: true,
          description: true,
          permissions: true,
        },
      },
    },
  });
}

export async function getUserByUsername(username: User["username"]) {
  return await prisma.user.findUnique({ where: { username } });
}

export async function getUserAuthFactors(userId: User["id"]) {
  return await prisma.user.findUnique({
    where: { id: userId },
    select: {
      mfaEnabled: true,
    },
  });
}

export async function deleteUser(userId: User["id"]) {
  return await prisma.user.delete({
    where: { id: userId },
  });
}

interface factors {
  mfaEnabled?: User["mfaEnabled"] | undefined;
  mfaSecret?: User["mfaSecret"] | undefined;
}

export async function enrollAuthenticationFactor(
  userId: User["id"],
  factors: factors = { mfaEnabled: undefined, mfaSecret: undefined }
) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      mfaEnabled: factors.mfaEnabled,
      mfaSecret: factors.mfaSecret,
    },
  });
}

export async function disable2FA(userId: User["id"]) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      mfaEnabled: false,
      mfaSecret: null,
    },
  });
}

export async function updateRole(userId: User["id"], roleName: User["roleName"]) {
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      roleName: roleName,
    },
  });
}

export async function updatePassword(userId: User["id"], currentPassword: string, newPassword: string) {
  const userWithPassword = await prisma.user.findUnique({
    where: {
      id: userId,
    },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(currentPassword, userWithPassword.password);

  if (!isValid) {
    return null;
  }

  const hashedPassword = await bcrypt.hash(newPassword, 10);

  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
}

export async function resetPassword(userId: User["id"], password: User["password"]) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.user.update({
    where: {
      id: userId,
    },
    data: {
      password: hashedPassword,
    },
  });
}
export async function createUser(username: User["username"], password: User["password"], roleName: User["roleName"]) {
  const hashedPassword = await bcrypt.hash(password, 10);
  return await prisma.user.create({
    data: {
      username,
      password: hashedPassword,
      roleName: roleName,
    },
  });
}

export async function verifyLogin(username: User["username"], password: User["password"]) {
  const userWithPassword = await prisma.user.findUnique({
    where: { username },
  });

  if (!userWithPassword || !userWithPassword.password) {
    return null;
  }

  const isValid = await bcrypt.compare(password, userWithPassword.password);

  if (!isValid) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const { password: _, ...userWithoutPassword } = userWithPassword;

  return userWithoutPassword;
}

export async function getUsers(page: number, pageSize: number) {
  const [count, users] = await Promise.all([
    prisma.user.count(),
    prisma.user.findMany({
      select: {
        id: true,
        username: true,
        mfaEnabled: true,
        role: {
          select: {
            name: true,
            description: true,
          },
        },
        createdAt: true,
        updatedAt: true,
      },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
  ]);
  const totalPages = Math.ceil(count / pageSize);
  return {
    users,
    metadata: {
      page,
      pageSize,
      totalItems: count,
      totalPages,
    },
  };
}

export async function requireUserPermission(userId: User["id"], permissionName: Permission["name"]) {
  const user = await getUserById(userId);
  if (!user) {
    return false;
  }
  const permission = user.role.permissions.find(permission => permission.permissionName === permissionName);
  if (permission) {
    return true;
  }
  return false;
}
