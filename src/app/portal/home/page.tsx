"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { signIn } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Stethoscope, Calendar, FileText, CreditCard, Shield, Heart } from "lucide-react";

export default function PortalHomePage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email ou mot de passe incorrect");
      } else if (result?.ok) {
        router.push("/portal");
        router.refresh();
      }
    } catch (err) {
      setError("Erreur de connexion. Veuillez réessayer.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-gray-900 dark:to-gray-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <Stethoscope className="h-12 w-12 text-blue-600 dark:text-blue-400" />
          </div>
          <h1 className="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Portail Patient MedFlow
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Accédez à vos rendez-vous, consultations, ordonnances et factures en toute simplicité
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Formulaire de connexion */}
          <Card className="shadow-lg">
            <CardHeader>
              <CardTitle>Connexion</CardTitle>
              <CardDescription>
                Connectez-vous pour accéder à votre espace patient
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleLogin} className="space-y-4">
                {error && (
                  <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                    <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                  </div>
                )}
                
                <div>
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="votre.email@example.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <Label htmlFor="password">Mot de passe</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                  />
                </div>

                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "Connexion..." : "Se connecter"}
                </Button>

                <div className="text-center text-sm text-muted-foreground">
                  <p>Pas encore de compte ?</p>
                  <Link href="/register" className="text-blue-600 hover:underline">
                    Créer un compte patient
                  </Link>
                </div>
              </form>
            </CardContent>
          </Card>

          {/* Description des services */}
          <div className="space-y-6">
            <Card className="shadow-lg">
              <CardHeader>
                <CardTitle>Nos Services</CardTitle>
                <CardDescription>
                  Gérez facilement tous vos besoins médicaux
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-3">
                    <Calendar className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Rendez-vous</h3>
                      <p className="text-sm text-muted-foreground">
                        Réservez, modifiez ou annulez vos rendez-vous en ligne
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Stethoscope className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Consultations</h3>
                      <p className="text-sm text-muted-foreground">
                        Consultez l'historique de vos consultations médicales
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <FileText className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Ordonnances</h3>
                      <p className="text-sm text-muted-foreground">
                        Téléchargez vos ordonnances en format PDF
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <CreditCard className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Factures</h3>
                      <p className="text-sm text-muted-foreground">
                        Consultez et payez vos factures en ligne
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3">
                    <Shield className="h-5 w-5 text-blue-600 mt-0.5" />
                    <div>
                      <h3 className="font-semibold">Sécurité</h3>
                      <p className="text-sm text-muted-foreground">
                        Vos données médicales sont protégées et confidentielles
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800">
              <CardContent className="pt-6">
                <div className="flex items-center gap-3 mb-4">
                  <Heart className="h-6 w-6 text-blue-600" />
                  <h3 className="font-semibold">Besoin d'aide ?</h3>
                </div>
                <p className="text-sm text-muted-foreground mb-4">
                  Si vous avez des questions ou besoin d'assistance, contactez votre clinique.
                </p>
                <Button variant="outline" className="w-full">
                  Contacter la clinique
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}

