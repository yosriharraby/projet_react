"use client";
import { useState, useEffect } from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

const schema = z.object({
  email: z.string().email(),
  password: z.string().min(6),
});

export default function LoginPage() {
  const form = useForm<z.infer<typeof schema>>({ resolver: zodResolver(schema), defaultValues: { email: "", password: "" } });
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const router = useRouter();
  const searchParams = useSearchParams();

  useEffect(() => {
    const message = searchParams.get("message");
    if (message) {
      setSuccessMessage(message);
    }
  }, [searchParams]);

  async function onSubmit(values: z.infer<typeof schema>) {
    setError(null);
    setSuccessMessage(null);
    const res = await signIn("credentials", { ...values, redirect: false });
    if (res?.ok) {
      // La redirection sera gérée par /dashboard qui redirige selon le rôle
      router.replace("/dashboard");
    } else {
      setError("Email ou mot de passe incorrect");
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <CardTitle className="text-2xl font-bold">Connexion</CardTitle>
          <CardDescription>
            Connectez-vous à votre compte MedFlow
          </CardDescription>
        </CardHeader>
        <CardContent>
          {successMessage && (
            <div className="mb-4 p-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-md">
              <p className="text-green-600 dark:text-green-400 text-sm">{successMessage}</p>
            </div>
          )}
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
              <FormField
                control={form.control}
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input type="email" {...field} placeholder="vous@email.com" />
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
                    <FormLabel>Mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" {...field} placeholder="••••••••" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {error && (
                <div className="p-3 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800 rounded-md">
                  <p className="text-red-600 dark:text-red-400 text-sm">{error}</p>
                </div>
              )}
              <Button type="submit" className="w-full">
                Se connecter
              </Button>
            </form>
          </Form>
          <div className="mt-4 text-center text-sm text-muted-foreground">
            Vous n'avez pas de compte ?{" "}
            <a href="/register" className="text-primary hover:underline">
              Créer un compte
            </a>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}


