import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Récupérer les médecins d'une clinique
export async function GET(
  req: Request,
  { params }: { params: { clinicId: string } }
) {
  try {
    const { clinicId } = params;

    const memberships = await prisma.membership.findMany({
      where: {
        clinicId,
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
    console.error("[GET /api/portal/clinics/[clinicId]/doctors] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

