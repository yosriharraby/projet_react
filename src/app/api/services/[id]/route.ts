import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { prisma } from "@/lib/db";

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
    const parsed = updateServiceSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Check if service exists and belongs to user's clinic
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        clinicId: membership.clinicId,
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

    // Check if service exists and belongs to user's clinic
    const existingService = await prisma.service.findFirst({
      where: {
        id: params.id,
        clinicId: membership.clinicId,
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
      const service = await prisma.service.update({
        where: { id: params.id },
        data: { isActive: false },
      });
      return NextResponse.json({ service, message: "Service deactivated due to existing appointments" });
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
