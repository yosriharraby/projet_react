import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

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
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId } = authResult;

    // Vérifier permission: Seul ADMIN peut créer des services
    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_SERVICES");
    if (permissionError) {
      return permissionError;
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
        clinicId: clinic.id,
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
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      console.error("[GET /api/services] Auth error:", authResult.error);
      return authResult.error;
    }

    const { clinic } = authResult;
    console.log("[GET /api/services] Fetching services for clinic:", clinic.id);

    const { searchParams } = new URL(req.url);
    const category = searchParams.get("category");
    const activeOnly = searchParams.get("activeOnly") === "true";

    const where = {
      clinicId: clinic.id,
      ...(category && { category }),
      ...(activeOnly && { isActive: true }),
    };

    console.log("[GET /api/services] Where clause:", where);

    const services = await prisma.service.findMany({
      where,
      orderBy: [
        { category: "asc" },
        { name: "asc" },
      ],
    });

    console.log("[GET /api/services] Services found:", services.length);

    return NextResponse.json({ services });
  } catch (error: any) {
    console.error("[GET /api/services] Error:", error);
    console.error("[GET /api/services] Error message:", error.message);
    console.error("[GET /api/services] Error stack:", error.stack);
    return NextResponse.json(
      { 
        error: "Server error",
        details: process.env.NODE_ENV === "development" ? error.message : undefined
      },
      { status: 500 }
    );
  }
}
