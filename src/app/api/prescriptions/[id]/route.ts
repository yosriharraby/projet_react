import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership } from "@/lib/role-check";

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic } = authResult;

    const prescription = await prisma.prescription.findFirst({
      where: {
        id: params.id,
        clinicId: clinic.id,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
            phone: true,
            address: true,
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
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    if (!prescription) {
      return NextResponse.json({ error: "Prescription not found" }, { status: 404 });
    }

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error("Error fetching prescription:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

