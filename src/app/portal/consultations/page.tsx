"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, User, Stethoscope, FileText, Download } from "lucide-react";

interface Consultation {
  id: string;
  date: string;
  service: {
    name: string;
  };
  clinic: {
    name: string;
  };
  assignedUser: {
    name: string | null;
  } | null;
  prescription?: {
    id: string;
  } | null;
}

export default function PatientConsultationsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [consultations, setConsultations] = useState<Consultation[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
      return;
    }
    if (status === "authenticated") {
      fetchConsultations();
    }
  }, [status, router]);

  const fetchConsultations = async () => {
    try {
      setLoading(true);
      // Les consultations sont les rendez-vous terminés (COMPLETED)
      const res = await fetch("/api/portal/appointments?past=true");
      if (res.ok) {
        const data = await res.json();
        // Filtrer seulement les consultations terminées
        const completed = (data.appointments || []).filter(
          (apt: any) => apt.status === "COMPLETED"
        );
        setConsultations(completed);
      }
    } catch (error) {
      console.error("Error fetching consultations:", error);
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

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Consultations</h1>
        <p className="text-muted-foreground">
          Historique de vos consultations médicales
        </p>
      </div>

      {/* Actions pour prendre ou voir les rendez-vous */}
      <div className="mb-6">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex-1">
                <p className="text-sm text-muted-foreground mb-4">
                  Gérez vos rendez-vous médicaux. Réservez un nouveau rendez-vous ou consultez vos rendez-vous existants.
                </p>
                <div className="flex gap-3">
                  <Button asChild>
                    <Link href="/portal/appointments">
                      <Calendar className="h-4 w-4 mr-2" />
                      Prendre rendez-vous
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/portal/appointments">
                      <Calendar className="h-4 w-4 mr-2" />
                      Voir les rendez-vous
                    </Link>
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent className="pt-6">
          {consultations.length === 0 ? (
            <div className="text-center py-12">
              <Stethoscope className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucune consultation dans votre historique.
              </p>
              <Button asChild>
                <Link href="/portal/appointments">
                  <Calendar className="h-4 w-4 mr-2" />
                  Prendre un rendez-vous
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {consultations.map((consultation) => (
                <div
                  key={consultation.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">
                          {new Date(consultation.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                      </div>

                      <div className="ml-8 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Stethoscope className="h-4 w-4" />
                          {consultation.service.name}
                        </div>

                        {consultation.assignedUser && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            Dr. {consultation.assignedUser.name}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{consultation.clinic.name}</span>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {consultation.prescription && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/portal/prescriptions/${consultation.prescription.id}`}>
                            <FileText className="h-4 w-4 mr-2" />
                            Voir ordonnance
                          </Link>
                        </Button>
                      )}
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/portal/appointments`}>
                          Voir mes rendez-vous
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

