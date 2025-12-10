import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

const updateClinicSchema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

// GET - Récupérer les informations de la clinique
export async function GET(req: Request) {
  try {
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;

    // Seul ADMIN peut configurer la clinique
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent configurer la clinique." },
        { status: 403 }
      );
    }

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Error fetching clinic:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

// PUT - Mettre à jour les informations de la clinique
export async function PUT(req: Request) {
  try {
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;

    // Seul ADMIN peut modifier la clinique
    if (role !== "ADMIN") {
      return NextResponse.json(
        { error: "Accès refusé. Seuls les administrateurs peuvent modifier la clinique." },
        { status: 403 }
      );
    }

    const json = await req.json();
    const parsed = updateClinicSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Mettre à jour la clinique
    const updatedClinic = await prisma.clinic.update({
      where: { id: clinic.id },
      data: {
        name: data.name,
        address: data.address || null,
        phone: data.phone || null,
      },
    });

    return NextResponse.json({ clinic: updatedClinic });
  } catch (error) {
    console.error("Error updating clinic:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

