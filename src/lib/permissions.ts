import type { Role } from "../generated/prisma";

/**
 * Système de gestion des permissions basé sur les rôles (RBAC)
 * Définit quelles actions chaque rôle peut effectuer
 */

/**
 * Vérifie si un rôle peut gérer les patients (créer, modifier, supprimer)
 */
export function canManagePatients(role: Role): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST";
}

/**
 * Vérifie si un rôle peut voir les dossiers médicaux complets
 */
export function canViewMedicalRecords(role: Role): boolean {
  return role === "ADMIN" || role === "DOCTOR";
}

/**
 * Vérifie si un rôle peut créer des prescriptions/ordonnances
 */
export function canCreatePrescriptions(role: Role): boolean {
  return role === "ADMIN" || role === "DOCTOR";
}

/**
 * Vérifie si un rôle peut gérer les services médicaux
 */
export function canManageServices(role: Role): boolean {
  return role === "ADMIN";
}

/**
 * Vérifie si un rôle peut gérer le staff (ajouter, modifier, supprimer des membres)
 */
export function canManageStaff(role: Role): boolean {
  return role === "ADMIN";
}

/**
 * Vérifie si un rôle peut gérer les rendez-vous (créer, modifier, annuler)
 */
export function canManageAppointments(role: Role): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST" || role === "DOCTOR";
}

/**
 * Vérifie si un rôle peut voir tous les rendez-vous de la clinique
 */
export function canViewAllAppointments(role: Role): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST";
}

/**
 * Vérifie si un rôle peut voir seulement ses propres rendez-vous
 */
export function canViewOwnAppointments(role: Role): boolean {
  return role === "DOCTOR";
}

/**
 * Vérifie si un rôle peut gérer les factures
 */
export function canManageInvoices(role: Role): boolean {
  return role === "ADMIN" || role === "RECEPTIONIST";
}

/**
 * Vérifie si un rôle peut modifier son propre agenda
 */
export function canManageOwnSchedule(role: Role): boolean {
  return role === "ADMIN" || role === "DOCTOR";
}

/**
 * Liste des rôles autorisés pour une action donnée
 */
export const PERMISSIONS = {
  MANAGE_PATIENTS: ["ADMIN", "RECEPTIONIST"] as Role[],
  VIEW_MEDICAL_RECORDS: ["ADMIN", "DOCTOR"] as Role[],
  CREATE_PRESCRIPTIONS: ["ADMIN", "DOCTOR"] as Role[],
  MANAGE_SERVICES: ["ADMIN"] as Role[],
  MANAGE_STAFF: ["ADMIN"] as Role[],
  MANAGE_APPOINTMENTS: ["ADMIN", "RECEPTIONIST", "DOCTOR"] as Role[],
  VIEW_ALL_APPOINTMENTS: ["ADMIN", "RECEPTIONIST"] as Role[],
  VIEW_OWN_APPOINTMENTS: ["DOCTOR"] as Role[],
  MANAGE_INVOICES: ["ADMIN", "RECEPTIONIST"] as Role[],
  MANAGE_OWN_SCHEDULE: ["ADMIN", "DOCTOR"] as Role[],
} as const;

/**
 * Vérifie si un rôle est dans la liste des rôles autorisés
 */
export function hasPermission(role: Role, allowedRoles: Role[]): boolean {
  return allowedRoles.includes(role);
}

