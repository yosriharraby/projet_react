import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

const createPatientSchema = z.object({
  firstName: z.string().min(1, "First name is required"),
  lastName: z.string().min(1, "Last name is required"),
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

export async function POST(req: Request) {
  try {
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      console.error("[POST /api/patients] Auth error - User not authenticated or no clinic membership");
      
      // Check the error response to determine the type of error
      const errorResponse = authResult.error;
      const clonedResponse = errorResponse.clone();
      
      try {
        const errorData = await clonedResponse.json();
        
        // Return a more descriptive error message based on the error type
        if (errorData.error === "Unauthorized") {
          return NextResponse.json(
            { error: "Vous devez être connecté pour créer un patient. Veuillez vous reconnecter." },
            { status: 401 }
          );
        } else if (errorData.error === "No clinic found") {
          return NextResponse.json(
            { error: "Aucune clinique trouvée. Vous devez être membre d'une clinique pour créer des patients. Si vous êtes ADMIN, créez d'abord une clinique ou ajoutez-vous à une clinique existante." },
            { status: 404 }
          );
        }
      } catch (e) {
        // If we can't parse the error, return the original error response
        console.error("[POST /api/patients] Could not parse error response:", e);
      }
      
      return authResult.error;
    }

    const { membership, clinic, userId } = authResult;
    console.log("[POST /api/patients] Creating patient for clinic:", clinic.id, "User:", userId, "Role:", membership.role);

    // Vérifier permission: Seuls ADMIN et RECEPTIONIST peuvent créer des patients
    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_PATIENTS");
    if (permissionError) {
      return permissionError;
    }

    const json = await req.json();
    const parsed = createPatientSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Check if email already exists in this clinic
    if (data.email && data.email.trim()) {
      const existingPatient = await prisma.patient.findFirst({
        where: {
          clinicId: clinic.id,
          email: data.email,
        },
      });

      if (existingPatient) {
        return NextResponse.json({ error: "Patient with this email already exists" }, { status: 409 });
      }
    }

    const patient = await prisma.patient.create({
      data: {
        firstName: data.firstName,
        lastName: data.lastName,
        email: data.email?.trim() || null,
        phone: data.phone || null,
        dateOfBirth: data.dateOfBirth ? new Date(data.dateOfBirth) : null,
        gender: data.gender || null,
        address: data.address || null,
        bloodType: data.bloodType || null,
        allergies: data.allergies || null,
        medications: data.medications || null,
        notes: data.notes || null,
        clinicId: clinic.id,
      },
    });

    return NextResponse.json({ patient });
  } catch (error) {
    console.error("Error creating patient:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      console.error("[GET /api/patients] Auth error - User not authenticated or no clinic membership");
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;
    console.log("[GET /api/patients] Fetching patients for clinic:", clinic.id, "User:", userId, "Role:", role);

    const { searchParams } = new URL(req.url);
    const search = searchParams.get("search");
    const page = parseInt(searchParams.get("page") || "1");
    const limit = parseInt(searchParams.get("limit") || "10");
    const skip = (page - 1) * limit;

    const where = {
      clinicId: clinic.id,
      ...(search && {
        OR: [
          { firstName: { contains: search, mode: "insensitive" as const } },
          { lastName: { contains: search, mode: "insensitive" as const } },
          { email: { contains: search, mode: "insensitive" as const } },
          { phone: { contains: search, mode: "insensitive" as const } },
        ],
      }),
    };

    console.log("[GET /api/patients] Where clause:", where);
    console.log("[GET /api/patients] Pagination:", { page, limit, skip });

    const [patients, total] = await Promise.all([
      prisma.patient.findMany({
        where,
        skip,
        take: limit,
        orderBy: { createdAt: "desc" },
      }),
      prisma.patient.count({ where }),
    ]);

    console.log("[GET /api/patients] Patients found:", patients.length, "out of", total);

    return NextResponse.json({
      patients,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error: any) {
    console.error("[GET /api/patients] Error:", error);
    console.error("[GET /api/patients] Error message:", error.message);
    console.error("[GET /api/patients] Error stack:", error.stack);
    
    // Check if it's a Prisma error
    if (error.code && error.code.startsWith("P")) {
      console.error("[GET /api/patients] Prisma error code:", error.code);
      return NextResponse.json(
        { 
          error: "Database error",
          details: process.env.NODE_ENV === "development" ? `Prisma error: ${error.code} - ${error.message}` : "Une erreur de base de données s'est produite."
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Server error",
        details: process.env.NODE_ENV === "development" ? error.message : "Une erreur serveur s'est produite. Veuillez réessayer plus tard."
      },
      { status: 500 }
    );
  }
}
