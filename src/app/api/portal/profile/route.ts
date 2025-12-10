import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const updateProfileSchema = z.object({
  firstName: z.string().min(1, "Prénom requis"),
  lastName: z.string().min(1, "Nom requis"),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  address: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
});

// GET - Récupérer les informations du patient
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trouver le patient avec cet email
    const patient = await prisma.patient.findFirst({
      where: { email: session.user.email },
    });

    if (!patient) {
      return NextResponse.json({ patient: null });
    }

    return NextResponse.json({ patient });
  } catch (error: any) {
    console.error("[GET /api/portal/profile] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// PUT - Mettre à jour les informations du patient
export async function PUT(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = updateProfileSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const data = parsed.data;

    // Trouver le patient avec cet email
    const patient = await prisma.patient.findFirst({
      where: { email: session.user.email },
    });

    if (!patient) {
      return NextResponse.json(
        { error: "Patient non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier si l'email est déjà utilisé par un autre patient dans la même clinique
    if (data.email && data.email.trim() && data.email !== patient.email) {
      const existingPatient = await prisma.patient.findFirst({
        where: {
          clinicId: patient.clinicId,
          email: data.email,
          id: { not: patient.id },
        },
      });

      if (existingPatient) {
        return NextResponse.json(
          { error: "Cet email est déjà utilisé par un autre patient" },
          { status: 409 }
        );
      }
    }

    // Mettre à jour le patient
    const updatedPatient = await prisma.patient.update({
      where: { id: patient.id },
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email?.trim() || null,
        phone: data.phone || null,
        address: data.address || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
      },
    });

    return NextResponse.json({ patient: updatedPatient });
  } catch (error: any) {
    console.error("[PUT /api/portal/profile] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

