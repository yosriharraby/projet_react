"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { FileText, Download, Calendar, User, CreditCard } from "lucide-react";

interface Document {
  id: string;
  type: "prescription" | "invoice" | "receipt";
  title: string;
  date: string;
  downloadUrl: string;
}

export default function PatientDocumentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [documents, setDocuments] = useState<Document[]>([]);
  const [filter, setFilter] = useState<"all" | "prescription" | "invoice" | "receipt">("all");

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
      return;
    }
    if (status === "authenticated") {
      fetchDocuments();
    }
  }, [status, router]);

  const fetchDocuments = async () => {
    try {
      setLoading(true);
      
      // Récupérer les ordonnances
      const prescriptionsRes = await fetch("/api/portal/prescriptions");
      if (prescriptionsRes.ok) {
        const prescriptionsData = await prescriptionsRes.json();
        const prescriptionDocs: Document[] = (prescriptionsData.prescriptions || []).map(
          (prescription: any) => ({
            id: prescription.id,
            type: "prescription" as const,
            title: `Ordonnance du ${new Date(prescription.createdAt).toLocaleDateString("fr-FR")}`,
            date: prescription.createdAt,
            downloadUrl: `/api/prescriptions/${prescription.id}/pdf`,
          })
        );
        setDocuments((prev) => [...prev, ...prescriptionDocs]);
      }

      // TODO: Ajouter les factures et reçus quand le modèle Invoice sera créé
    } catch (error) {
      console.error("Error fetching documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (document: Document) => {
    try {
      const res = await fetch(document.downloadUrl);
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `${document.title}.pdf`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
      } else {
        alert("Erreur lors du téléchargement");
      }
    } catch (error) {
      console.error("Error downloading document:", error);
      alert("Erreur lors du téléchargement");
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  const filteredDocuments = documents.filter((doc) => {
    if (filter === "all") return true;
    return doc.type === filter;
  });

  const getDocumentIcon = (type: string) => {
    switch (type) {
      case "prescription":
        return <FileText className="h-5 w-5" />;
      case "invoice":
        return <CreditCard className="h-5 w-5" />;
      case "receipt":
        return <CreditCard className="h-5 w-5" />;
      default:
        return <FileText className="h-5 w-5" />;
    }
  };

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Mes Documents</h1>
        <p className="text-muted-foreground">
          Tous vos documents téléchargeables en un seul endroit
        </p>
      </div>

      {/* Filtres */}
      <div className="flex gap-2 mb-6">
        <Button
          variant={filter === "all" ? "default" : "outline"}
          onClick={() => setFilter("all")}
        >
          Tous ({documents.length})
        </Button>
        <Button
          variant={filter === "prescription" ? "default" : "outline"}
          onClick={() => setFilter("prescription")}
        >
          Ordonnances ({documents.filter((d) => d.type === "prescription").length})
        </Button>
        <Button
          variant={filter === "invoice" ? "default" : "outline"}
          onClick={() => setFilter("invoice")}
          disabled
        >
          Factures (0)
        </Button>
        <Button
          variant={filter === "receipt" ? "default" : "outline"}
          onClick={() => setFilter("receipt")}
          disabled
        >
          Reçus (0)
        </Button>
      </div>

      {/* Liste des documents */}
      <Card>
        <CardContent className="pt-6">
          {filteredDocuments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {filter === "all"
                  ? "Aucun document disponible."
                  : `Aucun document de type "${filter}" disponible.`}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredDocuments.map((document) => (
                <div
                  key={document.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4 flex-1">
                      <div className="p-3 bg-muted rounded-md">
                        {getDocumentIcon(document.type)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold">{document.title}</h3>
                        <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                          <div className="flex items-center gap-1">
                            <Calendar className="h-4 w-4" />
                            {new Date(document.date).toLocaleDateString("fr-FR", {
                              year: "numeric",
                              month: "long",
                              day: "numeric",
                            })}
                          </div>
                          <span className="capitalize">{document.type}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {document.type === "prescription" && (
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/portal/prescriptions/${document.id}`}>
                            Voir
                          </Link>
                        </Button>
                      )}
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => handleDownload(document)}
                      >
                        <Download className="h-4 w-4 mr-2" />
                        Télécharger
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

