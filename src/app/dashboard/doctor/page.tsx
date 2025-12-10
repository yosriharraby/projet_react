import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Stethoscope, Clock, FileText } from "lucide-react";

export default async function DoctorDashboardPage() {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    redirect("/login");
  }

  // Vérifier les memberships
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      clinic: true,
    },
  });

  // Si pas de membership, rediriger vers un message d'attente
  if (memberships.length === 0) {
    return (
      <div className="max-w-2xl mx-auto py-10">
        <Card>
          <CardHeader>
            <CardTitle>En attente d'ajout à une clinique</CardTitle>
            <CardDescription>
              Votre compte a été créé avec succès, mais vous n'avez pas encore été ajouté à une clinique.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">
              Un administrateur devra vous ajouter à une clinique pour que vous puissiez accéder à votre espace médecin.
            </p>
            <Button asChild>
              <Link href="/login">Déconnexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prendre la première clinique (ou celle où il est DOCTOR)
  const primaryMembership = memberships.find(m => m.role === "DOCTOR") || memberships[0];
  const primaryClinic = primaryMembership.clinic;

  // Vérifier que l'utilisateur est bien DOCTOR
  if (primaryMembership.role !== "DOCTOR") {
    redirect("/dashboard");
  }

  // Calculer les statistiques
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Rendez-vous du médecin aujourd'hui
  const todayAppointments = await prisma.appointment.count({
    where: {
      clinicId: primaryClinic.id,
      assignedUserId: session.user.id,
      date: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        notIn: ["CANCELLED", "NO_SHOW"],
      },
    },
  });

  // Rendez-vous confirmés aujourd'hui
  const confirmedToday = await prisma.appointment.count({
    where: {
      clinicId: primaryClinic.id,
      assignedUserId: session.user.id,
      date: {
        gte: today,
        lt: tomorrow,
      },
      status: "CONFIRMED",
    },
  });

  // Rendez-vous à venir (semaine)
  const weekStart = new Date(today);
  const weekEnd = new Date(today);
  weekEnd.setDate(weekEnd.getDate() + 7);

  const upcomingAppointments = await prisma.appointment.count({
    where: {
      clinicId: primaryClinic.id,
      assignedUserId: session.user.id,
      date: {
        gte: today,
        lt: weekEnd,
      },
      status: {
        notIn: ["CANCELLED", "NO_SHOW"],
      },
    },
  });

  // Prescriptions créées par ce médecin
  const myPrescriptions = await prisma.prescription.count({
    where: {
      clinicId: primaryClinic.id,
      createdById: session.user.id,
    },
  });

  // Rendez-vous récents
  const recentAppointments = await prisma.appointment.findMany({
    where: {
      clinicId: primaryClinic.id,
      assignedUserId: session.user.id,
    },
    include: {
      patient: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
      service: {
        select: {
          name: true,
        },
      },
    },
    orderBy: {
      date: "asc",
    },
    take: 5,
  });

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Médecin</h1>
        <p className="text-muted-foreground">
          Bienvenue, Dr. {session.user?.name || session.user?.email}
        </p>
        {primaryClinic && (
          <p className="text-sm text-muted-foreground mt-1">
            Clinique: <span className="font-medium">{primaryClinic.name}</span>
          </p>
        )}
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments}</div>
            <p className="text-xs text-muted-foreground">
              {confirmedToday} confirmé{confirmedToday > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cette Semaine</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments}</div>
            <p className="text-xs text-muted-foreground">Rendez-vous prévus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordonnances</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{myPrescriptions}</div>
            <p className="text-xs text-muted-foreground">Créées par vous</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mon Agenda</CardTitle>
            <Stethoscope className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Prochains rendez-vous</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides et Rendez-vous */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/appointments">
                  📅 Mon Agenda
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/consultations">
                  📋 Consultations & Ordonnances
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/patients">
                  👤 Voir les Patients
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Prochains Rendez-vous</CardTitle>
            <CardDescription>Vos rendez-vous à venir</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun rendez-vous prévu pour le moment.
              </p>
            ) : (
              <div className="space-y-3">
                {recentAppointments.map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {appointment.patient.firstName} {appointment.patient.lastName}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(appointment.date).toLocaleDateString("fr-FR", {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })} • {appointment.service.name}
                      </p>
                    </div>
                    <Badge variant={appointment.status === "CONFIRMED" ? "default" : "outline"}>
                      {appointment.status}
                    </Badge>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

