"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, ArrowLeft, Shield, Bell, Database } from "lucide-react";

export default function SettingsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/login");
      return;
    }
  }, [status, router]);

  if (status === "loading") {
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
            <h1 className="text-3xl font-bold mb-2">Paramètres & Configuration</h1>
            <p className="text-muted-foreground">
              Gérez les paramètres de votre système
            </p>
          </div>
          <Button asChild variant="outline">
            <Link href="/dashboard">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Retour au Dashboard
            </Link>
          </Button>
        </div>
      </div>

      <div className="space-y-6">
        {/* Configuration de la Clinique */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="h-5 w-5" />
              Configuration de la Clinique
            </CardTitle>
            <CardDescription>
              Informations générales de votre clinique
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Modifiez le nom, l'adresse et les coordonnées de votre clinique.
            </p>
            <Button asChild>
              <Link href="/admin/clinic">
                Configurer la Clinique
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gestion des Services */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Gestion des Services
            </CardTitle>
            <CardDescription>
              Créez et gérez vos services médicaux
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez, modifiez ou supprimez les services offerts par votre clinique.
            </p>
            <Button asChild>
              <Link href="/services">
                Gérer les Services
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Gestion du Staff */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Gestion du Personnel
            </CardTitle>
            <CardDescription>
              Gérez les médecins et réceptionnistes
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Ajoutez des médecins et réceptionnistes à votre clinique.
            </p>
            <Button asChild>
              <Link href="/admin/staff">
                Gérer le Staff
              </Link>
            </Button>
          </CardContent>
        </Card>

        {/* Fonctionnalités à venir */}
        <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5" />
              Fonctionnalités à venir
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              D'autres paramètres seront disponibles dans les prochaines versions :
              notifications par email, intégration de paiement, export de données, etc.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

