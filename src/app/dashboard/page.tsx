import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import { prisma } from "@/lib/db";
import { redirect } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Users, Stethoscope, Activity, Clock, DollarSign, TrendingUp, UserCheck, AlertCircle } from "lucide-react";

export default async function DashboardPage() {
  const session = await getServerSession(authOptions as any);
  if (!session) {
    return (
      <div className="max-w-lg mx-auto py-10">
        <p className="mb-4">You must be logged in.</p>
        <Link className="underline" href="/login">Go to login</Link>
      </div>
    );
  }

  // Récupérer l'utilisateur pour connaître son defaultRole
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { defaultRole: true },
  });

  // Vérifier les memberships
  const memberships = await prisma.membership.findMany({
    where: { userId: session.user.id },
    include: {
      clinic: true,
    },
  });

  // Si aucun membership, rediriger selon le defaultRole
  if (memberships.length === 0) {
    if (user?.defaultRole === "PATIENT") {
      redirect("/dashboard/patient");
    } else if (user?.defaultRole === "DOCTOR") {
      redirect("/dashboard/doctor");
    } else if (user?.defaultRole === "RECEPTIONIST") {
      redirect("/dashboard/receptionist");
    } else {
      // Pas de rôle défini, rediriger vers onboarding
      redirect("/onboarding");
    }
  }

  // Get user's primary clinic (first one they're admin of, or first one)
  const primaryMembership = memberships.find(m => m.role === "ADMIN") || memberships[0];
  const primaryClinic = primaryMembership.clinic;
  const userRole = primaryMembership.role;

  // Rediriger vers le dashboard spécifique selon le rôle
  if (userRole === "DOCTOR") {
    redirect("/dashboard/doctor");
  } else if (userRole === "RECEPTIONIST") {
    redirect("/dashboard/receptionist");
  }
  // ADMIN reste sur /dashboard (dashboard principal)

  // === DASHBOARD ADMIN - Tous les KPIs selon spécifications ===
  
  // Calculer les statistiques réelles
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);

  // === KPIs ADMIN selon spécifications ===
  
  // 1. Nombre total de patients enregistrés
  const totalPatients = await prisma.patient.count({
    where: { clinicId: primaryClinic.id },
  });

  // 2. Nombre de médecins actifs
  const activeDoctors = await prisma.membership.count({
    where: {
      clinicId: primaryClinic.id,
      role: "DOCTOR",
    },
  });

  // 3. Nombre de rendez-vous du jour
  const todayAppointmentsCount = await prisma.appointment.count({
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

  // 4. Chiffre d'affaires du mois (à venir avec facturation - Sprint 3)
  const currentMonth = new Date();
  currentMonth.setDate(1);
  currentMonth.setHours(0, 0, 0, 0);
  // TODO: Calculer avec Invoice model quand disponible
  const monthlyRevenue = 0; // Placeholder

  // 5. Revenus vs factures impayées (à venir - Sprint 3)
  const unpaidInvoices = 0; // Placeholder
  const totalRevenue = 0; // Placeholder

  // 6. Taux d'occupation des médecins
  // Calculer le nombre de rendez-vous assignés vs créneaux disponibles
  const totalAppointmentsThisMonth = await prisma.appointment.count({
    where: {
      clinicId: primaryClinic.id,
      date: {
        gte: currentMonth,
      },
      status: {
        notIn: ["CANCELLED", "NO_SHOW"],
      },
    },
  });
  
  // Estimation: 8h/jour * 20 jours/mois * nombre de médecins = créneaux théoriques
  const theoreticalSlots = activeDoctors * 8 * 20; // Approximation
  const occupancyRate = theoreticalSlots > 0 
    ? Math.round((totalAppointmentsThisMonth / theoreticalSlots) * 100) 
    : 0;

  // Rendez-vous confirmés aujourd'hui
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

  // Activité récente (derniers rendez-vous, patients, etc.)
  const recentAppointments = await prisma.appointment.findMany({
    where: { clinicId: primaryClinic.id },
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
      createdAt: "desc",
    },
    take: 5,
  });

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
        <h1 className="text-3xl font-bold mb-2">Dashboard</h1>
        <p className="text-muted-foreground">
          Bienvenue, {session.user?.name || session.user?.email}
        </p>
        {primaryClinic && (
          <p className="text-sm text-muted-foreground mt-1">
            Clinique: <span className="font-medium">{primaryClinic.name}</span>
            {" • "}
            Rôle: <Badge variant="outline">{userRole}</Badge>
          </p>
        )}
      </div>

      {/* === KPIs ADMIN selon spécifications === */}
      <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Patients</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalPatients}</div>
            <p className="text-xs text-muted-foreground">Enregistrés</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Médecins Actifs</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeDoctors}</div>
            <p className="text-xs text-muted-foreground">En activité</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Rendez-vous Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{todayAppointmentsCount}</div>
            <p className="text-xs text-muted-foreground">
              {confirmedToday} confirmé{confirmedToday > 1 ? "s" : ""}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">CA du Mois</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{monthlyRevenue.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">Chiffre d'affaires</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Factures Impayées</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{unpaidInvoices.toFixed(2)}€</div>
            <p className="text-xs text-muted-foreground">En attente</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Taux Occupation</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{occupancyRate}%</div>
            <p className="text-xs text-muted-foreground">Médecins</p>
          </CardContent>
        </Card>
      </div>

      {/* Actions Rapides et Activité */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Actions Rapides</CardTitle>
            <CardDescription>Accès rapide aux fonctionnalités principales</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/clinic">
                  ⚙️ Configuration Clinique
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/services">
                  🏥 Gestion des Services
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/staff">
                  👥 Gestion du Staff
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/pricing">
                  💰 Gestion des Tarifs
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/admin/settings">
                  🔧 Paramètres & Configuration
                </Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Activité Récente</CardTitle>
            <CardDescription>Derniers rendez-vous et nouveaux patients</CardDescription>
          </CardHeader>
          <CardContent>
            {recentAppointments.length === 0 && recentPatients.length === 0 ? (
              <p className="text-muted-foreground text-sm">
                Aucune activité récente. Commencez par ajouter des patients et programmer des rendez-vous.
              </p>
            ) : (
              <div className="space-y-4">
                {recentAppointments.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Derniers Rendez-vous</h4>
                    <div className="space-y-2">
                      {recentAppointments.map((appointment) => (
                        <div key={appointment.id} className="flex items-center gap-2 text-sm">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {appointment.patient.firstName} {appointment.patient.lastName}
                          </span>
                          <span className="text-muted-foreground">•</span>
                          <span className="text-muted-foreground">
                            {new Date(appointment.date).toLocaleDateString("fr-FR", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
                {recentPatients.length > 0 && (
                  <div>
                    <h4 className="text-sm font-semibold mb-2">Nouveaux Patients</h4>
                    <div className="space-y-2">
                      {recentPatients.map((patient) => (
                        <div key={patient.id} className="flex items-center gap-2 text-sm">
                          <Users className="h-3 w-3 text-muted-foreground" />
                          <span>
                            {patient.firstName} {patient.lastName}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}


