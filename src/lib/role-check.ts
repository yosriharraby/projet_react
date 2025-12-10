import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { PERMISSIONS } from "./permissions";
import { NextResponse } from "next/server";
import { Role } from "../generated/prisma";

/**
 * Helper pour obtenir le rôle d'un utilisateur dans une clinique
 */
export async function getUserRole(userId: string, clinicId: string): Promise<Role | null> {
  const membership = await prisma.membership.findUnique({
    where: {
      userId_clinicId: {
        userId,
        clinicId,
      },
    },
  });

  return membership?.role || null;
}

/**
 * Helper pour obtenir le membership d'un utilisateur (première clinique trouvée)
 */
export async function getUserMembership(userId: string) {
  const membership = await prisma.membership.findFirst({
    where: { userId },
    include: { clinic: true },
  });

  return membership;
}

/**
 * Middleware pour vérifier que l'utilisateur a une des permissions requises
 * Retourne null si autorisé, ou une NextResponse avec erreur si non autorisé
 */
export async function requirePermission(
  userId: string,
  clinicId: string,
  permissionKey: keyof typeof PERMISSIONS
): Promise<NextResponse | null> {
  const role = await getUserRole(userId, clinicId);

  if (!role) {
    return NextResponse.json({ error: "No access to this clinic" }, { status: 403 });
  }

  const allowedRoles = PERMISSIONS[permissionKey];
  if (!allowedRoles.includes(role)) {
    return NextResponse.json(
      { error: "You don't have permission to perform this action" },
      { status: 403 }
    );
  }

  return null;
}

/**
 * Vérifie que l'utilisateur est authentifié et a accès à une clinique
 * Retourne { error: NextResponse } si erreur, sinon { membership, role, clinic }
 */
export async function requireAuthAndMembership() {
  const session = await getServerSession(authOptions as any);

  if (!session?.user?.id) {
    return { error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }

  const membership = await getUserMembership(session.user.id);

  if (!membership) {
    return { error: NextResponse.json({ error: "No clinic found" }, { status: 404 }) };
  }

  return {
    membership,
    role: membership.role,
    clinic: membership.clinic,
    userId: session.user.id,
  };
}

