import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Phone, Clock, FileText } from "lucide-react";

export default async function ReceptionistDashboardPage() {
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
              Un administrateur devra vous ajouter à une clinique pour que vous puissiez accéder à votre espace réceptionniste.
            </p>
            <Button asChild>
              <Link href="/login">Déconnexion</Link>
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Prendre la première clinique (ou celle où il est RECEPTIONIST)
  const primaryMembership = memberships.find(m => m.role === "RECEPTIONIST") || memberships[0];
  const primaryClinic = primaryMembership.clinic;

  // Vérifier que l'utilisateur est bien RECEPTIONIST
  if (primaryMembership.role !== "RECEPTIONIST") {
    redirect("/dashboard");
  }

  // Calculer les statistiques
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Rendez-vous aujourd'hui
  const todayAppointments = await prisma.appointment.count({
    where: {
      clinicId: primaryClinic.id,
      date: {
        gte: today,
        lt: tomorrow,
      },
      status: {
        notIn: ["CANCELLED", "NO_SHOW"],
      },
    },
  });

  // Rendez-vous confirmés
  const confirmedToday = await prisma.appointment.count({
    where: {
      clinicId: primaryClinic.id,
      date: {
        gte: today,
        lt: tomorrow,
      },
      status: "CONFIRMED",
    },
  });

  // Total patients
  const totalPatients = await prisma.patient.count({
    where: { clinicId: primaryClinic.id },
  });

  // Nouveaux patients cette semaine
  const weekStart = new Date(today);
  weekStart.setDate(weekStart.getDate() - 7);
  const newPatients = await prisma.patient.count({
    where: {
      clinicId: primaryClinic.id,
      createdAt: {
        gte: weekStart,
      },
    },
  });

  // Rendez-vous récents
  const recentAppointments = await prisma.appointment.findMany({
    where: {
      clinicId: primaryClinic.id,
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

  // Nouveaux patients
  const recentPatients = await prisma.patient.findMany({
    where: { clinicId: primaryClinic.id },
    orderBy: {
      createdAt: "desc",
    },
    take: 5,
  });

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Dashboard Réceptionniste</h1>
        <p className="text-muted-foreground">
          Bienvenue, {session.user?.name || session.user?.email}
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
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">
              {newPatients} nouveau{newPatients > 1 ? "x" : ""} cette semaine
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Appels Aujourd'hui</CardTitle>
            <Phone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">À venir</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">-</div>
            <p className="text-xs text-muted-foreground">À venir (Sprint 3)</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides et Activité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/patients">
                  👤 Gérer les Patients
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/appointments">
                  📅 Gérer les Rendez-vous
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/consultations">
                  📋 Consultations
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Rendez-vous du Jour</CardTitle>
            <CardDescription>Rendez-vous prévus aujourd'hui</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.filter(apt => {
              const aptDate = new Date(apt.date);
              return aptDate >= today && aptDate < tomorrow;
            }).length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun rendez-vous prévu aujourd'hui.
              </p>
            ) : (
              <div className="space-y-3">
                {recentAppointments
                  .filter(apt => {
                    const aptDate = new Date(apt.date);
                    return aptDate >= today && aptDate < tomorrow;
                  })
                  .slice(0, 5)
                  .map((appointment) => (
                    <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-md">
                      <div className="flex-1">
                        <p className="font-medium text-sm">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(appointment.date).toLocaleTimeString("fr-FR", {
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

      {/* Nouveaux Patients */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Nouveaux Patients</CardTitle>
          <CardDescription>Derniers patients enregistrés</CardDescription>
        </CardHeader>
        <CardContent>
          {recentPatients.length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucun nouveau patient.
            </p>
          ) : (
            <div className="space-y-3">
              {recentPatients.map((patient) => (
                <div key={patient.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {patient.firstName} {patient.lastName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {patient.email || patient.phone || "Aucun contact"}
                      {" • "}
                      {new Date(patient.createdAt).toLocaleDateString("fr-FR")}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/patients/${patient.id}`}>
                      Voir
                    </Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

