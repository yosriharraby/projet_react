import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Récupérer les services d'une clinique
export async function GET(
  req: Request,
  { params }: { params: { clinicId: string } }
) {
  try {
    const { clinicId } = params;

    const services = await prisma.service.findMany({
      where: {
        clinicId,
        isActive: true,
      },
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("[GET /api/portal/clinics/[clinicId]/services] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

