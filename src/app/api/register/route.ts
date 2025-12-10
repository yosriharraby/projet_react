import { NextResponse } from "next/server";
import { z } from "zod";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db";

const schema = z.object({
  name: z.string().min(2, "Le nom doit contenir au moins 2 caractères"),
  email: z.string().email("Email invalide"),
  password: z.string().min(6, "Le mot de passe doit contenir au moins 6 caractères"),
  role: z.enum(["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"]),
  // Champs optionnels pour la clinique (si ADMIN)
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

export async function POST(req: Request) {
  try {
    const json = await req.json();
    const parsed = schema.safeParse(json);
    
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Données invalides", details: parsed.error.issues },
        { status: 400 }
      );
    }

    const { name, email, password, role, clinicName, clinicAddress, clinicPhone } = parsed.data;

    // Vérifier que le rôle est valide
    if (!["ADMIN", "DOCTOR", "RECEPTIONIST", "PATIENT"].includes(role)) {
      return NextResponse.json(
        { error: "Rôle invalide" },
        { status: 400 }
      );
    }

    // Vérifier si l'email existe déjà
    const exists = await prisma.user.findUnique({ where: { email } });
    if (exists) {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    // Hasher le mot de passe
    const passwordHash = await bcrypt.hash(password, 10);

    // Transaction pour créer l'utilisateur et éventuellement la clinique
    if (role === "ADMIN") {
      // Pour ADMIN : créer l'utilisateur, la clinique et la membership
      const result = await prisma.$transaction(async (tx) => {
        // Créer l'utilisateur
        const user = await tx.user.create({
          data: {
            email,
            name,
            passwordHash,
            defaultRole: "ADMIN",
          },
        });

        // Créer la clinique avec l'utilisateur comme propriétaire
        const clinic = await tx.clinic.create({
          data: {
            name: clinicName!,
            address: clinicAddress || null,
            phone: clinicPhone || null,
            ownerId: user.id,
          },
        });

        // Créer la membership ADMIN
        await tx.membership.create({
          data: {
            userId: user.id,
            clinicId: clinic.id,
            role: "ADMIN",
          },
        });

        return { user, clinic };
      });

      return NextResponse.json({
        ok: true,
        message: "Compte administrateur créé avec succès",
        role: "ADMIN",
      });
    } else {
      // Pour DOCTOR, RECEPTIONIST, PATIENT : créer seulement l'utilisateur
      // La membership sera ajoutée plus tard par un ADMIN (sauf pour PATIENT)
      const user = await prisma.user.create({
        data: {
          email,
          name,
          passwordHash,
          defaultRole: role as "DOCTOR" | "RECEPTIONIST" | "PATIENT",
        },
      });

      let message = "";
      if (role === "DOCTOR") {
        message = "Compte médecin créé. Un administrateur devra vous ajouter à une clinique.";
      } else if (role === "RECEPTIONIST") {
        message = "Compte réceptionniste créé. Un administrateur devra vous ajouter à une clinique.";
      } else if (role === "PATIENT") {
        message = "Compte patient créé. Vous pouvez maintenant accéder au portail patient.";
      }

      return NextResponse.json({
        ok: true,
        message,
        role,
      });
    }
  } catch (e: any) {
    console.error("Registration error:", e);
    
    // Gérer les erreurs spécifiques
    if (e.code === "P2002") {
      return NextResponse.json(
        { error: "Cet email est déjà utilisé" },
        { status: 409 }
      );
    }

    return NextResponse.json(
      { error: "Erreur serveur. Veuillez réessayer." },
      { status: 500 }
    );
  }
}


