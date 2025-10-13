import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createAppointmentSchema = z.object({
  patientId: z.string().min(1, "Patient is required"),
  serviceId: z.string().min(1, "Service is required"),
  date: z.string().min(1, "Date is required"),
  time: z.string().min(1, "Time is required"),
  notes: z.string().optional(),
  assignedUserId: z.string().optional(),
});

export async function POST(req: Request) {
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
    const parsed = createAppointmentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Verify patient and service belong to the clinic
    const [patient, service] = await Promise.all([
      prisma.patient.findFirst({
        where: { id: data.patientId, clinicId: membership.clinicId },
      }),
      prisma.service.findFirst({
        where: { id: data.serviceId, clinicId: membership.clinicId, isActive: true },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found or inactive" }, { status: 404 });
    }

    // Create appointment datetime
    const appointmentDate = new Date(`${data.date}T${data.time}`);

    // Check for conflicts (overlapping appointments)
    const conflict = await prisma.appointment.findFirst({
      where: {
        clinicId: membership.clinicId,
        date: {
          gte: appointmentDate,
          lt: new Date(appointmentDate.getTime() + service.duration * 60000),
        },
        status: {
          notIn: ["CANCELLED", "NO_SHOW"],
        },
      },
    });

    if (conflict) {
      return NextResponse.json({ error: "Time slot is already booked" }, { status: 409 });
    }

    const appointment = await prisma.appointment.create({
      data: {
        date: appointmentDate,
        duration: service.duration,
        notes: data.notes || null,
        patientId: data.patientId,
        serviceId: data.serviceId,
        clinicId: membership.clinicId,
        assignedUserId: data.assignedUserId || null,
      },
      include: {
        patient: true,
        service: true,
        assignedUser: true,
      },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error creating appointment:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
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

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");

    const where = {
      clinicId: membership.clinicId,
      ...(date && {
        date: {
          gte: new Date(`${date}T00:00:00`),
          lt: new Date(`${date}T23:59:59`),
        },
      }),
      ...(status && { status: status as any }),
      ...(patientId && { patientId }),
    };

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        service: true,
        assignedUser: true,
      },
      orderBy: { date: "asc" },
    });

    return NextResponse.json({ appointments });
  } catch (error) {
    console.error("Error fetching appointments:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
