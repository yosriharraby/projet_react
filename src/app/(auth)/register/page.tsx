"use client";
import { useState } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useRouter } from "next/navigation";
import { User, Stethoscope, UserCog, Users } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.string().min(1, "Veuillez sélectionner un rôle").refine((val) => ["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(val), {
    message: "Rôle invalide",
  }),
  // Champs conditionnels pour ADMIN
  clinicName: z.string().optional(),
  clinicAddress: z.string().optional(),
  clinicPhone: z.string().optional(),
}).refine((data) => {
  // Si ADMIN, le nom de la clinique est obligatoire
  if (data.role === "ADMIN" && (!data.clinicName || data.clinicName.trim().length === 0)) {
    return false;
  }
  return true;
}, {
  message: "Le nom de la clinique est obligatoire pour les administrateurs",
  path: ["clinicName"],
});

export default function RegisterPage() {
  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      role: "",
      clinicName: "",
      clinicAddress: "",
      clinicPhone: "",
    },
  });

  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const selectedRole = form.watch("role");

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null);
    setIsLoading(true);

    try {
      const res = await fetch("/api/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

    const data = await res.json();

    if (!res.ok) {
        setError(data?.error || "Échec de l'inscription");
      return;
      }

      // Redirection vers login avec message de succès
      // La redirection vers le bon dashboard sera gérée après login
      if (values.role === "PATIENT") {
        router.replace("/login?message=Inscription réussie. Connectez-vous pour accéder à votre espace patient.");
      } else if (values.role === "ADMIN") {
        router.replace("/login?message=Inscription réussie. Votre clinique a été créée. Connectez-vous pour continuer.");
      } else if (values.role === "DOCTOR") {
        router.replace("/login?message=Inscription réussie. Un administrateur devra vous ajouter à une clinique. Connectez-vous pour accéder à votre espace médecin.");
      } else {
        router.replace("/login?message=Inscription réussie. Un administrateur devra vous ajouter à une clinique. Connectez-vous pour accéder à votre espace réceptionniste.");
      }
    } catch (err) {
      setError("Erreur réseau. Veuillez réessayer.");
    } finally {
      setIsLoading(false);
    }
  }

  const getRoleIcon = (role: string) => {
    switch (role) {
      case "ADMIN":
        return <UserCog className="h-5 w-5" />;
      case "DOCTOR":
        return <Stethoscope className="h-5 w-5" />;
      case "RECEPTIONIST":
        return <User className="h-5 w-5" />;
      case "PATIENT":
        return <Users className="h-5 w-5" />;
      default:
        return null;
    }
  };

  const getRoleDescription = (role: string) => {
    switch (role) {
      case "ADMIN":
        return "Propriétaire de clinique - Gère tout (patients, services, staff, rendez-vous)";
      case "DOCTOR":
        return "Médecin - Gère son agenda, crée des ordonnances, consulte les dossiers patients";
      case "RECEPTIONIST":
        return "Réceptionniste - Gère les rendez-vous, enregistre les patients, gère la facturation";
      case "PATIENT":
        return "Patient - Accède au portail public pour réserver des rendez-vous et payer";
      default:
        return "";
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Créer un compte</CardTitle>
          <CardDescription>
            Choisissez votre rôle pour commencer
          </CardDescription>
        </CardHeader>
        <CardContent>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom complet *</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Jean Dupont" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email *</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="jean@email.com" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Mot de passe *</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="Minimum 6 caractères" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="role"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Je suis un(e) *</FormLabel>
                    <FormControl>
                      <select
                        value={field.value || ""}
                        onChange={(e) => field.onChange(e.target.value)}
                        aria-label="Sélectionner votre rôle"
                        className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        <option value="">Sélectionnez votre rôle</option>
                        <option value="ADMIN">👨‍💼 Administrateur (Propriétaire de clinique)</option>
                        <option value="DOCTOR">👨‍⚕️ Médecin</option>
                        <option value="RECEPTIONIST">👤 Réceptionniste</option>
                        <option value="PATIENT">👥 Patient</option>
                      </select>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {/* Description du rôle sélectionné - en dehors du FormDescription pour éviter l'erreur HTML */}
              {selectedRole && (
                <div className="flex items-start gap-2 mt-2 p-3 bg-muted rounded-md">
                  {getRoleIcon(selectedRole)}
                  <span className="text-sm">{getRoleDescription(selectedRole)}</span>
                </div>
              )}

              {/* Champs conditionnels pour ADMIN */}
              {selectedRole === "ADMIN" && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-sm font-semibold">Informations de la clinique</h3>
                  <FormField
                    control={form.control}
                    name="clinicName"
                    render={({ field }) => (
            <FormItem>
                        <FormLabel>Nom de la clinique *</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Clinique Santé" />
                        </FormControl>
              <FormMessage />
            </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clinicAddress"
                    render={({ field }) => (
            <FormItem>
                        <FormLabel>Adresse de la clinique</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="123 Rue Example, Ville" />
                        </FormControl>
              <FormMessage />
            </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="clinicPhone"
                    render={({ field }) => (
            <FormItem>
                        <FormLabel>Téléphone de la clinique</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="+33 1 23 45 67 89" />
                        </FormControl>
              <FormMessage />
            </FormItem>
                    )}
                  />
                </div>
              )}

              {selectedRole === "DOCTOR" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm text-muted-foreground">
                  💡 <strong>Note:</strong> Votre compte sera créé. Un administrateur devra vous ajouter à une clinique pour que vous puissiez accéder à votre espace.
                </div>
              )}

              {selectedRole === "RECEPTIONIST" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm text-muted-foreground">
                  💡 <strong>Note:</strong> Votre compte sera créé. Un administrateur devra vous ajouter à une clinique pour que vous puissiez accéder à votre espace.
                </div>
              )}

              {selectedRole === "PATIENT" && (
                <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-md text-sm text-muted-foreground">
                  💡 <strong>Note:</strong> Vous pourrez accéder au portail patient pour réserver des rendez-vous et gérer vos factures.
                </div>
              )}

              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={isLoading}>
                {isLoading ? "Création du compte..." : "Créer mon compte"}
              </Button>

              <div className="text-center text-sm text-muted-foreground">
                Vous avez déjà un compte ?{" "}
                <a href="/login" className="text-primary hover:underline">
                  Se connecter
                </a>
              </div>
        </form>
      </Form>
        </CardContent>
      </Card>
    </div>
  );
}


