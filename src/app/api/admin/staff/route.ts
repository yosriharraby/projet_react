import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

// GET - Récupérer le staff de la clinique
export async function GET(req: Request) {
  try {
    console.log("[GET /api/admin/staff] Starting...");
    
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      console.error("[GET /api/admin/staff] Auth error:", authResult.error);
      return authResult.error;
    }

    const { membership, clinic, userId } = authResult;
    console.log("[GET /api/admin/staff] Auth successful:", { userId, clinicId: clinic.id, role: membership.role });

    // Vérifier que l'utilisateur est ADMIN
    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_STAFF");
    if (permissionError) {
      console.error("[GET /api/admin/staff] Permission error");
      return permissionError;
    }

    console.log("[GET /api/admin/staff] Fetching staff for clinic:", clinic.id);

    // Récupérer tous les membres du staff (DOCTOR et RECEPTIONIST)
    const staff = await prisma.membership.findMany({
      where: {
        clinicId: clinic.id,
        role: {
          in: ["DOCTOR", "RECEPTIONIST"],
        },
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            defaultRole: true,
          },
        },
      },
      // Trier par ID (ordre décroissant) - temporaire jusqu'à ce que createdAt soit ajouté
      orderBy: {
        id: "desc",
      },
    });

    console.log("[GET /api/admin/staff] Staff found:", staff.length, "members");

    return NextResponse.json({ staff });
  } catch (error: any) {
    console.error("[GET /api/admin/staff] Error:", error);
    console.error("[GET /api/admin/staff] Error stack:", error.stack);
    console.error("[GET /api/admin/staff] Error message:", error.message);
    console.error("[GET /api/admin/staff] Error code:", error.code);
    console.error("[GET /api/admin/staff] Error name:", error.name);
    
    // Gérer les erreurs Prisma spécifiques
    if (error.code === "P2001") {
      return NextResponse.json(
        { error: "Enregistrement non trouvé dans la base de données" },
        { status: 404 }
      );
    }
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Violation de contrainte unique" },
        { status: 409 }
      );
    }
    
    // Erreur générique avec détails en développement
    const errorResponse: any = { 
      error: "Erreur serveur lors du chargement du staff"
    };
    
    if (process.env.NODE_ENV === "development") {
      errorResponse.details = error.message;
      errorResponse.code = error.code;
      errorResponse.name = error.name;
    }
    
    return NextResponse.json(errorResponse, { status: 500 });
  }
}

// POST - Ajouter un membre au staff
export async function POST(req: Request) {
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

    const { userId: targetUserId, role } = await req.json();

    if (!targetUserId || !role) {
      return NextResponse.json(
        { error: "userId et role sont requis" },
        { status: 400 }
      );
    }

    if (!["DOCTOR", "RECEPTIONIST"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide. Doit être DOCTOR ou RECEPTIONIST" },
        { status: 400 }
      );
    }

    // Vérifier que l'utilisateur existe
    const targetUser = await prisma.user.findUnique({
      where: { id: targetUserId },
    });

    if (!targetUser) {
      return NextResponse.json(
        { error: "Utilisateur non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier que l'utilisateur n'a pas déjà une membership dans cette clinique
    const existingMembership = await prisma.membership.findUnique({
      where: {
        userId_clinicId: {
          userId: targetUserId,
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

    // Créer la membership
    const newMembership = await prisma.membership.create({
      data: {
        userId: targetUserId,
        clinicId: clinic.id,
        role: role as "DOCTOR" | "RECEPTIONIST",
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            defaultRole: true,
          },
        },
      },
    });

    return NextResponse.json({
      success: true,
      membership: newMembership,
      message: `${targetUser.name || targetUser.email} a été ajouté comme ${role === "DOCTOR" ? "médecin" : "réceptionniste"}`,
    });
  } catch (error: any) {
    console.error("Error adding staff:", error);
    
    if (error.code === "P2002") {
      return NextResponse.json(
        { error: "Cet utilisateur est déjà membre de cette clinique" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur" },
      { status: 500 }
    );
  }
}

