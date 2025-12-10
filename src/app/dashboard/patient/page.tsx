import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, CreditCard, Clock, User } from "lucide-react";

export default async function PatientDashboardPage() {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    redirect("/login");
  }

  // Récupérer l'utilisateur pour vérifier qu'il est bien un patient
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultRole: true },
  });

  // Si l'utilisateur a un membership (il a été ajouté à une clinique), rediriger vers le dashboard admin/doctor/receptionist
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
  });

  if (memberships.length > 0) {
    // Si l'utilisateur a des memberships, il n'est plus un simple patient
    redirect("/dashboard");
  }

  // Récupérer les rendez-vous du patient (via son email si un patient existe avec cet email)
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // Chercher les patients avec cet email dans toutes les cliniques
  const patientRecords = await prisma.patient.findMany({
    where: { email: session.user.email || "" },
    include: {
      appointments: {
        where: {
          date: {
            gte: today,
          },
        },
        include: {
          service: true,
          clinic: true,
        },
        orderBy: {
          date: "asc",
        },
        take: 5,
      },
      prescriptions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 5,
      },
    },
  });

  // Calculer les statistiques
  const upcomingAppointments = patientRecords.flatMap(p => p.appointments).filter(apt => 
    new Date(apt.date) >= today && apt.status !== "CANCELLED" && apt.status !== "NO_SHOW"
  );

  const todayAppointments = upcomingAppointments.filter(apt => {
    const aptDate = new Date(apt.date);
    return aptDate >= today && aptDate < tomorrow;
  });

  // Pour les factures, on devra créer le modèle Invoice plus tard (Sprint 3)
  // Pour l'instant, on affiche un message

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Espace Patient</h1>
        <p className="text-muted-foreground">
          Bienvenue, {session.user?.name || session.user?.email}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Rendez-vous prévus</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous à Venir</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{upcomingAppointments.length}</div>
            <p className="text-xs text-muted-foreground">Prochains rendez-vous</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ordonnances</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {patientRecords.flatMap(p => p.prescriptions).length}
            </div>
            <p className="text-xs text-muted-foreground">Ordonnances disponibles</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Gérez vos rendez-vous et documents</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline" disabled>
                📅 Mes Rendez-vous (À venir)
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/consultations">
                  📋 Mes Ordonnances
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" disabled>
                💳 Mes Factures (À venir - Sprint 3)
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
            {upcomingAppointments.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucun rendez-vous prévu. Réservez un rendez-vous pour commencer.
              </p>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-md">
                    <div className="flex-1">
                      <p className="font-medium text-sm">
                        {new Date(appointment.date).toLocaleDateString("fr-FR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {appointment.service.name} - {appointment.clinic.name}
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

      {/* Ordonnances Récentes */}
      <Card>
        <CardHeader>
          <CardTitle>Ordonnances Récentes</CardTitle>
          <CardDescription>Vos dernières ordonnances médicales</CardDescription>
        </CardHeader>
        <CardContent>
          {patientRecords.flatMap(p => p.prescriptions).length === 0 ? (
            <p className="text-muted-foreground text-sm">
              Aucune ordonnance disponible.
            </p>
          ) : (
            <div className="space-y-3">
              {patientRecords.flatMap(p => p.prescriptions).slice(0, 5).map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-md">
                  <div className="flex-1">
                    <p className="font-medium text-sm">
                      {new Date(prescription.createdAt).toLocaleDateString("fr-FR", {
                        year: "numeric",
                        month: "long",
                        day: "numeric",
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Diagnostic: {prescription.diagnosis}
                    </p>
                  </div>
                  <Button variant="outline" size="sm" asChild>
                    <Link href={`/consultations/${prescription.id}`}>
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

