"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Calendar, User, Eye } from "lucide-react";

interface Prescription {
  id: string;
  diagnosis: string;
  medications: string;
  instructions: string | null;
  createdAt: string;
  createdBy: {
    name: string | null;
  };
  clinic: {
    name: string;
  };
}

export default function PatientPrescriptionsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
      return;
    }
    if (status === "authenticated") {
      fetchPrescriptions();
    }
  }, [status, router]);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      const res = await fetch("/api/portal/prescriptions");
      if (res.ok) {
        const data = await res.json();
        setPrescriptions(data.prescriptions || []);
      }
    } catch (error) {
      console.error("Error fetching prescriptions:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async (prescriptionId: string) => {
    try {
      const res = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ordonnance-${prescriptionId}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Erreur lors du téléchargement du PDF");
      }
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Erreur lors du téléchargement du PDF");
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
        <h1 className="text-3xl font-bold mb-2">Mes Ordonnances</h1>
        <p className="text-muted-foreground">
          Toutes vos ordonnances médicales disponibles en téléchargement
        </p>
      </div>

      <Card>
        <CardContent className="pt-6">
          {prescriptions.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                Aucune ordonnance disponible.
              </p>
              <Button asChild>
                <Link href="/portal/appointments">
                  <Calendar className="h-4 w-4 mr-2" />
                  Voir mes rendez-vous
                </Link>
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <FileText className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">
                          Ordonnance du{" "}
                          {new Date(prescription.createdAt).toLocaleDateString("fr-FR", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                      </div>

                      <div className="ml-8 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <User className="h-4 w-4" />
                          Prescrit par Dr. {prescription.createdBy.name}
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <span>{prescription.clinic.name}</span>
                        </div>

                        <div className="mt-3 p-3 bg-muted rounded-md">
                          <p className="text-sm font-medium mb-1">Diagnostic:</p>
                          <p className="text-sm">{prescription.diagnosis}</p>
                        </div>

                        {prescription.medications && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-1">Médicaments:</p>
                            <p className="text-sm whitespace-pre-wrap">{prescription.medications}</p>
                          </div>
                        )}

                        {prescription.instructions && (
                          <div className="mt-2 p-3 bg-muted rounded-md">
                            <p className="text-sm font-medium mb-1">Instructions:</p>
                            <p className="text-sm">{prescription.instructions}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2">
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownloadPDF(prescription.id)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger PDF
                      </Button>
                      <Button variant="outline" size="sm" asChild>
                        <Link href={`/portal/prescriptions/${prescription.id}`}>
                          <Eye className="h-4 w-4 mr-2" />
                          Visualiser
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

