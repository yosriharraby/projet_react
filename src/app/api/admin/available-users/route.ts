import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

// GET - Récupérer les utilisateurs disponibles (sans membership)
export async function GET(req: Request) {
  try {
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { membership, clinic, userId } = authResult;

    // Vérifier que l'utilisateur est ADMIN
    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_STAFF");
    if (permissionError) {
      return permissionError;
    }

    // Récupérer tous les utilisateurs qui ont un defaultRole DOCTOR ou RECEPTIONIST
    // et qui n'ont pas de membership dans cette clinique
    const allUsers = await prisma.user.findMany({
      where: {
        defaultRole: {
          in: ["DOCTOR", "RECEPTIONIST"],
        },
        memberships: {
          none: {
            clinicId: clinic.id,
          },
        },
      },
      select: {
        id: true,
        email: true,
        name: true,
        defaultRole: true,
      },
      orderBy: {
        createdAt: "desc",
      },
      take: 20, // Limiter à 20 résultats
    });

    return NextResponse.json({ users: allUsers });
  } catch (error: any) {
    console.error("Error fetching available users:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

