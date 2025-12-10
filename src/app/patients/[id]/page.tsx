"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { ArrowLeft, Edit, Trash2, Calendar, FileText, User } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  address: string | null;
  bloodType: string | null;
  allergies: string | null;
  medications: string | null;
  notes: string | null;
  createdAt: string;
  appointments: {
    id: string;
    date: string;
    duration: number;
    status: string;
    notes: string | null;
    service: {
      name: string;
      price: number;
    };
    assignedUser: {
      name: string | null;
    } | null;
  }[];
  medicalRecords: {
    id: string;
    title: string;
    description: string;
    date: string;
    diagnosis: string | null;
    treatment: string | null;
    notes: string | null;
    createdBy: {
      name: string | null;
    };
  }[];
}

export default function PatientDetailPage() {
  const params = useParams();
  const router = useRouter();
  const patientId = params.id as string;

  const [patient, setPatient] = useState<Patient | null>(null);
  const [loading, setLoading] = useState(true);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);

  useEffect(() => {
    fetchPatient();
  }, [patientId]);

  const fetchPatient = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/patients/${patientId}`);
      if (!response.ok) throw new Error("Failed to fetch patient");
      const data = await response.json();
      setPatient(data.patient);
    } catch (error) {
      console.error("Error fetching patient:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    try {
      const response = await fetch(`/api/patients/${patientId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        const data = await response.json();
        alert(data.error || "Failed to delete patient");
        return;
      }

      router.push("/patients");
    } catch (error) {
      console.error("Error deleting patient:", error);
      alert("Network error. Please try again.");
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

  const calculateAge = (dateOfBirth: string | null) => {
    if (!dateOfBirth) return null;
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED":
        return "bg-blue-100 text-blue-800";
      case "CONFIRMED":
        return "bg-green-100 text-green-800";
      case "IN_PROGRESS":
        return "bg-yellow-100 text-yellow-800";
      case "COMPLETED":
        return "bg-gray-100 text-gray-800";
      case "CANCELLED":
        return "bg-red-100 text-red-800";
      case "NO_SHOW":
        return "bg-orange-100 text-orange-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!patient) {
    return (
      <div className="max-w-7xl mx-auto py-10">
        <p>Patient non trouvé.</p>
        <Link href="/patients">
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
          <Link href="/patients">
            <Button variant="outline" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold">
              {patient.firstName} {patient.lastName}
            </h1>
            {patient.dateOfBirth && (
              <p className="text-muted-foreground">
                {calculateAge(patient.dateOfBirth)} ans
                {patient.gender && ` • ${patient.gender}`}
              </p>
            )}
          </div>
        </div>
        <div className="flex gap-2">
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Edit className="h-4 w-4 mr-2" />
                Modifier
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle>Modifier le Patient</DialogTitle>
                <DialogDescription>
                  Modifiez les informations du patient.
                </DialogDescription>
              </DialogHeader>
              <EditPatientForm
                patient={patient}
                onSuccess={() => {
                  setIsEditDialogOpen(false);
                  fetchPatient();
                }}
              />
            </DialogContent>
          </Dialog>
          <Dialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="destructive">
                <Trash2 className="h-4 w-4 mr-2" />
                Supprimer
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Supprimer le Patient</DialogTitle>
                <DialogDescription>
                  Êtes-vous sûr de vouloir supprimer ce patient ? Cette action est irréversible.
                </DialogDescription>
              </DialogHeader>
              <div className="flex justify-end gap-2 mt-4">
                <Button variant="outline" onClick={() => setIsDeleteDialogOpen(false)}>
                  Annuler
                </Button>
                <Button variant="destructive" onClick={handleDelete}>
                  Supprimer
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Informations Personnelles */}
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="h-5 w-5" />
                Informations Personnelles
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium text-muted-foreground">Email</p>
                <p>{patient.email || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Téléphone</p>
                <p>{patient.phone || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Date de naissance</p>
                <p>{patient.dateOfBirth ? formatDate(patient.dateOfBirth) : "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Adresse</p>
                <p>{patient.address || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Groupe sanguin</p>
                <p>{patient.bloodType || "-"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Allergies</p>
                <p>{patient.allergies || "Aucune allergie connue"}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-muted-foreground">Médicaments actuels</p>
                <p>{patient.medications || "Aucun médicament"}</p>
              </div>
              {patient.notes && (
                <div>
                  <p className="text-sm font-medium text-muted-foreground">Notes</p>
                  <p className="text-sm">{patient.notes}</p>
                </div>
              )}
              <div>
                <p className="text-sm font-medium text-muted-foreground">Créé le</p>
                <p className="text-sm">{formatDate(patient.createdAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Historique */}
        <div className="lg:col-span-2 space-y-6">
          {/* Rendez-vous */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Calendar className="h-5 w-5" />
                Historique des Rendez-vous ({patient.appointments.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.appointments.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucun rendez-vous pour ce patient.
                </p>
              ) : (
                <div className="space-y-4">
                  {patient.appointments.map((appointment) => (
                    <div key={appointment.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">
                            {formatDateTime(appointment.date)}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {appointment.service.name} • {appointment.duration} min • ${appointment.service.price}
                          </p>
                        </div>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </div>
                      {appointment.assignedUser && (
                        <p className="text-xs text-muted-foreground">
                          Médecin: {appointment.assignedUser.name}
                        </p>
                      )}
                      {appointment.notes && (
                        <p className="text-sm text-muted-foreground mt-2">
                          {appointment.notes}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Dossiers Médicaux */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                Dossiers Médicaux ({patient.medicalRecords.length})
              </CardTitle>
            </CardHeader>
            <CardContent>
              {patient.medicalRecords.length === 0 ? (
                <p className="text-muted-foreground text-sm">
                  Aucun dossier médical pour ce patient.
                </p>
              ) : (
                <div className="space-y-4">
                  {patient.medicalRecords.map((record) => (
                    <div key={record.id} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <div>
                          <p className="font-medium">{record.title}</p>
                          <p className="text-sm text-muted-foreground">
                            {formatDate(record.date)} • Par {record.createdBy.name}
                          </p>
                        </div>
                      </div>
                      <p className="text-sm mb-2">{record.description}</p>
                      {record.diagnosis && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Diagnostic:</p>
                          <p className="text-sm text-muted-foreground">{record.diagnosis}</p>
                        </div>
                      )}
                      {record.treatment && (
                        <div className="mb-2">
                          <p className="text-sm font-medium">Traitement:</p>
                          <p className="text-sm text-muted-foreground">{record.treatment}</p>
                        </div>
                      )}
                      {record.notes && (
                        <p className="text-xs text-muted-foreground">{record.notes}</p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Edit Patient Form Component
function EditPatientForm({
  patient,
  onSuccess,
}: {
  patient: Patient;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    firstName: patient.firstName,
    lastName: patient.lastName,
    email: patient.email || "",
    phone: patient.phone || "",
    dateOfBirth: patient.dateOfBirth
      ? new Date(patient.dateOfBirth).toISOString().split("T")[0]
      : "",
    gender: patient.gender || "",
    address: patient.address || "",
    bloodType: patient.bloodType || "",
    allergies: patient.allergies || "",
    medications: patient.medications || "",
    notes: patient.notes || "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch(`/api/patients/${patient.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to update patient");
        return;
      }

      onSuccess();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Prénom *</label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Nom *</label>
          <Input
            value={formData.lastName}
            onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
            required
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Email</label>
          <Input
            type="email"
            value={formData.email}
            onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Téléphone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Date de naissance</label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Genre</label>
          <Input
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Adresse</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Groupe sanguin</label>
        <Input
          value={formData.bloodType}
          onChange={(e) => setFormData({ ...formData, bloodType: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Allergies</label>
        <Input
          value={formData.allergies}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          placeholder="Liste des allergies connues"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Médicaments actuels</label>
        <Input
          value={formData.medications}
          onChange={(e) => setFormData({ ...formData, medications: e.target.value })}
          placeholder="Liste des médicaments actuels"
        />
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Enregistrement..." : "Enregistrer"}
        </Button>
      </div>
    </form>
  );
}

