import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

const createPrescriptionSchema = z.object({
  appointmentId: z.string().optional(),
  patientId: z.string().min(1, "Patient is required"),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  medications: z.string().min(1, "Medications are required"),
  instructions: z.string().optional(),
  notes: z.string().optional(),
});

export async function POST(req: Request) {
  try {
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;

    // Vérifier permission: Seuls ADMIN et DOCTOR peuvent créer des prescriptions
    const permissionError = await requirePermission(userId, clinic.id, "CREATE_PRESCRIPTIONS");
    if (permissionError) {
      return permissionError;
    }

    const json = await req.json();
    const parsed = createPrescriptionSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid data", details: parsed.error.errors }, { status: 400 });
    }

    const data = parsed.data;

    // Vérifier que le patient appartient à la clinique
    const patient = await prisma.patient.findFirst({
      where: {
        id: data.patientId,
        clinicId: clinic.id,
      },
    });

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    // Si appointmentId fourni, vérifier qu'il existe et appartient au patient
    if (data.appointmentId) {
      const appointment = await prisma.appointment.findFirst({
        where: {
          id: data.appointmentId,
          patientId: data.patientId,
          clinicId: clinic.id,
        },
      });

      if (!appointment) {
        return NextResponse.json({ error: "Appointment not found or doesn't belong to this patient" }, { status: 404 });
      }
    }

    // Créer la prescription
    const prescription = await prisma.prescription.create({
      data: {
        appointmentId: data.appointmentId || null,
        patientId: data.patientId,
        clinicId: clinic.id,
        createdById: userId,
        diagnosis: data.diagnosis,
        medications: data.medications,
        instructions: data.instructions || null,
        notes: data.notes || null,
      },
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
    });

    return NextResponse.json({ prescription });
  } catch (error) {
    console.error("Error creating prescription:", error);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

export async function GET(req: Request) {
  try {
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      console.error("[GET /api/prescriptions] Auth error - User not authenticated or no clinic membership");
      
      // Try to extract error details for better error messages
      try {
        const errorResponse = authResult.error;
        const clonedResponse = errorResponse.clone();
        const errorData = await clonedResponse.json();
        
        if (errorData.error === "Unauthorized") {
          return NextResponse.json(
            { error: "Vous devez être connecté pour voir les ordonnances. Veuillez vous reconnecter." },
            { status: 401 }
          );
        } else if (errorData.error === "No clinic found") {
          return NextResponse.json(
            { error: "Aucune clinique trouvée. Vous devez être membre d'une clinique pour voir les ordonnances." },
            { status: 404 }
          );
        }
      } catch (e) {
        console.error("[GET /api/prescriptions] Could not parse error response:", e);
      }
      
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;
    console.log("[GET /api/prescriptions] Fetching prescriptions for clinic:", clinic.id, "User:", userId, "Role:", role);

    const { searchParams } = new URL(req.url);
    const patientId = searchParams.get("patientId");
    const appointmentId = searchParams.get("appointmentId");

    const where: any = {
      clinicId: clinic.id,
    };

    if (patientId) {
      where.patientId = patientId;
    }

    if (appointmentId) {
      where.appointmentId = appointmentId;
    }

    const prescriptions = await prisma.prescription.findMany({
      where,
      include: {
        patient: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            email: true,
            dateOfBirth: true,
          },
        },
        createdBy: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
        clinic: {
          select: {
            id: true,
            name: true,
            address: true,
            phone: true,
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    console.log("[GET /api/prescriptions] Prescriptions found:", prescriptions.length);
    return NextResponse.json({ prescriptions });
  } catch (error: any) {
    console.error("[GET /api/prescriptions] Error:", error);
    console.error("[GET /api/prescriptions] Error message:", error.message);
    console.error("[GET /api/prescriptions] Error stack:", error.stack);
    
    // Check if it's a Prisma error
    if (error.code && error.code.startsWith("P")) {
      console.error("[GET /api/prescriptions] Prisma error code:", error.code);
      return NextResponse.json(
        { 
          error: "Erreur de base de données",
          details: process.env.NODE_ENV === "development" ? `Prisma error: ${error.code} - ${error.message}` : "Une erreur de base de données s'est produite."
        },
        { status: 500 }
      );
    }
    
    return NextResponse.json(
      { 
        error: "Erreur serveur",
        details: process.env.NODE_ENV === "development" ? error.message : "Une erreur serveur s'est produite. Veuillez réessayer plus tard."
      },
      { status: 500 }
    );
  }
}

