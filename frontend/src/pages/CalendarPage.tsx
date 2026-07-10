import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Snackbar,
  Typography,
} from "@mui/material";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { RideDialog } from "../components/calendar/RideDialog";
import { getRides, updateRide, type Ride } from "../api/rides";

function toLocalDateTime(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 19);
}

export function CalendarPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedRideId, setSelectedRideId] = useState<number | null>(null);
  const [successMessage, setSuccessMessage] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    loadRides();
  }, []);

  async function loadRides() {
    try {
      const data = await getRides();
      setRides(data);
    } catch (error) {
      console.error(error);
      setErrorMessage("Nie udało się pobrać jazd.");
    } finally {
      setLoading(false);
    }
  }

  const events = rides.map((ride) => ({
    id: String(ride.id),
    title: `🐴 ${ride.horse_name || "Koń"}\n👤 ${
      ride.client_name || "Klient"
    }\n👨‍🏫 ${ride.instructor_name || "Instruktor"}`,
    start: ride.start_time,
    end: new Date(
      new Date(ride.start_time).getTime() + ride.duration_minutes * 60_000
    ),
    backgroundColor:
      ride.status === "completed"
        ? "#2e7d32"
        : ride.status === "cancelled"
        ? "#d32f2f"
        : "#1976d2",
    borderColor:
      ride.status === "completed"
        ? "#2e7d32"
        : ride.status === "cancelled"
        ? "#d32f2f"
        : "#1976d2",
  }));

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        📅 Kalendarz jazd
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Tygodniowy harmonogram jazd konnych.
      </Typography>

      <Box
        sx={{
          background: "#fff",
          border: "1px solid #e5e7eb",
          borderRadius: 2,
          p: 2,
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          height="auto"
          locale="pl"
          firstDay={1}
          weekends={true}
          allDaySlot={false}
          nowIndicator={true}
          selectable={true}
          editable={true}
          eventDurationEditable={false}
          slotMinTime="08:00:00"
          slotMaxTime="21:00:00"
          slotDuration="00:30:00"
          events={events}
          headerToolbar={{
            left: "prev,next today",
            center: "title",
            right: "dayGridMonth,timeGridWeek,timeGridDay",
          }}
          buttonText={{
            today: "Dziś",
            month: "Miesiąc",
            week: "Tydzień",
            day: "Dzień",
          }}
          eventClick={(info) => {
            setSelectedRideId(Number(info.event.id));
            setSelectedDate(info.event.startStr);
            setDialogOpen(true);
          }}
          dateClick={(info) => {
            setSelectedRideId(null);
            setSelectedDate(info.dateStr);
            setDialogOpen(true);
          }}
          eventDrop={async (info) => {
            const rideId = Number(info.event.id);
            const ride = rides.find((item) => item.id === rideId);

            if (!ride || !info.event.start) {
              info.revert();
              return;
            }

            const confirmed = window.confirm(
              `Czy przenieść jazdę na ${info.event.start.toLocaleString(
                "pl-PL"
              )}?`
            );

            if (!confirmed) {
              info.revert();
              return;
            }

            try {
              await updateRide(rideId, {
                client_id: ride.client_id,
                horse_id: ride.horse_id,
                instructor_id: ride.instructor_id,
                start_time: toLocalDateTime(info.event.start),
                duration_minutes: ride.duration_minutes,
                ride_type: ride.ride_type,
                status: ride.status,
                notes: ride.notes || undefined,
              });

              await loadRides();
              setSuccessMessage("Termin jazdy został zmieniony.");
            } catch (error) {
              console.error(error);
              info.revert();

              setErrorMessage(
                error instanceof Error
                  ? error.message
                  : "Nie udało się zmienić terminu jazdy."
              );
            }
          }}
        />
      </Box>

      <RideDialog
        open={dialogOpen}
        selectedDate={selectedDate}
        rideId={selectedRideId}
        onClose={() => setDialogOpen(false)}
        onSaved={(action) => {
          loadRides();

          if (action === "created") {
            setSuccessMessage("Jazda została dodana.");
          } else if (action === "updated") {
            setSuccessMessage("Jazda została zaktualizowana.");
          } else {
            setSuccessMessage("Jazda została usunięta.");
          }
        }}
      />

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      </Snackbar>

      <Snackbar
        open={Boolean(errorMessage)}
        autoHideDuration={5000}
        onClose={() => setErrorMessage("")}
      >
        <Alert
          severity="error"
          variant="filled"
          onClose={() => setErrorMessage("")}
        >
          {errorMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}