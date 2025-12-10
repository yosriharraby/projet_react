"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tag, ArrowLeft } from "lucide-react";

export default function PricingManagementPage() {
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
            <h1 className="text-3xl font-bold mb-2">Gestion des Tarifs</h1>
            <p className="text-muted-foreground">
              Gérez les tarifs de vos services médicaux
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

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tarification des Services
          </CardTitle>
          <CardDescription>
            Les tarifs sont définis directement lors de la création ou modification des services.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h3 className="font-semibold mb-2">Comment gérer les tarifs ?</h3>
              <p className="text-sm text-muted-foreground mb-4">
                Pour définir ou modifier les tarifs de vos services médicaux :
              </p>
              <ol className="list-decimal list-inside space-y-2 text-sm text-muted-foreground mb-4">
                <li>Allez dans la section "Gestion des Services"</li>
                <li>Créez un nouveau service ou modifiez un service existant</li>
                <li>Définissez le prix lors de la création/modification</li>
                <li>Le tarif sera appliqué automatiquement aux factures</li>
              </ol>
              <Button asChild>
                <Link href="/services">
                  Gérer les Services
                </Link>
              </Button>
            </div>

            <div className="p-4 bg-muted rounded-lg">
              <h3 className="font-semibold mb-2">Information</h3>
              <p className="text-sm text-muted-foreground">
                Les tarifs peuvent être modifiés à tout moment. Les factures existantes conservent le prix au moment de leur création.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

