import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { prisma } from "@/lib/db";

const updateAppointmentSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  notes: z.string().optional(),
  assignedUserId: z.string().optional(),
});

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
    const parsed = updateAppointmentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Check if appointment exists and belongs to user's clinic
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        clinicId: membership.clinicId,
      },
      include: {
        service: true,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updateData: any = {};
    
    if (data.status !== undefined) {
      updateData.status = data.status;
    }
    
    if (data.notes !== undefined) {
      updateData.notes = data.notes || null;
    }
    
    if (data.assignedUserId !== undefined) {
      updateData.assignedUserId = data.assignedUserId || null;
    }

    // Handle date/time changes
    if (data.date && data.time) {
      const newDate = new Date(`${data.date}T${data.time}`);
      
      // Check for conflicts if date/time is being changed
      const conflict = await prisma.appointment.findFirst({
        where: {
          clinicId: membership.clinicId,
          date: {
            gte: newDate,
            lt: new Date(newDate.getTime() + existingAppointment.service.duration * 60000),
          },
          status: {
            notIn: ["CANCELLED", "NO_SHOW"],
          },
          id: { not: params.id }, // Exclude current appointment
        },
      });

      if (conflict) {
        return NextResponse.json({ error: "Time slot is already booked" }, { status: 409 });
      }

      updateData.date = newDate;
    }

    const appointment = await prisma.appointment.update({
      where: { id: params.id },
      data: updateData,
      include: {
        patient: true,
        service: true,
        assignedUser: true,
      },
    });

    return NextResponse.json({ appointment });
  } catch (error) {
    console.error("Error updating appointment:", error);
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

    // Check if appointment exists and belongs to user's clinic
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: params.id,
        clinicId: membership.clinicId,
      },
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
