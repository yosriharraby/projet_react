import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

const updateServiceSchema = z.object({
  name: z.string().min(1, "Service name is required").optional(),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute").optional(),
  price: z.number().min(0, "Price must be non-negative").optional(),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

export async function PUT(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId } = authResult;

    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_SERVICES");
    if (permissionError) {
      return permissionError;
    }

    const json = await req.json();
    const parsed = updateServiceSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Check if service exists and belongs to user's clinic
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        clinicId: clinic.id,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description || null;
    if (data.duration !== undefined) updateData.duration = data.duration;
    if (data.price !== undefined) updateData.price = data.price;
    if (data.category !== undefined) updateData.category = data.category || null;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    const service = await prisma.service.update({
      where: { id: params.id },
      data: updateData,
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error updating service:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function DELETE(
  req: Request,
  { params }: { params: { id: string } }
) {
  try {
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId } = authResult;

    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_SERVICES");
    if (permissionError) {
      return permissionError;
    }

    // Check if service exists and belongs to user's clinic
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        clinicId: clinic.id,
      },
    });

    if (!existingService) {
      return NextResponse.json({ error: "Service not found" }, { status: 404 });
    }

    // Check if service has any appointments
    const appointmentCount = await prisma.appointment.count({
      where: { serviceId: params.id },
    });

    if (appointmentCount > 0) {
      // Instead of deleting, deactivate the service
      await prisma.service.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ success: true, message: "Service deactivated due to existing appointments" });
    }

    await prisma.service.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting service:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
