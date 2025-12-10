"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import Link from "next/link";
import { Settings, Save } from "lucide-react";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  address: z.string().optional(),
  phone: z.string().optional(),
});

export default function ClinicConfigurationPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [clinic, setClinic] = useState<any>(null);

  const form = useForm<z.infer<typeof schema>>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      address: "",
      phone: "",
    },
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
    if (status === "authenticated") {
      fetchClinic();
    }
  }, [status, router]);

  const fetchClinic = async () => {
    try {
      const res = await fetch("/api/admin/clinic");
      if (!res.ok) {
        if (res.status === 403) {
          router.push("/dashboard");
          return;
        }
        // Vérifier si la réponse est du JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const errorData = await res.json();
          throw new Error(errorData.error || "Erreur lors du chargement");
        } else {
          // Si ce n'est pas du JSON, c'est probablement une erreur HTML
          throw new Error("Erreur lors du chargement de la clinique");
        }
      }
      const data = await res.json();
      if (data.clinic) {
        setClinic(data.clinic);
        form.reset({
          name: data.clinic.name || "",
          address: data.clinic.address || "",
          phone: data.clinic.phone || "",
        });
      }
    } catch (err: any) {
      console.error("Error fetching clinic:", err);
      setError(err.message || "Erreur lors du chargement");
    } finally {
      setLoading(false);
    }
  };

  const onSubmit = async (values: z.infer<typeof schema>) => {
    setSaving(true);
    setError(null);
    setSuccess(null);

    try {
      const res = await fetch("/api/admin/clinic", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });

      if (!res.ok) {
        // Vérifier si la réponse est du JSON
        const contentType = res.headers.get("content-type");
        if (contentType && contentType.includes("application/json")) {
          const data = await res.json();
          throw new Error(data.error || "Erreur lors de la sauvegarde");
        } else {
          throw new Error("Erreur lors de la sauvegarde");
        }
      }

      setSuccess("Configuration mise à jour avec succès");
      fetchClinic();
      setTimeout(() => setSuccess(null), 3000);
    } catch (err: any) {
      setError(err.message);
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
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold mb-2">Configuration de la Clinique</h1>
            <p className="text-muted-foreground">
              Gérez les informations de votre clinique
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Settings className="h-5 w-5" />
            Informations de la Clinique
          </CardTitle>
          <CardDescription>
            Modifiez les informations de base de votre clinique
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
                name="address"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Adresse</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="123 Rue Example, Ville" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="phone"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Téléphone</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="+33 1 23 45 67 89" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <div className="flex gap-2">
                <Button type="submit" disabled={saving}>
                  <Save className="h-4 w-4 mr-2" />
                  {saving ? "Enregistrement..." : "Enregistrer"}
                </Button>
                <Button type="button" variant="outline" onClick={() => form.reset()}>
                  Annuler
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>
    </div>
  );
}

