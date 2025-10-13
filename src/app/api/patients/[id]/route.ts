import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { prisma } from "@/lib/db";

const updatePatientSchema = z.object({
  firstName: z.string().min(1, "First name is required").optional(),
  lastName: z.string().min(1, "Last name is required").optional(),
  email: z.string().email().optional().or(z.literal("")),
  phone: z.string().optional(),
  dateOfBirth: z.string().optional(),
  gender: z.string().optional(),
  address: z.string().optional(),
  bloodType: z.string().optional(),
  allergies: z.string().optional(),
  medications: z.string().optional(),
  notes: z.string().optional(),
});

export async function GET(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's clinic
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { clinic: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "No clinic found" }, { status: 404 });
    }

    const patient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        clinicId: membership.clinicId,
      },
      include: {
        appointments: {
          include: {
            service: true,
          },
          orderBy: { date: "desc" },
          take: 5,
        },
        medicalRecords: {
          orderBy: { date: "desc" },
          take: 5,
        },
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Error fetching patient:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's clinic
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { clinic: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "No clinic found" }, { status: 404 });
    }

    const json = await req.json();
    const parsed = updatePatientSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Check if patient exists and belongs to user's clinic
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        clinicId: membership.clinicId,
      },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Check if email already exists in this clinic (if email is being updated)
    if (data.email && data.email.trim() && data.email !== existingPatient.email) {
      const emailExists = await prisma.patient.findFirst({
        where: {
          clinicId: membership.clinicId,
          email: data.email,
          id: { not: params.id },
        },
      });

      if (emailExists) {
        return NextResponse.json({ error: "Patient with this email already exists" }, { status: 409 });
      }
    }

    const updateData: any = {};
    if (data.firstName !== undefined) updateData.firstName = data.firstName;
    if (data.lastName !== undefined) updateData.lastName = data.lastName;
    if (data.email !== undefined) updateData.email = data.email?.trim() || null;
    if (data.phone !== undefined) updateData.phone = data.phone || null;
    if (data.dateOfBirth !== undefined) updateData.dateOfBirth = data.dateOfBirth ? new Date(data.dateOfBirth) : null;
    if (data.gender !== undefined) updateData.gender = data.gender || null;
    if (data.address !== undefined) updateData.address = data.address || null;
    if (data.bloodType !== undefined) updateData.bloodType = data.bloodType || null;
    if (data.allergies !== undefined) updateData.allergies = data.allergies || null;
    if (data.medications !== undefined) updateData.medications = data.medications || null;
    if (data.notes !== undefined) updateData.notes = data.notes || null;

    const patient = await prisma.patient.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Error updating patient:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's clinic
    const membership = await prisma.membership.findFirst({
      where: { userId: session.user.id },
      include: { clinic: true },
    });

    if (!membership) {
      return NextResponse.json({ error: "No clinic found" }, { status: 404 });
    }

    // Check if patient exists and belongs to user's clinic
    const existingPatient = await prisma.patient.findFirst({
      where: {
        id: params.id,
        clinicId: membership.clinicId,
      },
    });

    if (!existingPatient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    await prisma.patient.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting patient:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
