import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";

// GET - Récupérer les ordonnances du patient
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const recent = searchParams.get("recent") === "true";

    // Trouver le(s) patient(s) avec cet email
    const patients = await prisma.patient.findMany({
      where: { email: session.user.email },
    });

    if (patients.length === 0) {
      return NextResponse.json({ prescriptions: [] });
    }

    // Récupérer toutes les ordonnances de ces patients
    const patientIds = patients.map(p => p.id);

    const prescriptions = await prisma.prescription.findMany({
      where: {
        patientId: { in: patientIds },
      },
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            name: true,
          },
        },
      },
      orderBy: {
        createdAt: "desc",
      },
      take: recent ? 5 : undefined,
    });

    return NextResponse.json({ prescriptions });
  } catch (error: any) {
    console.error("[GET /api/portal/prescriptions] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

