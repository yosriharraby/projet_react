"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { CreditCard } from "lucide-react";

export default function PatientInvoicesPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
      return;
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Factures</h1>
        <p className="text-muted-foreground">
          Consultez vos factures
        </p>
      </div>

      <Card className="border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-950/20">
        <CardContent className="pt-6">
          <div className="text-center">
            <CreditCard className="h-12 w-12 mx-auto text-blue-600 mb-4" />
            <p className="font-semibold mb-2">Fonctionnalité à venir</p>
            <p className="text-sm text-muted-foreground">
              Le module de facturation sera disponible dans le Sprint 4.
              Vous pourrez consulter vos factures et leur statut de paiement.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
