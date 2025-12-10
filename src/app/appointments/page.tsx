"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, User, Stethoscope, FileText } from "lucide-react";
import Link from "next/link";

interface Appointment {
  id: string;
  date: string;
  duration: number;
  status: "SCHEDULED" | "CONFIRMED" | "IN_PROGRESS" | "COMPLETED" | "CANCELLED" | "NO_SHOW";
  notes: string | null;
  patient: {
    id: string;
    firstName: string;
    lastName: string;
    phone: string | null;
  };
  service: {
    id: string;
    name: string;
    price: number;
  };
  assignedUser: {
    id: string;
    name: string;
  } | null;
}

interface Patient {
  id: string;
  firstName: string;
  lastName: string;
}

interface Service {
  id: string;
  name: string;
  duration: number;
  price: number;
}

export default function AppointmentsPage() {
  const [appointments, setAppointments] = useState<Appointment[]>([]);
  const [patients, setPatients] = useState<Patient[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Fetch appointments for selected date
      const appointmentsResponse = await fetch(`/api/appointments?date=${selectedDate}`);
      let appointmentsError: string | null = null;
      
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.appointments || []);
      } else {
        // Try to get error details from response
        try {
          const errorData = await appointmentsResponse.json();
          appointmentsError = errorData.error || errorData.details || null;
          
          // Handle specific error cases
          if (appointmentsResponse.status === 404 && errorData.error === "No clinic found") {
            appointmentsError = "NO_CLINIC";
          } else if (appointmentsResponse.status === 401) {
            appointmentsError = "Vous devez être connecté pour voir les rendez-vous. Veuillez vous reconnecter.";
          } else if (appointmentsResponse.status === 403) {
            appointmentsError = "Vous n'avez pas la permission de voir les rendez-vous.";
          } else if (appointmentsResponse.status === 500) {
            appointmentsError = "Erreur serveur. Veuillez réessayer plus tard.";
          }
        } catch (e) {
          if (appointmentsResponse.status === 401) {
            appointmentsError = "Vous devez être connecté pour voir les rendez-vous.";
          } else if (appointmentsResponse.status === 404) {
            appointmentsError = "NO_CLINIC";
          }
        }
        setAppointments([]); // Set empty array on error
      }

      // Fetch patients and services for the form
      // Récupérer tous les patients (sans pagination) pour le formulaire
      const [patientsResponse, servicesResponse] = await Promise.all([
        fetch("/api/patients?limit=1000"), // Limite élevée pour récupérer tous les patients
        fetch("/api/services?activeOnly=true"),
      ]);

      let patientsError: string | null = null;
      let servicesError: string | null = null;

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        console.log("[Appointments] Patients loaded:", patientsData.patients?.length || 0, "out of", patientsData.pagination?.total || 0);
        setPatients(patientsData.patients || []);
        
        if (patientsData.patients?.length === 0) {
          console.warn("[Appointments] Aucun patient trouvé pour cette clinique");
        }
      } else {
        try {
          const errorData = await patientsResponse.json();
          if (patientsResponse.status === 404 && errorData.error === "No clinic found") {
            patientsError = "NO_CLINIC";
          }
        } catch (e) {
          if (patientsResponse.status === 404) {
            patientsError = "NO_CLINIC";
          }
        }
        setPatients([]);
      }

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        console.log("[Appointments] Services loaded:", servicesData.services?.length || 0);
        setServices(servicesData.services || []);
        
        if (servicesData.services?.length === 0) {
          console.warn("[Appointments] Aucun service trouvé pour cette clinique");
        }
      } else {
        try {
          const errorData = await servicesResponse.json();
          if (servicesResponse.status === 404 && errorData.error === "No clinic found") {
            servicesError = "NO_CLINIC";
          }
        } catch (e) {
          if (servicesResponse.status === 404) {
            servicesError = "NO_CLINIC";
          }
        }
        setServices([]);
      }

      // Determine the main error message
      // If all errors are "NO_CLINIC", show a unified message
      if (appointmentsError === "NO_CLINIC" || patientsError === "NO_CLINIC" || servicesError === "NO_CLINIC") {
        setError("NO_CLINIC");
      } else if (appointmentsError) {
        setError(appointmentsError);
      } else if (patientsError && patientsError !== "NO_CLINIC") {
        setError(patientsError);
      } else if (servicesError && servicesError !== "NO_CLINIC") {
        setError(servicesError);
      }
    } catch (error: any) {
      console.error("[Appointments] Error fetching data:", error);
      const errorMessage = error.message || "Une erreur s'est produite lors du chargement des données. Vérifiez votre connexion et réessayez.";
      setError(errorMessage);
      setAppointments([]);
      setPatients([]);
      setServices([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

  // Recharger les patients et services quand le modal s'ouvre
  useEffect(() => {
    if (isAddDialogOpen) {
      // Recharger les patients et services à chaque ouverture du modal pour s'assurer qu'ils sont à jour
      const loadData = async () => {
        try {
          const [patientsResponse, servicesResponse] = await Promise.all([
            fetch("/api/patients?limit=1000"),
            fetch("/api/services?activeOnly=true"),
          ]);

          if (patientsResponse.ok) {
            const patientsData = await patientsResponse.json();
            console.log("[Appointments] Patients reloaded on modal open:", patientsData.patients?.length || 0);
            setPatients(patientsData.patients || []);
          } else {
            // Silently handle error - don't spam console with redundant errors
            if (patientsResponse.status !== 404) {
              console.error("[Appointments] Error reloading patients:", patientsResponse.status);
            }
            setPatients([]);
          }

          if (servicesResponse.ok) {
            const servicesData = await servicesResponse.json();
            console.log("[Appointments] Services reloaded on modal open:", servicesData.services?.length || 0);
            setServices(servicesData.services || []);
          } else {
            // Silently handle error - don't spam console with redundant errors
            if (servicesResponse.status !== 404) {
              console.error("[Appointments] Error reloading services:", servicesResponse.status);
            }
            setServices([]);
          }
        } catch (error) {
          console.error("[Appointments] Error reloading data:", error);
        }
      };
      loadData();
    }
  }, [isAddDialogOpen]);

  const formatTime = (dateString: string) => {
    return new Date(dateString).toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (minutes: number) => {
    if (minutes < 60) return `${minutes}m`;
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return remainingMinutes > 0 ? `${hours}h ${remainingMinutes}m` : `${hours}h`;
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "SCHEDULED": return "bg-blue-100 text-blue-800";
      case "CONFIRMED": return "bg-green-100 text-green-800";
      case "IN_PROGRESS": return "bg-yellow-100 text-yellow-800";
      case "COMPLETED": return "bg-gray-100 text-gray-800";
      case "CANCELLED": return "bg-red-100 text-red-800";
      case "NO_SHOW": return "bg-orange-100 text-orange-800";
      default: return "bg-gray-100 text-gray-800";
    }
  };

  const updateAppointmentStatus = async (appointmentId: string, newStatus: string) => {
    try {
      console.log("[Appointments] Updating appointment:", appointmentId, "to status:", newStatus);
      
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        const errorMessage = errorData.error || errorData.details || "Failed to update appointment";
        console.error("[Appointments] Error updating appointment:", response.status, errorMessage);
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log("[Appointments] Appointment updated successfully:", data.appointment);
      
      fetchData(); // Refresh the data
    } catch (error: any) {
      console.error("[Appointments] Error updating appointment:", error);
      // Vous pourriez ajouter une notification toast ici pour informer l'utilisateur
      alert(`Erreur lors de la mise à jour: ${error.message || "Erreur inconnue"}`);
    }
  };

  return (
    <div className="max-w-7xl mx-auto py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Appointments</h1>
        <p className="text-muted-foreground">
          Manage your clinic's appointments and schedule
        </p>
      </div>

      {/* Date Selector and Add Appointment */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-4">
          <Calendar className="h-5 w-5" />
          <input
            type="date"
            value={selectedDate}
            onChange={(e) => setSelectedDate(e.target.value)}
            className="px-3 py-2 border rounded-md"
            aria-label="Select date"
          />
        </div>
        
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Schedule Appointment
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Schedule New Appointment</DialogTitle>
              <DialogDescription>
                Book an appointment for a patient with a specific service.
              </DialogDescription>
            </DialogHeader>
            <ScheduleAppointmentForm
              patients={patients}
              services={services}
              selectedDate={selectedDate}
              onSuccess={() => {
                setIsAddDialogOpen(false);
                fetchData();
              }}
            />
          </DialogContent>
        </Dialog>
      </div>

      {/* Appointments List */}
      <Card>
        <CardHeader>
          <CardTitle>Appointments for {new Date(selectedDate).toLocaleDateString()}</CardTitle>
          <CardDescription>
            {appointments.length} appointments scheduled
          </CardDescription>
        </CardHeader>
        <CardContent>
          {error === "NO_CLINIC" && (
            <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
              <p className="text-yellow-800 dark:text-yellow-200 font-medium mb-2">
                ⚠️ Aucune clinique trouvée
              </p>
              <p className="text-yellow-700 dark:text-yellow-300 text-sm mb-3">
                Vous devez être membre d'une clinique pour accéder aux rendez-vous. 
                Si vous êtes un ADMIN, créez une clinique ou ajoutez-vous à une clinique existante.
                Si vous êtes un RÉCEPTIONNISTE ou un MÉDECIN, demandez à l'administrateur de vous ajouter au staff.
              </p>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/admin/clinic"}
                >
                  Configuration Clinique
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => window.location.href = "/admin/staff"}
                >
                  Gestion du Staff
                </Button>
                <Button 
                  variant="outline" 
                  size="sm"
                  onClick={() => fetchData()}
                >
                  Réessayer
                </Button>
              </div>
            </div>
          )}
          {error && error !== "NO_CLINIC" && (
            <div className="mb-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md">
              <p className="text-destructive font-medium">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-2"
                onClick={() => fetchData()}
              >
                Réessayer
              </Button>
            </div>
          )}
          {loading ? (
            <div className="text-center py-8">
              <p>Loading appointments...</p>
            </div>
          ) : error && error !== "NO_CLINIC" ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                Impossible de charger les rendez-vous. Veuillez réessayer.
              </p>
            </div>
          ) : appointments.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">
                No appointments scheduled for this date.
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {appointments.map((appointment) => (
                <div key={appointment.id} className="border rounded-lg p-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <Clock className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {formatTime(appointment.date)}
                        </span>
                        <Badge className={getStatusColor(appointment.status)}>
                          {appointment.status.replace("_", " ")}
                        </Badge>
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <User className="h-4 w-4 text-muted-foreground" />
                        <span className="font-medium">
                          {appointment.patient.firstName} {appointment.patient.lastName}
                        </span>
                        {appointment.patient.phone && (
                          <span className="text-sm text-muted-foreground">
                            {appointment.patient.phone}
                          </span>
                        )}
                      </div>
                      
                      <div className="flex items-center gap-3 mb-2">
                        <Stethoscope className="h-4 w-4 text-muted-foreground" />
                        <span>{appointment.service.name}</span>
                        <span className="text-sm text-muted-foreground">
                          ({formatDuration(appointment.duration)})
                        </span>
                        <span className="text-sm font-medium">
                          ${appointment.service.price}
                        </span>
                      </div>
                      
                      {appointment.assignedUser && (
                        <div className="text-sm text-muted-foreground">
                          Assigned to: {appointment.assignedUser.name}
                        </div>
                      )}
                      
                      {appointment.notes && (
                        <div className="text-sm text-muted-foreground mt-2">
                          Notes: {appointment.notes}
                        </div>
                      )}
                    </div>
                    
                    <div className="flex gap-2">
                      {appointment.status === "SCHEDULED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateAppointmentStatus(appointment.id, "CONFIRMED")}
                          >
                            Confirm
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "CANCELLED")}
                          >
                            Cancel
                          </Button>
                        </>
                      )}
                      {appointment.status === "CONFIRMED" && (
                        <>
                          <Button
                            size="sm"
                            onClick={() => updateAppointmentStatus(appointment.id, "IN_PROGRESS")}
                          >
                            Start
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => updateAppointmentStatus(appointment.id, "NO_SHOW")}
                          >
                            No Show
                          </Button>
                        </>
                      )}
                      {appointment.status === "IN_PROGRESS" && (
                        <Button
                          size="sm"
                          onClick={() => updateAppointmentStatus(appointment.id, "COMPLETED")}
                        >
                          Complete
                        </Button>
                      )}
                      {appointment.status === "COMPLETED" && (
                        <Link href={`/appointments/${appointment.id}/prescription`}>
                          <Button size="sm" variant="outline">
                            <FileText className="h-4 w-4 mr-2" />
                            Créer Ordonnance
                          </Button>
                        </Link>
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

// Schedule Appointment Form Component
function ScheduleAppointmentForm({
  patients,
  services,
  selectedDate,
  onSuccess,
}: {
  patients: Patient[];
  services: Service[];
  selectedDate: string;
  onSuccess: () => void;
}) {
  const [formData, setFormData] = useState({
    patientId: "",
    serviceId: "",
    time: "",
    notes: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/appointments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...formData,
          date: selectedDate,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setError(data.error || "Failed to create appointment");
        return;
      }

      onSuccess();
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="text-sm font-medium">Patient *</label>
        <select
          value={formData.patientId}
          onChange={(e) => setFormData({ ...formData, patientId: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
          aria-label="Select patient"
          disabled={patients.length === 0}
        >
          <option value="">
            {patients.length === 0 
              ? "Aucun patient disponible. Créez un patient d'abord." 
              : "Sélectionner un patient"}
          </option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.firstName} {patient.lastName}
              {patient.email ? ` (${patient.email})` : ''}
              {patient.phone ? ` - ${patient.phone}` : ''}
            </option>
          ))}
        </select>
        {patients.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Aucun patient n'a été créé pour cette clinique.
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Veuillez créer un patient sur la page <strong>/patients</strong> avant de créer un rendez-vous.
            </p>
          </div>
        )}
        {patients.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {patients.length} patient{patients.length > 1 ? 's' : ''} disponible{patients.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Service *</label>
        <select
          value={formData.serviceId}
          onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
          aria-label="Select service"
          disabled={services.length === 0}
        >
          <option value="">
            {services.length === 0 
              ? "Aucun service disponible. L'admin doit créer des services d'abord." 
              : "Sélectionner un service"}
          </option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} - {service.price.toFixed(2)}€ ({service.duration}min)
              {service.category ? ` - ${service.category}` : ''}
            </option>
          ))}
        </select>
        {services.length === 0 && (
          <div className="mt-2 p-3 bg-yellow-50 dark:bg-yellow-950/20 border border-yellow-200 dark:border-yellow-800 rounded-md">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              ⚠️ Aucun service n'a été créé pour cette clinique.
            </p>
            <p className="text-sm text-yellow-700 dark:text-yellow-300 mt-1">
              Veuillez demander à l'administrateur de créer des services sur la page <strong>/services</strong>.
            </p>
          </div>
        )}
        {services.length > 0 && (
          <p className="text-sm text-muted-foreground mt-1">
            {services.length} service{services.length > 1 ? 's' : ''} disponible{services.length > 1 ? 's' : ''}
          </p>
        )}
      </div>

      <div>
        <label className="text-sm font-medium">Time *</label>
        <select
          value={formData.time}
          onChange={(e) => setFormData({ ...formData, time: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
          aria-label="Select time"
        >
          <option value="">Select a time</option>
          {generateTimeSlots().map((time) => (
            <option key={time} value={time}>
              {time}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Notes</label>
        <textarea
          value={formData.notes}
          onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          rows={3}
          placeholder="Any additional notes for this appointment"
        />
      </div>

      {error && <p className="text-red-600 text-sm">{error}</p>}

      <div className="flex justify-end gap-2">
        <Button type="submit" disabled={loading}>
          {loading ? "Scheduling..." : "Schedule Appointment"}
        </Button>
      </div>
    </form>
  );
}
