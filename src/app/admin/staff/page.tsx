"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { UserPlus, Stethoscope, User, Search, X } from "lucide-react";
import Link from "next/link";

interface User {
  id: string;
  email: string;
  name: string | null;
  defaultRole: string | null;
}

interface Membership {
  id: string;
  role: string;
  user: User;
}

export default function StaffManagementPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [loadingStaff, setLoadingStaff] = useState(false);
  const [staff, setStaff] = useState<Membership[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [searchEmail, setSearchEmail] = useState("");
  const [showAddForm, setShowAddForm] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<"DOCTOR" | "RECEPTIONIST">("DOCTOR");
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchStaff();
      fetchAvailableUsers();
    }
  }, [status, router]);

  const fetchStaff = async () => {
    try {
      setLoadingStaff(true);
      setError(null);
      console.log("[fetchStaff] Starting fetch...");
      
      const res = await fetch("/api/admin/staff");
      console.log("[fetchStaff] Response status:", res.status);
      console.log("[fetchStaff] Response headers:", Object.fromEntries(res.headers.entries()));
      
      if (!res.ok) {
        // Lire le texte de la réponse d'abord
        const responseText = await res.text();
        console.error("[fetchStaff] Response text:", responseText);
        
        let errorMessage = "Erreur lors du chargement du staff";
        
        // Gérer les codes d'erreur spécifiques
        if (res.status === 403) {
          errorMessage = "Vous n'avez pas les permissions nécessaires";
          setError(errorMessage);
          router.push("/dashboard");
          return;
        }
        if (res.status === 401) {
          errorMessage = "Vous devez être connecté";
          setError(errorMessage);
          router.push("/login");
          return;
        }
        if (res.status === 404) {
          errorMessage = "Aucune clinique trouvée. Veuillez créer une clinique d'abord.";
          setError(errorMessage);
          return;
        }
        
        // Essayer de parser en JSON
        try {
          const errorData = JSON.parse(responseText);
          console.error("[fetchStaff] Error data (parsed):", errorData);
          errorMessage = errorData.error || errorData.details || errorMessage;
        } catch (parseError) {
          // Si ce n'est pas du JSON, utiliser le texte brut ou un message basé sur le statut
          console.error("[fetchStaff] Failed to parse error response as JSON:", parseError);
          if (responseText && responseText.trim().length > 0) {
            errorMessage = responseText;
          } else {
            errorMessage = `Erreur serveur (${res.status})`;
          }
        }
        
        throw new Error(errorMessage);
      }
      
      const responseText = await res.text();
      console.log("[fetchStaff] Response text:", responseText);
      
      let data;
      try {
        data = JSON.parse(responseText);
      } catch (parseError) {
        console.error("[fetchStaff] Failed to parse response as JSON:", parseError);
        throw new Error("Réponse invalide du serveur");
      }
      
      console.log("[fetchStaff] Staff data received:", data);
      setStaff(data.staff || []);
      setError(null);
    } catch (err: any) {
      console.error("[fetchStaff] Error:", err);
      console.error("[fetchStaff] Error stack:", err.stack);
      setError(err.message || "Erreur lors du chargement du staff");
    } finally {
      setLoadingStaff(false);
      setLoading(false);
    }
  };

  const fetchAvailableUsers = async () => {
    try {
      const res = await fetch("/api/admin/available-users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data.users || []);
      }
    } catch (err) {
      console.error("Erreur lors du chargement des utilisateurs:", err);
    }
  };

  const handleSearch = async () => {
    if (!searchEmail.trim()) {
      setError("Veuillez entrer un email");
      return;
    }

    try {
      const res = await fetch(`/api/admin/search-user?email=${encodeURIComponent(searchEmail)}`);
      if (!res.ok) {
        throw new Error("Utilisateur non trouvé");
      }
      const data = await res.json();
      setSelectedUser(data.user);
      setShowAddForm(true);
      setError(null);
    } catch (err: any) {
      setError(err.message);
      setSelectedUser(null);
    }
  };

  const handleAddStaff = async () => {
    if (!selectedUser) {
      setError("Veuillez sélectionner un utilisateur");
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const res = await fetch("/api/admin/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: selectedUser.id,
          role: selectedRole,
        }),
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de l'ajout");
      }

      const data = await res.json();
      setSuccess(data.message || `${selectedUser.name || selectedUser.email} a été ajouté comme ${selectedRole === "DOCTOR" ? "médecin" : "réceptionniste"}`);
      setSelectedUser(null);
      setShowAddForm(false);
      setSearchEmail("");
      
      // Recharger le staff et les utilisateurs disponibles
      await fetchStaff();
      await fetchAvailableUsers();
      
      // Effacer le message de succès après 3 secondes
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error adding staff:", err);
      setError(err.message || "Erreur lors de l'ajout du membre");
    }
  };

  const handleRemoveStaff = async (membershipId: string, userName: string) => {
    if (!confirm(`Êtes-vous sûr de vouloir retirer ${userName} de la clinique ?`)) {
      return;
    }

    try {
      setError(null);
      setSuccess(null);
      const res = await fetch(`/api/admin/staff/${membershipId}`, {
        method: "DELETE",
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Erreur lors de la suppression");
      }

      setSuccess(`${userName} a été retiré de la clinique`);
      await fetchStaff();
      await fetchAvailableUsers();
      
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      console.error("Error removing staff:", err);
      setError(err.message || "Erreur lors de la suppression");
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Gestion du Staff</h1>
            <p className="text-muted-foreground">
              Ajoutez des médecins et réceptionnistes à votre clinique
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">← Retour au Dashboard</Link>
          </Button>
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
          <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
        </div>
      )}

      {success && (
        <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
          <p className="text-green-600 dark:text-green-400 text-sm">{success}</p>
        </div>
      )}

      {/* Formulaire d'ajout */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>Ajouter un membre au staff</CardTitle>
          <CardDescription>
            Recherchez un utilisateur par email et ajoutez-le à votre clinique
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex gap-2">
              <div className="flex-1">
                <Input
                  type="email"
                  placeholder="Email de l'utilisateur (ex: doctor@example.com)"
                  value={searchEmail}
                  onChange={(e) => {
                    setSearchEmail(e.target.value);
                    setError(null);
                  }}
                  onKeyPress={(e) => {
                    if (e.key === "Enter") {
                      handleSearch();
                    }
                  }}
                />
              </div>
              <Button onClick={handleSearch} disabled={!searchEmail.trim()}>
                <Search className="h-4 w-4 mr-2" />
                Rechercher
              </Button>
            </div>

            {selectedUser && (
              <div className="p-4 border rounded-md bg-muted">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="font-medium">{selectedUser.name || "Sans nom"}</p>
                    <p className="text-sm text-muted-foreground">{selectedUser.email}</p>
                    {selectedUser.defaultRole && (
                      <Badge variant="outline" className="mt-2">
                        Rôle initial: {selectedUser.defaultRole}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setSelectedUser(null);
                      setSearchEmail("");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="space-y-3">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Attribuer le rôle:
                    </label>
                    <div className="flex gap-2">
                      <Button
                        variant={selectedRole === "DOCTOR" ? "default" : "outline"}
                        onClick={() => setSelectedRole("DOCTOR")}
                        className="flex-1"
                      >
                        <Stethoscope className="h-4 w-4 mr-2" />
                        Médecin
                      </Button>
                      <Button
                        variant={selectedRole === "RECEPTIONIST" ? "default" : "outline"}
                        onClick={() => setSelectedRole("RECEPTIONIST")}
                        className="flex-1"
                      >
                        <User className="h-4 w-4 mr-2" />
                        Réceptionniste
                      </Button>
                    </div>
                  </div>

                  <Button onClick={handleAddStaff} className="w-full">
                    <UserPlus className="h-4 w-4 mr-2" />
                    Ajouter à la clinique
                  </Button>
                </div>
              </div>
            )}

            {/* Liste des utilisateurs disponibles */}
            {users.length > 0 && !selectedUser && (
              <div className="mt-4">
                <p className="text-sm font-medium mb-2">Utilisateurs disponibles (sans clinique):</p>
                <div className="space-y-2">
                  {users.slice(0, 5).map((user) => (
                    <div
                      key={user.id}
                      className="p-3 border rounded-md flex items-center justify-between cursor-pointer hover:bg-muted"
                      onClick={() => {
                        setSelectedUser(user);
                        setSearchEmail(user.email);
                        setError(null);
                      }}
                    >
                      <div>
                        <p className="font-medium text-sm">{user.name || "Sans nom"}</p>
                        <p className="text-xs text-muted-foreground">{user.email}</p>
                        {user.defaultRole && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            {user.defaultRole}
                          </Badge>
                        )}
                      </div>
                      <Button variant="ghost" size="sm">
                        Sélectionner
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Liste du staff actuel */}
      <Card>
        <CardHeader>
          <CardTitle>Staff actuel</CardTitle>
          <CardDescription>
            Liste des médecins et réceptionnistes de votre clinique
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loadingStaff ? (
            <p className="text-muted-foreground text-center py-8">
              Chargement du staff...
            </p>
          ) : staff.length === 0 ? (
            <p className="text-muted-foreground text-center py-8">
              Aucun membre du staff pour le moment. Ajoutez-en un ci-dessus.
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nom</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Rôle</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {staff.map((member) => (
                  <TableRow key={member.id}>
                    <TableCell className="font-medium">
                      {member.user?.name || "Sans nom"}
                    </TableCell>
                    <TableCell>{member.user?.email || "N/A"}</TableCell>
                    <TableCell>
                      <Badge variant={member.role === "DOCTOR" ? "default" : "outline"}>
                        {member.role === "DOCTOR" ? (
                          <>
                            <Stethoscope className="h-3 w-3 mr-1" />
                            Médecin
                          </>
                        ) : (
                          <>
                            <User className="h-3 w-3 mr-1" />
                            Réceptionniste
                          </>
                        )}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() =>
                          handleRemoveStaff(
                            member.id,
                            member.user?.name || member.user?.email || "Utilisateur"
                          )
                        }
                      >
                        Retirer
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

