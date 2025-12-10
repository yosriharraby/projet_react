import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// GET - Récupérer les médecins disponibles pour le patient
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Trouver le(s) patient(s) avec cet email pour obtenir leur(s) clinique(s)
    const patients = await prisma.patient.findMany({
      where: { email: session.user.email },
      select: {
        clinicId: true,
      },
    });

    if (patients.length === 0) {
      return NextResponse.json({ doctors: [] });
    }

    // Récupérer les médecins de ces cliniques
    const clinicIds = [...new Set(patients.map(p => p.clinicId))];

    const memberships = await prisma.membership.findMany({
      where: {
        clinicId: { in: clinicIds },
        role: "DOCTOR",
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
    });

    const doctors = memberships.map(m => ({
      id: m.user.id,
      name: m.user.name,
      email: m.user.email,
    }));

    return NextResponse.json({ doctors });
  } catch (error: any) {
    console.error("[GET /api/portal/doctors] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

