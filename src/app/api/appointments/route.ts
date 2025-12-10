import { NextResponse } from "next/server";
import { z } from "zod";
import { prisma } from "@/lib/db";
import { requireAuthAndMembership, requirePermission } from "@/lib/role-check";

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
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;

    // Vérifier permission: ADMIN, RECEPTIONIST, DOCTOR peuvent créer des rendez-vous
    const permissionError = await requirePermission(userId, clinic.id, "MANAGE_APPOINTMENTS");
    if (permissionError) {
      return permissionError;
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
        where: { id: data.patientId, clinicId: clinic.id },
      }),
      prisma.service.findFirst({
        where: { id: data.serviceId, clinicId: clinic.id, isActive: true },
      }),
    ]);

    if (!patient) {
      return NextResponse.json({ error: "Patient not found" }, { status: 404 });
    }

    if (!service) {
      return NextResponse.json({ error: "Service not found or inactive" }, { status: 404 });
    }

    // Si DOCTOR, assigner automatiquement à lui-même si pas d'assignation
    let assignedUserId = data.assignedUserId || null;
    if (role === "DOCTOR" && !assignedUserId) {
      assignedUserId = userId;
    }

    // Create appointment datetime
    const appointmentDate = new Date(`${data.date}T${data.time}`);

    // Check for conflicts (overlapping appointments)
    const conflict = await prisma.appointment.findFirst({
      where: {
        clinicId: clinic.id,
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
        clinicId: clinic.id,
        assignedUserId: assignedUserId,
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
    // Vérifier authentification et membership
    const authResult = await requireAuthAndMembership();
    if ("error" in authResult) {
      console.error("[GET /api/appointments] Auth error - User not authenticated or no clinic membership");
      
      // Try to extract error details for better error messages
      try {
        const errorResponse = authResult.error;
        const clonedResponse = errorResponse.clone();
        const errorData = await clonedResponse.json();
        
        if (errorData.error === "Unauthorized") {
          return NextResponse.json(
            { error: "Vous devez être connecté pour voir les rendez-vous. Veuillez vous reconnecter." },
            { status: 401 }
          );
        } else if (errorData.error === "No clinic found") {
          return NextResponse.json(
            { error: "Aucune clinique trouvée. Vous devez être membre d'une clinique pour voir les rendez-vous." },
            { status: 404 }
          );
        }
      } catch (e) {
        console.error("[GET /api/appointments] Could not parse error response:", e);
      }
      
      return authResult.error;
    }

    const { clinic, userId, role } = authResult;
    console.log("[GET /api/appointments] Fetching appointments for clinic:", clinic.id, "User:", userId, "Role:", role);

    const { searchParams } = new URL(req.url);
    const date = searchParams.get("date");
    const status = searchParams.get("status");
    const patientId = searchParams.get("patientId");

    // Si DOCTOR, voir seulement ses propres rendez-vous
    const where: any = {
      clinicId: clinic.id,
    };

    // Les médecins voient seulement leurs rendez-vous assignés
    if (role === "DOCTOR") {
      where.assignedUserId = userId;
    }
    if (date) {
      where.date = {
        gte: new Date(`${date}T00:00:00`),
        lt: new Date(`${date}T23:59:59`),
      };
    }

    if (status) {
      where.status = status as any;
    }

    if (patientId) {
      where.patientId = patientId;
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: true,
        service: true,
        assignedUser: true,
      },
      orderBy: { date: "asc" },
    });

    console.log("[GET /api/appointments] Appointments found:", appointments.length);
    return NextResponse.json({ appointments });
  } catch (error: any) {
    console.error("[GET /api/appointments] Error:", error);
    console.error("[GET /api/appointments] Error message:", error.message);
    console.error("[GET /api/appointments] Error stack:", error.stack);
    
    // Check if it's a Prisma error
    if (error.code && error.code.startsWith("P")) {
      console.error("[GET /api/appointments] Prisma error code:", error.code);
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
