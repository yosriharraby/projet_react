"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, FileText, CreditCard, Clock, User, Stethoscope, AlertCircle } from "lucide-react";

interface Appointment {
  id: string;
  date: string;
  status: string;
  service: {
    name: string;
  };
  clinic: {
    name: string;
  };
  assignedUser: {
    name: string | null;
  } | null;
}

interface Prescription {
  id: string;
  diagnosis: string;
  createdAt: string;
  createdBy: {
    name: string | null;
  };
}

export default function PatientPortalPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [recentPrescriptions, setRecentPrescriptions] = useState<Prescription[]>([]);
  const [pendingInvoices, setPendingInvoices] = useState(0);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/login");
      return;
    }
    if (status === "authenticated") {
      fetchData();
    }
  }, [status, router]);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Récupérer les rendez-vous à venir - pas d'erreur si 404, c'est normal si pas de rendez-vous
      const appointmentsRes = await fetch("/api/portal/appointments?upcoming=true");
      if (appointmentsRes.ok) {
        const data = await appointmentsRes.json();
        setUpcomingAppointments(data.appointments || []);
      }
      // Silently handle errors - patient might not have appointments yet

      // Récupérer les ordonnances récentes - pas d'erreur si 404
      const prescriptionsRes = await fetch("/api/portal/prescriptions?recent=true");
      if (prescriptionsRes.ok) {
        const data = await prescriptionsRes.json();
        setRecentPrescriptions(data.prescriptions || []);
      }
      // Silently handle errors - patient might not have prescriptions yet

      // Récupérer les factures impayées (à venir avec modèle Invoice)
      // setPendingInvoices(0); // Placeholder
    } catch (error) {
      // Ne pas afficher d'erreur dans le dashboard - laisser l'utilisateur voir la page même s'il n'a pas de données
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  const todayAppointments = upcomingAppointments.filter(apt => {
    const aptDate = new Date(apt.date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);
    return aptDate >= today && aptDate < tomorrow;
  });

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Espace Patient</h1>
        <p className="text-muted-foreground">
          Bienvenue, {session?.user?.name || session?.user?.email}
        </p>
      </div>

      {/* Statistiques */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
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
            <CardTitle className="text-sm font-medium">Factures en Attente</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{pendingInvoices}</div>
            <p className="text-xs text-muted-foreground">Factures impayées</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Documents</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{recentPrescriptions.length}</div>
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
              <Button className="w-full justify-start" variant="default" size="lg" asChild>
                <Link href="/portal/appointments">
                  <Calendar className="h-5 w-5 mr-2" />
                  Prendre un rendez-vous
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/portal/appointments">
                  <Clock className="h-4 w-4 mr-2" />
                  Mes Rendez-vous
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/portal/consultations">
                  <Stethoscope className="h-4 w-4 mr-2" />
                  Mes Consultations
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/portal/prescriptions">
                  <FileText className="h-4 w-4 mr-2" />
                  Mes Ordonnances
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/portal/invoices">
                  <CreditCard className="h-4 w-4 mr-2" />
                  Mes Factures
                </Link>
              </Button>
              <Button className="w-full justify-start" variant="outline" asChild>
                <Link href="/portal/profile">
                  <User className="h-4 w-4 mr-2" />
                  Mon Profil
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
            {upcomingAppointments.length === 0 ? (
              <div className="text-center py-8">
                <Calendar className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground text-sm mb-4">
                  Aucun rendez-vous prévu.
                </p>
                <Button asChild>
                  <Link href="/portal/appointments">Réserver un rendez-vous</Link>
                </Button>
              </div>
            ) : (
              <div className="space-y-3">
                {upcomingAppointments.slice(0, 5).map((appointment) => (
                  <div key={appointment.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
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
                      {appointment.assignedUser && (
                        <p className="text-xs text-muted-foreground mt-1">
                          Dr. {appointment.assignedUser.name}
                        </p>
                      )}
                    </div>
                    <Badge 
                      variant={
                        appointment.status === "CONFIRMED" ? "default" : 
                        appointment.status === "SCHEDULED" ? "outline" : 
                        "secondary"
                      }
                    >
                      {appointment.status === "CONFIRMED" ? "Confirmé" : 
                       appointment.status === "SCHEDULED" ? "En attente" : 
                       appointment.status}
                    </Badge>
                  </div>
                ))}
                {upcomingAppointments.length > 5 && (
                  <Button variant="outline" className="w-full" asChild>
                    <Link href="/portal/appointments">Voir tous les rendez-vous</Link>
                  </Button>
                )}
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
          {recentPrescriptions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground text-sm">
                Aucune ordonnance disponible.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentPrescriptions.slice(0, 5).map((prescription) => (
                <div key={prescription.id} className="flex items-center justify-between p-3 border rounded-md hover:bg-muted/50 transition-colors">
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
                    {prescription.createdBy && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Par Dr. {prescription.createdBy.name}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button variant="outline" size="sm" asChild>
                      <Link href={`/portal/prescriptions/${prescription.id}`}>
                        Voir
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
              {recentPrescriptions.length > 5 && (
                <Button variant="outline" className="w-full" asChild>
                  <Link href="/portal/prescriptions">Voir toutes les ordonnances</Link>
                </Button>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

