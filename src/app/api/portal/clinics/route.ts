import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

// GET - Récupérer toutes les cliniques disponibles
export async function GET(req: Request) {
  try {
    const clinics = await prisma.clinic.findMany({
      select: {
        id: true,
        name: true,
        address: true,
        phone: true,
      },
      orderBy: {
        name: "asc",
      },
    });

    return NextResponse.json({ clinics });
  } catch (error: any) {
    console.error("[GET /api/portal/clinics] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

