import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

const updateAppointmentSchema = z.object({
  date: z.string().optional(),
  time: z.string().optional(),
  status: z.enum(["SCHEDULED", "CONFIRMED", "IN_PROGRESS", "COMPLETED", "CANCELLED", "NO_SHOW"]).optional(),
  notes: z.string().optional(),
  assignedUserId: z.string().optional(),
});

export async function PUT(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const appointmentId = params.id;

    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      console.error("[PUT /api/appointments/[id]] Auth error:", authResult.error);
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;
    console.log("[PUT /api/appointments/[id]] Updating appointment:", appointmentId, "for clinic:", clinic.id);

    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_APPOINTMENTS");
    if (permissionError) {
      console.error("[PUT /api/appointments/[id]] Permission error");
      return permissionError;
    }

    const json = await req.json();
    const parsed = updateAppointmentSchema.safeParse(json);
    if (!parsed.success) {
      console.error("[PUT /api/appointments/[id]] Validation error:", parsed.error.errors);
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;
    console.log("[PUT /api/appointments/[id]] Update data:", data);

    // Check if appointment exists and belongs to user's clinic
    const existingAppointment = await prisma.appointment.findFirst({
      where: {
        id: appointmentId,
        clinicId: clinic.id, // Correction: utiliser clinic.id au lieu de membership.clinicId
      },
      include: {
        service: true,
      },
    });

    if (!existingAppointment) {
      console.error("[PUT /api/appointments/[id]] Appointment not found:", appointmentId);
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    const updateData: any = {};
    
    if (data.status !== undefined) {
      updateData.status = data.status;
      console.log("[PUT /api/appointments/[id]] Updating status to:", data.status);
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
          clinicId: clinic.id,
          date: {
            gte: newDate,
            lt: new Date(newDate.getTime() + existingAppointment.service.duration * 60000),
          },
          status: {
            notIn: ["CANCELLED", "NO_SHOW"],
          },
          id: { not: appointmentId }, // Exclude current appointment
        },
      });

      if (conflict) {
        console.error("[PUT /api/appointments/[id]] Time slot conflict detected");
        return NextResponse.json({ error: "Time slot is already booked" }, { status: 409 });
      }

      updateData.date = newDate;
    }

    const appointment = await prisma.appointment.update({
      where: { id: appointmentId },
      data: updateData,
      include: {
        patient: true,
        service: true,
        assignedUser: true,
      },
    });

    console.log("[PUT /api/appointments/[id]] Appointment updated successfully");
    return NextResponse.json({ appointment });
  } catch (error: any) {
    console.error("[PUT /api/appointments/[id]] Error:", error);
    console.error("[PUT /api/appointments/[id]] Error message:", error.message);
    console.error("[PUT /api/appointments/[id]] Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: Request,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params;
    const appointmentId = params.id;

    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;

    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_APPOINTMENTS");
    if (permissionError) {
      return permissionError;
    }

    // Check if appointment exists and belongs to user's clinic
    const whereClause: any = {
      id: appointmentId,
      clinicId: clinic.id,
    };

    if (role === "DOCTOR") {
      whereClause.assignedUserId = userId;
    }

    const existingAppointment = await prisma.appointment.findFirst({
      where: whereClause,
    });

    if (!existingAppointment) {
      return NextResponse.json({ error: "Appointment not found" }, { status: 404 });
    }

    await prisma.appointment.delete({
      where: { id: appointmentId },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting appointment:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
