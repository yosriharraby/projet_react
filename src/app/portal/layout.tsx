"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Calendar, FileText, CreditCard, User, Stethoscope, LogOut } from "lucide-react";
import { signOut } from "next-auth/react";

export default function PortalLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
    }
  }, [status, router]);

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p>Chargement...</p>
      </div>
    );
  }

  if (!session) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut({ redirect: true, callbackUrl: "/portal/home" });
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <Link href="/portal" className="text-xl font-bold">
                  Portail Patient
                </Link>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link
                  href="/portal"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  Accueil
                </Link>
                <Link
                  href="/portal/appointments"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  <Calendar className="h-4 w-4 mr-1" />
                  Mes Rendez-vous
                </Link>
                <Link
                  href="/portal/consultations"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  <Stethoscope className="h-4 w-4 mr-1" />
                  Consultations
                </Link>
                <Link
                  href="/portal/prescriptions"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  <FileText className="h-4 w-4 mr-1" />
                  Ordonnances
                </Link>
                <Link
                  href="/portal/invoices"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  <CreditCard className="h-4 w-4 mr-1" />
                  Factures
                </Link>
                <Link
                  href="/portal/profile"
                  className="inline-flex items-center px-1 pt-1 text-sm font-medium text-muted-foreground hover:text-foreground border-b-2 border-transparent hover:border-primary transition-colors"
                >
                  <User className="h-4 w-4 mr-1" />
                  Profil
                </Link>
              </div>
            </div>
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground hidden sm:block">
                {session.user?.name || session.user?.email}
              </span>
              <Button onClick={handleSignOut} variant="ghost" size="sm">
                <LogOut className="h-4 w-4 mr-2" />
                Déconnexion
              </Button>
            </div>
          </div>
        </div>
      </nav>

      {/* Contenu */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {children}
      </main>
    </div>
  );
}

