"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter, useParams } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, ArrowLeft, Calendar, User } from "lucide-react";

interface Prescription {
  id: string;
  diagnosis: string;
  medications: string;
  instructions: string | null;
  notes: string | null;
  createdAt: string;
  createdBy: {
    name: string | null;
    email: string;
  };
  clinic: {
    name: string;
    address: string | null;
    phone: string | null;
  };
  patient: {
    firstName: string;
    lastName: string;
  };
}

export default function PrescriptionDetailPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const params = useParams();
  const prescriptionId = params.id as string;
  const [loading, setLoading] = useState(true);
  const [prescription, setPrescription] = useState<Prescription | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
      return;
    }
    if (status === "authenticated") {
      fetchPrescription();
    }
  }, [status, router, prescriptionId]);

  const fetchPrescription = async () => {
    try {
      setLoading(true);
      const res = await fetch(`/api/prescriptions/${prescriptionId}`);
      if (res.ok) {
        const data = await res.json();
        setPrescription(data.prescription);
      } else {
        router.push("/portal/prescriptions");
      }
    } catch (error) {
      console.error("Error fetching prescription:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadPDF = async () => {
    if (!prescription) return;
    
    try {
      const res = await fetch(`/api/prescriptions/${prescription.id}/pdf`);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `ordonnance-${prescription.id}.pdf`;
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
      <div className="max-w-4xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!prescription) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <p>Ordonnance non trouvée</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-6">
        <Button variant="ghost" asChild>
          <Link href="/portal/prescriptions">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour aux ordonnances
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle>Ordonnance Médicale</CardTitle>
              <CardDescription>
                {new Date(prescription.createdAt).toLocaleDateString("fr-FR", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
              </CardDescription>
            </div>
            <Button onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Télécharger PDF
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Informations patient */}
          <div>
            <h3 className="font-semibold mb-2">Patient</h3>
            <p className="text-sm text-muted-foreground">
              {prescription.patient.firstName} {prescription.patient.lastName}
            </p>
          </div>

          {/* Informations médecin */}
          <div>
            <h3 className="font-semibold mb-2">Médecin prescripteur</h3>
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <User className="h-4 w-4" />
              <span>Dr. {prescription.createdBy.name || prescription.createdBy.email}</span>
            </div>
          </div>

          {/* Informations clinique */}
          <div>
            <h3 className="font-semibold mb-2">Clinique</h3>
            <p className="text-sm text-muted-foreground">{prescription.clinic.name}</p>
            {prescription.clinic.address && (
              <p className="text-sm text-muted-foreground">{prescription.clinic.address}</p>
            )}
            {prescription.clinic.phone && (
              <p className="text-sm text-muted-foreground">Tél: {prescription.clinic.phone}</p>
            )}
          </div>

          {/* Diagnostic */}
          <div>
            <h3 className="font-semibold mb-2">Diagnostic</h3>
            <p className="text-sm">{prescription.diagnosis}</p>
          </div>

          {/* Médicaments */}
          <div>
            <h3 className="font-semibold mb-2">Médicaments prescrits</h3>
            <div className="p-4 bg-muted rounded-md">
              <p className="text-sm whitespace-pre-wrap">{prescription.medications}</p>
            </div>
          </div>

          {/* Instructions */}
          {prescription.instructions && (
            <div>
              <h3 className="font-semibold mb-2">Instructions</h3>
              <p className="text-sm">{prescription.instructions}</p>
            </div>
          )}

          {/* Notes */}
          {prescription.notes && (
            <div>
              <h3 className="font-semibold mb-2">Notes</h3>
              <p className="text-sm text-muted-foreground">{prescription.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

