"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, FileText, Download, Calendar, User, Stethoscope } from "lucide-react";
import Link from "next/link";

interface Prescription {
  id: string;
  diagnosis: string;
  medications: string;
  instructions: string | null;
  notes: string | null;
  createdAt: string;
  appointmentId: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    email: string | null;
    dateOfBirth: string | null;
  };
  createdBy: {
    name: string | null;
    email: string;
  };
}

export default function ConsultationsPage() {
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchPrescriptions();
  }, []);

  const fetchPrescriptions = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await fetch("/api/prescriptions");
      
      if (!response.ok) {
        let errorMessage = "Échec du chargement des ordonnances";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
          
          // Messages d'erreur spécifiques selon le code de statut
          if (response.status === 401) {
            errorMessage = "Vous devez être connecté pour voir les ordonnances. Veuillez vous reconnecter.";
          } else if (response.status === 404) {
            // Ne pas afficher de message d'erreur pour 404 - c'est normal si aucune ordonnance
            errorMessage = null;
          } else if (response.status === 403) {
            errorMessage = "Vous n'avez pas la permission de voir les ordonnances.";
          }
        } catch (e) {
          console.error("[fetchPrescriptions] Failed to parse error response");
        }
        // Ne pas afficher d'erreur pour 404 si c'est "No clinic found" - c'est normal
        if (errorMessage && !errorMessage.includes("Aucune clinique trouvée")) {
          setError(errorMessage);
        } else {
          setError(null);
        }
        setPrescriptions([]);
        return;
      }
      
      const data = await response.json();
      setPrescriptions(data.prescriptions || []);
      setError(null);
    } catch (error: any) {
      console.error("[fetchPrescriptions] Error fetching prescriptions:", error);
      const errorMessage = error.message || "Une erreur s'est produite lors du chargement des ordonnances. Vérifiez votre connexion et réessayez.";
      setError(errorMessage);
      setPrescriptions([]);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const formatDateTime = (dateString: string) => {
    return new Date(dateString).toLocaleString("fr-FR", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const handleDownloadPDF = async (prescriptionId: string, patientName: string) => {
    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordonnance_${patientName}_${new Date().toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Erreur lors du téléchargement du PDF");
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Consultations & Ordonnances</h1>
        <p className="text-muted-foreground">
          Gérez les consultations et prescriptions médicales
        </p>
      </div>

      {/* Actions pour les patients */}
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

      {/* Liste des ordonnances */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Liste des Ordonnances
          </CardTitle>
          <CardDescription>
            {prescriptions.length} ordonnance{prescriptions.length > 1 ? "s" : ""} créée{prescriptions.length > 1 ? "s" : ""}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && error !== null && !error.includes("Aucune clinique trouvée") && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => fetchPrescriptions()}
              >
                Réessayer
              </Button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <p>Chargement...</p>
            </div>
          ) : error && error !== null && !error.includes("Aucune clinique trouvée") ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Impossible de charger les ordonnances. Veuillez réessayer.
              </p>
            </div>
          ) : prescriptions.length === 0 ? (
            <div className="text-center py-8">
              <FileText className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                Aucune ordonnance pour le moment.
              </p>
              <p className="text-sm text-muted-foreground mt-2">
                Les ordonnances sont créées après les consultations.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {prescriptions.map((prescription) => (
                <div
                  key={prescription.id}
                  className="border rounded-lg p-6 hover:bg-accent/50 transition-colors"
                >
                  <div className="flex justify-between items-start mb-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">
                          {prescription.patient.firstName} {prescription.patient.lastName}
                        </h3>
                        {prescription.patient.dateOfBirth && (
                          <span className="text-sm text-muted-foreground">
                            ({new Date(prescription.patient.dateOfBirth).toLocaleDateString("fr-FR")})
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-3 mb-2 text-sm text-muted-foreground">
                        <Stethoscope className="h-4 w-4" />
                        <span>Par {prescription.createdBy.name || prescription.createdBy.email}</span>
                        <span>•</span>
                        <Calendar className="h-4 w-4" />
                        <span>{formatDateTime(prescription.createdAt)}</span>
                      </div>

                      <div className="mt-4 space-y-2">
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Diagnostic:</p>
                          <p className="text-sm">{prescription.diagnosis}</p>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-muted-foreground">Médicaments:</p>
                          <p className="text-sm whitespace-pre-wrap">{prescription.medications}</p>
                        </div>
                        {prescription.instructions && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Instructions:</p>
                            <p className="text-sm">{prescription.instructions}</p>
                          </div>
                        )}
                        {prescription.notes && (
                          <div>
                            <p className="text-sm font-medium text-muted-foreground">Notes:</p>
                            <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex flex-col gap-2 ml-4">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() =>
                          handleDownloadPDF(
                            prescription.id,
                            `${prescription.patient.lastName}_${prescription.patient.firstName}`
                          )
                        }
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                      <Link href={`/consultations/${prescription.id}`}>
                        <Button variant="outline" size="sm" className="w-full">
                          Voir détails
                        </Button>
                      </Link>
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

