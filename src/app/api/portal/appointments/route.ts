import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { z } from "zod";

const bookAppointmentSchema = z.object({
  clinicId: z.string().min(1, "Clinique requise"),
  serviceId: z.string().min(1, "Service requis"),
  doctorId: z.string().min(1, "Médecin requis"),
  dateTime: z.string().min(1, "Date et heure requises"),
  notes: z.string().optional(),
});

// GET - Récupérer les rendez-vous du patient
export async function GET(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const upcoming = searchParams.get("upcoming") === "true";
    const past = searchParams.get("past") === "true";

    // Trouver le(s) patient(s) avec cet email
    const patients = await prisma.patient.findMany({
      where: { email: session.user.email },
      include: {
        clinic: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (patients.length === 0) {
      return NextResponse.json({ appointments: [] });
    }

    // Récupérer tous les rendez-vous de ces patients
    const patientIds = patients.map(p => p.id);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const where: any = {
      patientId: { in: patientIds },
    };

    if (upcoming) {
      where.date = { gte: today };
      where.status = { notIn: ["CANCELLED", "NO_SHOW"] };
    } else if (past) {
      where.date = { lt: today };
    }

    const appointments = await prisma.appointment.findMany({
      where,
      include: {
        patient: {
          select: {
            firstName: true,
            lastName: true,
            email: true,
          },
        },
        service: {
          select: {
            name: true,
            duration: true,
            price: true,
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
        assignedUser: {
          select: {
            id: true,
            name: true,
            email: true,
          },
        },
      },
      orderBy: {
        date: upcoming ? "asc" : "desc",
      },
    });

    return NextResponse.json({ appointments });
  } catch (error: any) {
    console.error("[GET /api/portal/appointments] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}

// POST - Réserver un rendez-vous
export async function POST(req: Request) {
  try {
    const session = await getServerSession(authOptions as any);
    if (!session?.user?.email) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const json = await req.json();
    const parsed = bookAppointmentSchema.safeParse(json);
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid data", details: parsed.error.errors },
        { status: 400 }
      );
    }

    const { clinicId, serviceId, doctorId, dateTime, notes } = parsed.data;

    // Vérifier que la clinique existe
    const clinic = await prisma.clinic.findUnique({
      where: { id: clinicId },
    });

    if (!clinic) {
      return NextResponse.json(
        { error: "Clinique non trouvée" },
        { status: 404 }
      );
    }

    // Trouver ou créer le patient dans cette clinique
    let patient = await prisma.patient.findFirst({
      where: {
        email: session.user.email,
        clinicId: clinicId,
      },
      include: {
        clinic: true,
      },
    });

    // Si le patient n'existe pas dans cette clinique, le créer
    if (!patient) {
      // Récupérer les informations de l'utilisateur pour créer le patient
      const user = await prisma.user.findUnique({
        where: { email: session.user.email },
      });

      if (!user) {
        return NextResponse.json(
          { error: "Utilisateur non trouvé" },
          { status: 404 }
        );
      }

      // Créer le patient dans cette clinique
      patient = await prisma.patient.create({
        data: {
          firstName: user.name?.split(" ")[0] || "Patient",
          lastName: user.name?.split(" ").slice(1).join(" ") || "Inconnu",
          email: session.user.email,
          clinicId: clinicId,
        },
        include: {
          clinic: true,
        },
      });
    }

    // Vérifier que le service existe et appartient à la clinique
    const service = await prisma.service.findFirst({
      where: {
        id: serviceId,
        clinicId: clinicId,
        isActive: true,
      },
    });

    if (!service) {
      return NextResponse.json(
        { error: "Service non trouvé ou indisponible" },
        { status: 404 }
      );
    }

    // Vérifier que le médecin existe et appartient à la clinique
    const doctorMembership = await prisma.membership.findFirst({
      where: {
        userId: doctorId,
        clinicId: clinicId,
        role: "DOCTOR",
      },
    });

    if (!doctorMembership) {
      return NextResponse.json(
        { error: "Médecin non trouvé" },
        { status: 404 }
      );
    }

    // Vérifier les conflits de créneaux
    const appointmentDate = new Date(dateTime);
    const endTime = new Date(appointmentDate.getTime() + service.duration * 60000);

    const conflict = await prisma.appointment.findFirst({
      where: {
        clinicId: clinicId,
        assignedUserId: doctorId,
        date: {
          gte: appointmentDate,
          lt: endTime,
        },
        status: {
          notIn: ["CANCELLED", "NO_SHOW"],
        },
      },
    });

    if (conflict) {
      return NextResponse.json(
        { error: "Ce créneau est déjà réservé. Veuillez choisir un autre horaire." },
        { status: 409 }
      );
    }

    // Créer le rendez-vous
    const appointment = await prisma.appointment.create({
      data: {
        patientId: patient.id,
        serviceId: service.id,
        clinicId: clinicId,
        assignedUserId: doctorId,
        date: appointmentDate,
        duration: service.duration,
        status: "SCHEDULED",
        notes: notes || null,
      },
      include: {
        patient: true,
        service: true,
        clinic: true,
        assignedUser: true,
      },
    });

    return NextResponse.json({ appointment });
  } catch (error: any) {
    console.error("[POST /api/portal/appointments] Error:", error);
    return NextResponse.json(
      { error: "Server error" },
      { status: 500 }
    );
  }
}
