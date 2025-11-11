import { prisma } from "~/lib/prisma.server";

export async function getRoles() {
	return await prisma.role.findMany({
		select: {
			name: true,
			description: true,
			permissions: {
				select: {
					permission: true,
				},
			},
		},
	});
}
