import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { z } from "zod";
import { prisma } from "@/lib/db";

const createClinicSchema = z.object({
  name: z.string().min(2, "Clinic name must be at least 2 characters"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = createClinicSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data" }, { status: 400 });
    }

    const { name, address, phone } = parsed.data;

    // Check if user already has any clinic memberships
    const existingMemberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
    });

    if (existingMemberships.length > 0) {
      return NextResponse.json({ error: "User already has clinic memberships" }, { status: 409 });
    }

    // Create clinic and assign user as admin
    const clinic = await prisma.clinic.create({
      data: {
        name,
        address,
        phone,
        ownerId: session.user.id,
        memberships: {
          create: {
            userId: session.user.id,
            role: "ADMIN",
          },
        },
      },
      include: {
        memberships: {
          include: {
            user: true,
          },
        },
      },
    });

    return NextResponse.json({ clinic });
  } catch (error) {
    console.error("Error creating clinic:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's clinic memberships
    const memberships = await prisma.membership.findMany({
      where: { userId: session.user.id },
      include: {
        clinic: true,
      },
    });

    return NextResponse.json({ memberships });
  } catch (error) {
    console.error("Error fetching memberships:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
