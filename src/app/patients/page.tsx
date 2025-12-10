"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Search, Edit, Trash2, Eye } from "lucide-react";
import Link from "next/link";

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string | null;
  gender: string | null;
  createdAt: string;
}

interface PatientsResponse {
  patients: Patient[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

export default function PatientsPage() {
  const [patients, setPatients] = useState<Patient[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalPatients, setTotalPatients] = useState(0);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchPatients = async () => {
    try {
      setLoading(true);
      setError(null);
      const params = new URLSearchParams({
        page: page.toString(),
        limit: "10",
        ...(search && { search }),
      });

      const response = await fetch(`/api/patients?${params}`);
      
      if (!response.ok) {
        // Try to get error details from response
        let errorMessage = "Failed to fetch patients";
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorData.details || errorMessage;
          console.error("[fetchPatients] Error response:", errorData);
          
          // Handle specific error cases
          if (response.status === 401) {
            errorMessage = "Vous devez être connecté pour voir les patients. Veuillez vous reconnecter.";
          } else if (response.status === 404) {
            errorMessage = "Aucune clinique trouvée. Contactez l'administrateur.";
          } else if (response.status === 403) {
            errorMessage = "Vous n'avez pas la permission de voir les patients.";
          }
        } catch (e) {
          console.error("[fetchPatients] Failed to parse error response");
          if (response.status === 401) {
            errorMessage = "Vous devez être connecté pour voir les patients.";
          } else if (response.status === 500) {
            errorMessage = "Erreur serveur. Veuillez réessayer plus tard.";
          }
        }
        setError(errorMessage);
        setPatients([]);
        setTotalPages(1);
        setTotalPatients(0);
        return;
      }
      
      const data: PatientsResponse = await response.json();
      setPatients(data.patients || []);
      setTotalPages(data.pagination?.pages || 1);
      setTotalPatients(data.pagination?.total || 0);
      setError(null); // Clear any previous errors
    } catch (error: any) {
      console.error("[fetchPatients] Error fetching patients:", error);
      console.error("[fetchPatients] Error message:", error.message);
      console.error("[fetchPatients] Error stack:", error.stack);
      
      // Set user-friendly error message
      const errorMessage = error.message || "Une erreur s'est produite lors du chargement des patients. Vérifiez votre connexion et réessayez.";
      setError(errorMessage);
      setPatients([]);
      setTotalPages(1);
      setTotalPatients(0);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPatients();
  }, [page, search]);

  const handleSearch = (value: string) => {
    setSearch(value);
    setPage(1); // Reset to first page when searching
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString();
  };

  const calculateAge = (dateOfBirth: string) => {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    return age;
  };

  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Patients</h1>
        <p className="text-muted-foreground">
          Manage your clinic's patients ({totalPatients} total)
        </p>
      </div>

      {/* Search and Add Patient */}
      <div className="flex justify-between items-center mb-6">
        <div className="relative w-96">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground h-4 w-4" />
          <Input
            placeholder="Search patients..."
            value={search}
            onChange={(e) => handleSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Patient
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Add New Patient</DialogTitle>
              <DialogDescription>
                Enter the patient's information to add them to your clinic.
              </DialogDescription>
            </DialogHeader>
            <AddPatientForm onSuccess={() => {
              setIsAddDialogOpen(false);
              fetchPatients();
            }} />
          </DialogContent>
        </Dialog>
      </div>

      {/* Patients Table */}
      <Card>
        <CardHeader>
          <CardTitle>Patient List</CardTitle>
          <CardDescription>
            {search ? `Search results for "${search}"` : "All patients in your clinic"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => fetchPatients()}
              >
                Réessayer
              </Button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <p>Loading patients...</p>
            </div>
          ) : error ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Impossible de charger les patients. Veuillez réessayer.
              </p>
            </div>
          ) : patients.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                {search ? "No patients found matching your search." : "No patients yet. Add your first patient to get started."}
              </p>
            </div>
          ) : (
            <>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Age</TableHead>
                    <TableHead>Gender</TableHead>
                    <TableHead>Added</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {patients.map((patient) => (
                    <TableRow key={patient.id}>
                      <TableCell className="font-medium">
                        {patient.firstName} {patient.lastName}
                      </TableCell>
                      <TableCell>
                        <div>
                          {patient.email && <div className="text-sm">{patient.email}</div>}
                          {patient.phone && <div className="text-sm text-muted-foreground">{patient.phone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        {patient.dateOfBirth ? `${calculateAge(patient.dateOfBirth)} years` : "-"}
                      </TableCell>
                      <TableCell>
                        {patient.gender ? (
                          <Badge variant="outline">{patient.gender}</Badge>
                        ) : (
                          "-"
                        )}
                      </TableCell>
                      <TableCell>{formatDate(patient.createdAt)}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Link href={`/patients/${patient.id}`}>
                            <Button variant="outline" size="sm" title="Voir détails">
                              <Eye className="h-4 w-4" />
                            </Button>
                          </Link>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex justify-center items-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    onClick={() => setPage(page - 1)}
                    disabled={page === 1}
                  >
                    Previous
                  </Button>
                  <span className="text-sm">
                    Page {page} of {totalPages}
                  </span>
                  <Button
                    variant="outline"
                    onClick={() => setPage(page + 1)}
                    disabled={page === totalPages}
                  >
                    Next
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// Add Patient Form Component
function AddPatientForm({ onSuccess }: { onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dateOfBirth: "",
    gender: "",
    address: "",
    bloodType: "",
    allergies: "",
    medications: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/patients", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await response.json();

      if (!response.ok) {
        // Use the error message from the API or a fallback
        const errorMessage = data.error || data.details || "Échec de la création du patient";
        setError(errorMessage);
        console.error("[AddPatientForm] Error creating patient:", data);
        return;
      }

      // Success - reset form and call onSuccess
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        dateOfBirth: "",
        gender: "",
        address: "",
        bloodType: "",
        allergies: "",
        medications: "",
        notes: "",
      });
      onSuccess();
    } catch (err: any) {
      console.error("[AddPatientForm] Network error:", err);
      setError("Erreur réseau. Vérifiez votre connexion et réessayez.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">First Name *</label>
          <Input
            value={formData.firstName}
            onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
            required
          />
        </div>
        <div>
          <label className="text-sm font-medium">Last Name *</label>
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
          <label className="text-sm font-medium">Phone</label>
          <Input
            value={formData.phone}
            onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
          />
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="text-sm font-medium">Date of Birth</label>
          <Input
            type="date"
            value={formData.dateOfBirth}
            onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
          />
        </div>
        <div>
          <label className="text-sm font-medium">Gender</label>
          <Input
            value={formData.gender}
            onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
          />
        </div>
      </div>

      <div>
        <label className="text-sm font-medium">Address</label>
        <Input
          value={formData.address}
          onChange={(e) => setFormData({ ...formData, address: e.target.value })}
        />
      </div>

      <div>
        <label className="text-sm font-medium">Allergies</label>
        <Input
          value={formData.allergies}
          onChange={(e) => setFormData({ ...formData, allergies: e.target.value })}
          placeholder="List any known allergies"
        />
      </div>

      {error && (
        <div className="p-3 bg-destructive/10 border border-destructive/20 rounded-md">
          <p className="text-destructive text-sm font-medium">{error}</p>
          {error.includes("clinique") && (
            <p className="text-muted-foreground text-xs mt-2">
              💡 Astuce : Si vous êtes un ADMIN, assurez-vous d'avoir créé une clinique et d'y être membre.
            </p>
          )}
        </div>
      )}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Creating..." : "Create Patient"}
        </Button>
      </div>
    </form>
  );
}
