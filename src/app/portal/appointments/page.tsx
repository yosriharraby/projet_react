"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar, Clock, MapPin, User, Stethoscope, Plus, Edit, X, CheckCircle } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

interface Appointment {
  id: string;
  date: string;
  status: string;
  notes: string | null;
  service: {
    name: string;
    duration: number;
    price: number;
  };
  clinic: {
    name: string;
    address: string | null;
    phone: string | null;
  };
  assignedUser: {
    name: string | null;
  } | null;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

interface Doctor {
  id: string;
  name: string | null;
  email: string;
}

interface Clinic {
  id: string;
  name: string;
  address: string | null;
  phone: string | null;
}

export default function PatientAppointmentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [upcomingAppointments, setUpcomingAppointments] = useState<Appointment[]>([]);
  const [pastAppointments, setPastAppointments] = useState<Appointment[]>([]);
  const [clinics, setClinics] = useState<Clinic[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [doctors, setDoctors] = useState<Doctor[]>([]);
  const [isBookingDialogOpen, setIsBookingDialogOpen] = useState(false);
  const [selectedTab, setSelectedTab] = useState<"upcoming" | "past">("upcoming");

  const [bookingForm, setBookingForm] = useState({
    clinicId: "",
    serviceId: "",
    doctorId: "",
    date: "",
    time: "",
    notes: "",
  });

  useEffect(() => {
    if (status === "unauthenticated") {
      router.push("/portal/home");
      return;
    }
    if (status === "authenticated") {
      fetchAppointments();
      fetchClinics();
    }
  }, [status, router]);

  // Réinitialiser services et médecins quand la clinique change
  useEffect(() => {
    if (bookingForm.clinicId) {
      fetchServicesForClinic(bookingForm.clinicId);
      fetchDoctorsForClinic(bookingForm.clinicId);
      // Réinitialiser les sélections de service et médecin
      setBookingForm(prev => ({
        ...prev,
        serviceId: "",
        doctorId: "",
      }));
    } else {
      setServices([]);
      setDoctors([]);
    }
  }, [bookingForm.clinicId]);

  const fetchAppointments = async () => {
    try {
      setLoading(true);
      const [upcomingRes, pastRes] = await Promise.all([
        fetch("/api/portal/appointments?upcoming=true"),
        fetch("/api/portal/appointments?past=true"),
      ]);

      if (upcomingRes.ok) {
        const data = await upcomingRes.json();
        setUpcomingAppointments(data.appointments || []);
      }
      // Silently handle errors - patient might not have appointments yet

      if (pastRes.ok) {
        const data = await pastRes.json();
        setPastAppointments(data.appointments || []);
      }
      // Silently handle errors - patient might not have past appointments yet
    } catch (error) {
      // Ne pas afficher d'erreur - laisser l'utilisateur voir la page même s'il n'a pas de rendez-vous
      console.error("Error fetching appointments:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchClinics = async () => {
    try {
      const res = await fetch("/api/portal/clinics");
      if (res.ok) {
        const data = await res.json();
        setClinics(data.clinics || []);
      } else {
        // Silently handle errors - might not have clinics available
        console.error("Error fetching clinics:", res.status);
        setClinics([]);
      }
    } catch (error) {
      // Ne pas afficher d'erreur à l'utilisateur
      console.error("Error fetching clinics:", error);
      setClinics([]);
    }
  };

  const fetchServicesForClinic = async (clinicId: string) => {
    try {
      const res = await fetch(`/api/portal/clinics/${clinicId}/services`);
      if (res.ok) {
        const data = await res.json();
        setServices(data.services || []);
      }
    } catch (error) {
      console.error("Error fetching services:", error);
      setServices([]);
    }
  };

  const fetchDoctorsForClinic = async (clinicId: string) => {
    try {
      const res = await fetch(`/api/portal/clinics/${clinicId}/doctors`);
      if (res.ok) {
        const data = await res.json();
        setDoctors(data.doctors || []);
      }
    } catch (error) {
      console.error("Error fetching doctors:", error);
      setDoctors([]);
    }
  };

  const generateTimeSlots = () => {
    const slots = [];
    for (let hour = 8; hour < 18; hour++) {
      for (let minute = 0; minute < 60; minute += 30) {
        const time = `${hour.toString().padStart(2, "0")}:${minute.toString().padStart(2, "0")}`;
        slots.push(time);
      }
    }
    return slots;
  };

  const handleBookAppointment = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/portal/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          clinicId: bookingForm.clinicId,
          serviceId: bookingForm.serviceId,
          doctorId: bookingForm.doctorId,
          dateTime: `${bookingForm.date}T${bookingForm.time}`,
          notes: bookingForm.notes,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Erreur lors de la réservation");
      }

      setIsBookingDialogOpen(false);
      setBookingForm({
        clinicId: "",
        serviceId: "",
        doctorId: "",
        date: "",
        time: "",
        notes: "",
      });
      fetchAppointments();
    } catch (error: any) {
      alert(error.message || "Erreur lors de la réservation");
    }
  };

