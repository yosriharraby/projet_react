import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createServiceSchema = z.object({
  name: z.string().min(1, "Service name is required"),
  description: z.string().optional(),
  duration: z.number().min(1, "Duration must be at least 1 minute"),
  price: z.number().min(0, "Price must be non-negative"),
  category: z.string().optional(),
  isActive: z.boolean().optional().default(true),
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
    const parsed = createServiceSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    const service = await prisma.service.create({
      data: {
        name: data.name,
        description: data.description || null,
        duration: data.duration,
        price: data.price,
        category: data.category || null,
        isActive: data.isActive,
        clinicId: membership.clinicId,
      },
    });

    return NextResponse.json({ service });
  } catch (error) {
    console.error("Error creating service:", error);
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
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where = {
      clinicId: membership.clinicId,
      ...(category && { category }),
      ...(activeOnly && { isActive: true }),
    };

    const services = await prisma.service.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    return NextResponse.json({ services });
  } catch (error) {
    console.error("Error fetching services:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
