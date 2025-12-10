import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

// GET - Rechercher un utilisateur par email
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

    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) {
      return NextResponse.json(
        { error: "Email requis" },
        { status: 400 }
      );
    }

    // Rechercher l'utilisateur
    const user = await prisma.user.findUnique({
      where: { email },
      select: {
        id: true,
        email: true,
        name: true,
        defaultRole: true,
      },
    });

    if (!user) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'utilisateur a déjà une membership dans cette clinique
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_clinicId: {
          userId: user.id,
          clinicId: clinic.id,
        },
      },
    });

    if (existingMembership) {
      return NextResponse.json(
        { error: "Cet utilisateur est déjà membre de cette clinique" },
        { status: 409 }
      );
    }

    return NextResponse.json({ user });
  } catch (error: any) {
    console.error("Error searching user:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

