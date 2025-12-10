"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, FileText } from "lucide-react";
import Link from "next/link";

interface Appointment {
  id: string;
  date: string;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
  };
  service: {
    name: string;
  };
}

export default function CreatePrescriptionPage() {
  const params = useParams();
  const router = useRouter();
  const appointmentId = params.id as string;

  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    diagnosis: "",
    medications: "",
    instructions: "",
    notes: "",
  });

  useEffect(() => {
    fetchAppointment();
  }, [appointmentId]);

  const fetchAppointment = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/appointments/${appointmentId}`);
      if (!response.ok) throw new Error("Failed to fetch appointment");
      const data = await response.json();
      
      if (data.appointment.status !== "COMPLETED") {
        router.push("/appointments");
        return;
      }
      
      setAppointment(data.appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      router.push("/appointments");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);

    if (!appointment) return;

    try {
      const response = await fetch("/api/prescriptions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          appointmentId: appointment.id,
          patientId: appointment.patient.id,
          diagnosis: formData.diagnosis,
          medications: formData.medications,
          instructions: formData.instructions || undefined,
          notes: formData.notes || undefined,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create prescription");
        return;
      }

      // Rediriger vers la page de détail de l'ordonnance
      router.push(`/consultations/${data.prescription.id}`);
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!appointment) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <p>Rendez-vous non trouvé ou non complété.</p>
        <Link href="/appointments">
          <Button variant="outline" className="mt-4">
            Retour aux rendez-vous
          </Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      {/* Header */}
      <div className="mb-6 flex items-center gap-4">
        <Link href="/appointments">
          <Button variant="outline" size="sm">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Retour
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Créer une Ordonnance</h1>
          <p className="text-muted-foreground">
            Pour {appointment.patient.firstName} {appointment.patient.lastName}
          </p>
          <p className="text-sm text-muted-foreground">
            Service: {appointment.service.name}
          </p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Formulaire de Prescription
          </CardTitle>
          <CardDescription>
            Remplissez les informations pour créer l'ordonnance médicale
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-sm font-medium block mb-2">
                Diagnostic * <span className="text-muted-foreground text-xs">(Obligatoire)</span>
              </label>
              <textarea
                value={formData.diagnosis}
                onChange={(e) => setFormData({ ...formData, diagnosis: e.target.value })}
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                placeholder="Entrez le diagnostic médical..."
                required
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Médicaments Prescrits * <span className="text-muted-foreground text-xs">(Obligatoire)</span>
              </label>
              <textarea
                value={formData.medications}
                onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
                className="w-full px-3 py-2 border rounded-md min-h-[150px]"
                placeholder="Liste des médicaments prescrits (ex: Paracétamol 500mg, 2 comprimés, 3 fois par jour pendant 5 jours)"
                required
              />
              <p className="text-xs text-muted-foreground mt-1">
                Indiquez le nom, le dosage, la posologie et la durée du traitement
              </p>
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Instructions pour le Patient
              </label>
              <textarea
                value={formData.instructions}
                onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
                className="w-full px-3 py-2 border rounded-md min-h-[100px]"
                placeholder="Instructions spécifiques pour le patient (ex: Prendre avec les repas, éviter l'alcool...)"
              />
            </div>

            <div>
              <label className="text-sm font-medium block mb-2">
                Notes Additionnelles
              </label>
              <textarea
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                className="w-full px-3 py-2 border rounded-md min-h-[80px]"
                placeholder="Notes internes (non visibles sur le PDF patient)"
              />
            </div>

            {error && (
              <div className="bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
              </div>
            )}

            <div className="flex justify-end gap-3 pt-4 border-t">
              <Link href="/appointments">
                <Button type="button" variant="outline">
                  Annuler
                </Button>
              </Link>
              <Button type="submit" disabled={submitting}>
                {submitting ? "Création..." : "Créer l'Ordonnance"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

