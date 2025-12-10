import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

// DELETE - Retirer un membre du staff
export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
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

    const membershipId = params.id;

    // Vérifier que la membership existe et appartient à cette clinique
    const targetMembership = await prisma.membership.findFirst({
      where: {
        id: membershipId,
        clinicId: clinic.id,
        role: {
          in: ["DOCTOR", "RECEPTIONIST"],
        },
      },
      include: {
        user: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    });

    if (!targetMembership) {
      return NextResponse.json(
        { error: "Membership non trouvée" },
        { status: 404 }
      );
    }

    // Ne pas permettre de retirer l'admin principal
    if (targetMembership.userId === clinic.ownerId) {
      return NextResponse.json(
        { error: "Impossible de retirer le propriétaire de la clinique" },
        { status: 403 }
      );
    }

    // Supprimer la membership
    await prisma.membership.delete({
      where: { id: membershipId },
    });

    return NextResponse.json({
      success: true,
      message: `${targetMembership.user.name || targetMembership.user.email} a été retiré de la clinique`,
    });
  } catch (error: any) {
    console.error("Error removing staff:", error);
    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