  const handleCancelAppointment = async (appointmentId: string) => {
    if (!confirm("Êtes-vous sûr de vouloir annuler ce rendez-vous ?")) {
      return;
    }

    try {
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "CANCELLED" }),
      });

      if (!response.ok) {
        throw new Error("Erreur lors de l'annulation");
      }

      fetchAppointments();
    } catch (error) {
      alert("Erreur lors de l'annulation du rendez-vous");
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "En attente";
      case "CONFIRMED": return "Confirmé";
      case "IN_PROGRESS": return "En cours";
      case "COMPLETED": return "Terminé";
      case "CANCELLED": return "Annulé";
      case "NO_SHOW": return "Absent";
      default: return status;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200";
      case "CONFIRMED": return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200";
      case "COMPLETED": return "bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200";
      case "CANCELLED": return "bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200";
      case "NO_SHOW": return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="max-w-6xl mx-auto py-10">
        <p>Chargement...</p>
      </div>
    );
  }

  const appointments = selectedTab === "upcoming" ? upcomingAppointments : pastAppointments;

  return (
    <div className="max-w-6xl mx-auto py-10">
      <div className="mb-8 flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold mb-2">Mes Rendez-vous</h1>
          <p className="text-muted-foreground">
            Consultez vos rendez-vous ou réservez un nouveau rendez-vous dans l'une des cliniques disponibles
          </p>
        </div>
        <Dialog open={isBookingDialogOpen} onOpenChange={setIsBookingDialogOpen}>
          <DialogTrigger asChild>
            <Button size="lg">
              <Plus className="h-5 w-5 mr-2" />
              Prendre un rendez-vous
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Réserver un rendez-vous</DialogTitle>
              <DialogDescription>
                Sélectionnez une clinique et une date pour votre rendez-vous médical
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleBookAppointment} className="space-y-5">
              {/* Section 1: Sélection de la clinique */}
              <div className="p-4 bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                <h3 className="font-semibold mb-3 text-blue-900 dark:text-blue-100 flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  Étape 1 : Choisir une clinique
                </h3>
                <div>
                  <Label htmlFor="clinic" className="text-base font-medium">Clinique *</Label>
                  <select
                    id="clinic"
                    value={bookingForm.clinicId}
                    onChange={(e) => setBookingForm({ ...bookingForm, clinicId: e.target.value })}
                    className="w-full px-4 py-3 border-2 rounded-md mt-2 focus:border-blue-500 focus:ring-2 focus:ring-blue-200"
                    required
                    aria-label="Sélectionner une clinique"
                  >
                    <option value="">-- Sélectionnez une clinique --</option>
                    {clinics.map((clinic) => (
                      <option key={clinic.id} value={clinic.id}>
                        {clinic.name}
                        {clinic.address && ` - ${clinic.address}`}
                      </option>
                    ))}
                  </select>
                  {bookingForm.clinicId && clinics.find(c => c.id === bookingForm.clinicId) && (
                    <div className="mt-3 p-3 bg-white dark:bg-gray-800 rounded-md">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                        📍 {clinics.find(c => c.id === bookingForm.clinicId)?.address || "Adresse non renseignée"}
                      </p>
                      {clinics.find(c => c.id === bookingForm.clinicId)?.phone && (
                        <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                          📞 {clinics.find(c => c.id === bookingForm.clinicId)?.phone}
                        </p>
                      )}
                    </div>
                  )}
                  {clinics.length === 0 && (
                    <p className="text-sm text-muted-foreground mt-2">
                      Aucune clinique disponible pour le moment.
                    </p>
                  )}
                </div>
              </div>

              {/* Section 2: Sélection de la date */}
              <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                <h3 className="font-semibold mb-3 text-green-900 dark:text-green-100 flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Étape 2 : Choisir une date et une heure
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="date" className="text-base font-medium">Date *</Label>
                    <Input
                      id="date"
                      type="date"
                      value={bookingForm.date}
                      onChange={(e) => setBookingForm({ ...bookingForm, date: e.target.value })}
                      min={new Date().toISOString().split("T")[0]}
                      required
                      className="mt-2 px-4 py-3 border-2 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      disabled={!bookingForm.clinicId}
                    />
                    {!bookingForm.clinicId && (
                      <p className="text-xs text-muted-foreground mt-1">
                        Sélectionnez d'abord une clinique
                      </p>
                    )}
                  </div>
                  <div>
                    <Label htmlFor="time" className="text-base font-medium">Heure *</Label>
                    <select
                      id="time"
                      value={bookingForm.time}
                      onChange={(e) => setBookingForm({ ...bookingForm, time: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-md mt-2 focus:border-green-500 focus:ring-2 focus:ring-green-200"
                      required
                      disabled={!bookingForm.date}
                      aria-label="Sélectionner une heure"
                    >
                      <option value="">
                        {!bookingForm.date 
                          ? "Sélectionnez d'abord une date" 
                          : "Sélectionner une heure"}
                      </option>
                      {generateTimeSlots().map((time) => (
                        <option key={time} value={time}>
                          {time}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {/* Section 3: Service et médecin */}
              <div className="p-4 bg-purple-50 dark:bg-purple-950/20 border border-purple-200 dark:border-purple-800 rounded-lg">
                <h3 className="font-semibold mb-3 text-purple-900 dark:text-purple-100 flex items-center gap-2">
                  <Stethoscope className="h-5 w-5" />
                  Étape 3 : Choisir un service et un médecin
                </h3>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="service" className="text-base font-medium">Service médical *</Label>
                    <select
                      id="service"
                      value={bookingForm.serviceId}
                      onChange={(e) => setBookingForm({ ...bookingForm, serviceId: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-md mt-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                      disabled={!bookingForm.clinicId}
                      aria-label="Sélectionner un service"
                    >
                      <option value="">
                        {!bookingForm.clinicId 
                          ? "Sélectionnez d'abord une clinique" 
                          : services.length === 0
                          ? "Aucun service disponible pour cette clinique"
                          : "-- Sélectionnez un service --"}
                      </option>
                      {services.map((service) => (
                        <option key={service.id} value={service.id}>
                          {service.name} - {service.price.toFixed(2)}€ ({service.duration}min)
                        </option>
                      ))}
                    </select>
                    {services.length === 0 && bookingForm.clinicId && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Cette clinique n'a pas encore de services disponibles. Contactez la clinique pour plus d'informations.
                      </p>
                    )}
                  </div>

                  <div>
                    <Label htmlFor="doctor" className="text-base font-medium">Médecin *</Label>
                    <select
                      id="doctor"
                      value={bookingForm.doctorId}
                      onChange={(e) => setBookingForm({ ...bookingForm, doctorId: e.target.value })}
                      className="w-full px-4 py-3 border-2 rounded-md mt-2 focus:border-purple-500 focus:ring-2 focus:ring-purple-200"
                      required
                      disabled={!bookingForm.clinicId}
                      aria-label="Sélectionner un médecin"
                    >
                      <option value="">
                        {!bookingForm.clinicId 
                          ? "Sélectionnez d'abord une clinique" 
                          : doctors.length === 0
                          ? "Aucun médecin disponible pour cette clinique"
                          : "-- Sélectionnez un médecin --"}
                      </option>
                      {doctors.map((doctor) => (
                        <option key={doctor.id} value={doctor.id}>
                          Dr. {doctor.name || doctor.email}
                        </option>
                      ))}
                    </select>
                    {doctors.length === 0 && bookingForm.clinicId && (
                      <p className="text-sm text-muted-foreground mt-2">
                        Aucun médecin disponible pour cette clinique. Contactez la clinique pour plus d'informations.
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Section 4: Notes optionnelles */}
              <div>
                <Label htmlFor="notes" className="text-base font-medium">Motif de consultation (optionnel)</Label>
                <Textarea
                  id="notes"
                  value={bookingForm.notes}
                  onChange={(e) => setBookingForm({ ...bookingForm, notes: e.target.value })}
                  placeholder="Décrivez brièvement le motif de votre consultation..."
                  rows={3}
                  className="mt-2 px-4 py-3 border-2 focus:border-gray-500 focus:ring-2 focus:ring-gray-200"
                />
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" onClick={() => setIsBookingDialogOpen(false)}>
                  Annuler
                </Button>
                <Button type="submit">Réserver</Button>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6 border-b">
        <button
          onClick={() => setSelectedTab("upcoming")}
          className={`px-4 py-2 font-medium ${
            selectedTab === "upcoming"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Rendez-vous à venir ({upcomingAppointments.length})
        </button>
        <button
          onClick={() => setSelectedTab("past")}
          className={`px-4 py-2 font-medium ${
            selectedTab === "past"
              ? "border-b-2 border-primary text-primary"
              : "text-muted-foreground hover:text-foreground"
          }`}
        >
          Historique ({pastAppointments.length})
        </button>
      </div>

      {/* Liste des rendez-vous */}
      <Card>
        <CardContent className="pt-6">
          {appointments.length === 0 ? (
            <div className="text-center py-12">
              <Calendar className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground mb-4">
                {selectedTab === "upcoming"
                  ? "Aucun rendez-vous à venir. Réservez un rendez-vous pour commencer."
                  : "Aucun rendez-vous dans l'historique."}
              </p>
              {selectedTab === "upcoming" && (
                <Button onClick={() => setIsBookingDialogOpen(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Réserver un rendez-vous
                </Button>
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div
                  key={appointment.id}
                  className="p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Calendar className="h-5 w-5 text-muted-foreground" />
                        <h3 className="font-semibold text-lg">
                          {new Date(appointment.date).toLocaleDateString("fr-FR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </h3>
                        <Badge className={getStatusColor(appointment.status)}>
                          {getStatusLabel(appointment.status)}
                        </Badge>
                      </div>

                      <div className="ml-8 space-y-2">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          {new Date(appointment.date).toLocaleTimeString("fr-FR", {
                            hour: "2-digit",
                            minute: "2-digit",
                          })} - Durée: {appointment.service.duration}min
                        </div>

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Stethoscope className="h-4 w-4" />
                          {appointment.service.name} - {appointment.service.price.toFixed(2)}€
                        </div>

                        {appointment.assignedUser && (
                          <div className="flex items-center gap-2 text-sm text-muted-foreground">
                            <User className="h-4 w-4" />
                            Dr. {appointment.assignedUser.name}
                          </div>
                        )}

                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <MapPin className="h-4 w-4" />
                          {appointment.clinic.name}
                          {appointment.clinic.address && ` - ${appointment.clinic.address}`}
                        </div>

                        {appointment.notes && (
                          <div className="mt-2 p-2 bg-muted rounded-md text-sm">
                            <strong>Notes:</strong> {appointment.notes}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-2">
                      {selectedTab === "upcoming" && 
                       (appointment.status === "SCHEDULED" || appointment.status === "CONFIRMED") && (
                        <>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => {
                              // TODO: Implémenter la modification
                              alert("Fonctionnalité de modification à venir");
                            }}
                          >
                            <Edit className="h-4 w-4 mr-1" />
                            Modifier
                          </Button>
                          <Button
                            variant="destructive"
                            size="sm"
                            onClick={() => handleCancelAppointment(appointment.id)}
                          >
                            <X className="h-4 w-4 mr-1" />
                            Annuler
                          </Button>
                        </>
                      )}
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

