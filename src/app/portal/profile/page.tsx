"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { User, Mail, Phone, MapPin, Lock, Save } from "lucide-react";

interface PatientData {
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  dateOfBirth: string | null;
  gender: string | null;
}

export default function PatientProfilePage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [patientData, setPatientData] = useState<PatientData | null>(null);
  const [formData, setFormData] = useState<PatientData>({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    address: "",
    dateOfBirth: "",
    gender: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
      return;
    }
    if (status === "authenticated") {
      fetchPatientData();
    }
  }, [status, router]);

  const fetchPatientData = async () => {
    try {
      setLoading(true);
      // Trouver le patient avec l'email de la session
      const res = await fetch("/api/portal/profile");
      if (res.ok) {
        const data = await res.json();
        setPatientData(data.patient);
        setFormData({
          firstName: data.patient?.firstName || "",
          lastName: data.patient?.lastName || "",
          email: data.patient?.email || "",
          phone: data.patient?.phone || "",
          address: data.patient?.address || "",
          dateOfBirth: data.patient?.dateOfBirth
            ? new Date(data.patient.dateOfBirth).toISOString().split("T")[0]
            : "",
          gender: data.patient?.gender || "",
        });
      }
    } catch (error) {
      console.error("Error fetching patient data:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setSaving(true);
      const res = await fetch("/api/portal/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Erreur lors de la mise à jour");
      }

      alert("Profil mis à jour avec succès");
      fetchPatientData();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la mise à jour du profil");
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-4xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mon Profil</h1>
        <p className="text-muted-foreground">
          Gérez vos informations personnelles
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Informations Personnelles</CardTitle>
          <CardDescription>
            Mettez à jour vos informations de contact
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="firstName">Prénom *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) =>
                    setFormData({ ...formData, firstName: e.target.value })
                  }
                  required
                />
              </div>

              <div>
                <Label htmlFor="lastName">Nom *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) =>
                    setFormData({ ...formData, lastName: e.target.value })
                  }
                  required
                />
              </div>
            </div>

            <div>
              <Label htmlFor="email">
                <Mail className="h-4 w-4 inline mr-2" />
                Email *
              </Label>
              <Input
                id="email"
                type="email"
                value={formData.email || ""}
                onChange={(e) =>
                  setFormData({ ...formData, email: e.target.value })
                }
                required
              />
            </div>

            <div>
              <Label htmlFor="phone">
                <Phone className="h-4 w-4 inline mr-2" />
                Téléphone
              </Label>
              <Input
                id="phone"
                type="tel"
                value={formData.phone || ""}
                onChange={(e) =>
                  setFormData({ ...formData, phone: e.target.value })
                }
              />
            </div>

            <div>
              <Label htmlFor="address">
                <MapPin className="h-4 w-4 inline mr-2" />
                Adresse
              </Label>
              <Input
                id="address"
                value={formData.address || ""}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dateOfBirth">Date de naissance</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, dateOfBirth: e.target.value })
                  }
                />
              </div>

              <div>
                <Label htmlFor="gender">Genre</Label>
                <select
                  id="gender"
                  value={formData.gender || ""}
                  onChange={(e) =>
                    setFormData({ ...formData, gender: e.target.value })
                  }
                  className="w-full px-3 py-2 border rounded-md"
                  aria-label="Sélectionner le genre"
                >
                  <option value="">Sélectionner</option>
                  <option value="M">Masculin</option>
                  <option value="F">Féminin</option>
                  <option value="Other">Autre</option>
                </select>
              </div>
            </div>

            <div className="flex justify-end gap-2">
              <Button type="submit" disabled={saving}>
                <Save className="h-4 w-4 mr-2" />
                {saving ? "Enregistrement..." : "Enregistrer les modifications"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Changer mot de passe */}
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>
            <Lock className="h-5 w-5 inline mr-2" />
            Changer le mot de passe
          </CardTitle>
          <CardDescription>
            Mettez à jour votre mot de passe pour sécuriser votre compte
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            La fonctionnalité de changement de mot de passe sera disponible prochainement.
            Contactez votre clinique si vous avez besoin de réinitialiser votre mot de passe.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

