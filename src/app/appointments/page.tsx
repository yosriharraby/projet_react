"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Calendar, Clock, User, Stethoscope } from "lucide-react";

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
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split("T")[0]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // Fetch appointments for selected date
      const appointmentsResponse = await fetch(`/api/appointments?date=${selectedDate}`);
      if (appointmentsResponse.ok) {
        const appointmentsData = await appointmentsResponse.json();
        setAppointments(appointmentsData.appointments);
      }

      // Fetch patients and services for the form
      const [patientsResponse, servicesResponse] = await Promise.all([
        fetch("/api/patients"),
        fetch("/api/services?activeOnly=true"),
      ]);

      if (patientsResponse.ok) {
        const patientsData = await patientsResponse.json();
        setPatients(patientsData.patients);
      }

      if (servicesResponse.ok) {
        const servicesData = await servicesResponse.json();
        setServices(servicesData.services);
      }
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [selectedDate]);

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
      const response = await fetch(`/api/appointments/${appointmentId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      });

      if (!response.ok) throw new Error("Failed to update appointment");
      
      fetchData(); // Refresh the data
    } catch (error) {
      console.error("Error updating appointment:", error);
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
          {loading ? (
            <div className="text-center py-8">
              <p>Loading appointments...</p>
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
        >
          <option value="">Select a patient</option>
          {patients.map((patient) => (
            <option key={patient.id} value={patient.id}>
              {patient.firstName} {patient.lastName}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="text-sm font-medium">Service *</label>
        <select
          value={formData.serviceId}
          onChange={(e) => setFormData({ ...formData, serviceId: e.target.value })}
          className="w-full px-3 py-2 border rounded-md"
          required
          aria-label="Select service"
        >
          <option value="">Select a service</option>
          {services.map((service) => (
            <option key={service.id} value={service.id}>
              {service.name} (${service.price}, {service.duration}min)
            </option>
          ))}
        </select>
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
