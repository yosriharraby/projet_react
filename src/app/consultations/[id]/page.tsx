"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, Calendar, User, Stethoscope, FileText } from "lucide-react";
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
    phone: string | null;
    address: string | null;
  };
  createdBy: {
    name: string | null;
    email: string;
  };
  clinic: {
    name: string;
    address: string | null;
    phone: string | null;
  };
}

export default function PrescriptionDetailPage() {
  const params = useParams();
  const router = useRouter();
  const prescriptionId = params.id as string;

  const [prescription, setPrescription] = useState<Prescription | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchPrescription();
  }, [prescriptionId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/prescriptions/${prescriptionId}`);
      if (!response.ok) throw new Error("Failed to fetch prescription");
      const data = await response.json();
      setPrescription(data.prescription);
    } catch (error) {
      console.error("Error fetching prescription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!prescription) return;

    try {
      const response = await fetch(`/api/prescriptions/${prescriptionId}/pdf`);
      if (!response.ok) {
        throw new Error("Failed to download PDF");
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `ordonnance_${prescription.patient.lastName}_${new Date(prescription.createdAt).toISOString().split("T")[0]}.pdf`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading PDF:", error);
      alert("Erreur lors du téléchargement du PDF");
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("fr-FR", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="max-w-7xl mx-auto py-10">
        <p>Ordonnance non trouvée.</p>
        <Link href="/consultations">
          <Button variant="outline" className="mt-4">
            Retour à la liste
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto py-10">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/consultations">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">Ordonnance Médicale</h1>
            <p className="text-muted-foreground">
              {formatDate(prescription.createdAt)}
            </p>
          </div>
        </div>
        <Button onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Télécharger PDF
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations Patient */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Patient
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Nom complet</p>
                <p className="font-semibold">
                  {prescription.patient.firstName} {prescription.patient.lastName}
                </p>
              </div>
              {prescription.patient.dateOfBirth && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                  <p>{formatDate(prescription.patient.dateOfBirth)}</p>
                </div>
              )}
              {prescription.patient.email && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Email</p>
                  <p>{prescription.patient.email}</p>
                </div>
              )}
              {prescription.patient.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p>{prescription.patient.phone}</p>
                </div>
              )}
              {prescription.patient.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                  <p>{prescription.patient.address}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="mt-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Stethoscope className="h-5 w-5" />
                Informations Clinique
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Clinique</p>
                <p className="font-semibold">{prescription.clinic.name}</p>
              </div>
              {prescription.clinic.address && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                  <p>{prescription.clinic.address}</p>
                </div>
              )}
              {prescription.clinic.phone && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                  <p>{prescription.clinic.phone}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Prescrit par</p>
                <p>{prescription.createdBy.name || prescription.createdBy.email}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Détails de l'ordonnance */}
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Détails de l'Ordonnance
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold mb-2">Diagnostic</h3>
                <p className="text-muted-foreground">{prescription.diagnosis}</p>
              </div>

              <div>
                <h3 className="text-lg font-semibold mb-2">Médicaments Prescrits</h3>
                <div className="bg-muted/50 rounded-lg p-4">
                  <p className="whitespace-pre-wrap">{prescription.medications}</p>
                </div>
              </div>

              {prescription.instructions && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Instructions</h3>
                  <div className="bg-blue-50 dark:bg-blue-950/20 rounded-lg p-4">
                    <p>{prescription.instructions}</p>
                  </div>
                </div>
              )}

              {prescription.notes && (
                <div>
                  <h3 className="text-lg font-semibold mb-2">Notes</h3>
                  <p className="text-sm text-muted-foreground">{prescription.notes}</p>
                </div>
              )}

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  Ordonnance créée le {formatDate(prescription.createdAt)} à{" "}
                  {new Date(prescription.createdAt).toLocaleTimeString("fr-FR", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </p>
                {prescription.appointmentId && (
                  <p className="text-sm text-muted-foreground mt-1">
                    Liée au rendez-vous n°{prescription.appointmentId.slice(-8).toUpperCase()}
                  </p>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

