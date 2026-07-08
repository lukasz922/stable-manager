import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";
import { useEffect, useState } from "react";
import { Box, CircularProgress, Typography } from "@mui/material";

import { getRides, type Ride } from "../api/rides";

export function CalendarPage() {
  const [rides, setRides] = useState<Ride[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadRides();
  }, []);

  async function loadRides() {
    try {
      const data = await getRides();
      setRides(data);
    } finally {
      setLoading(false);
    }
  }

  const events = rides.map((ride) => ({
    id: String(ride.id),
    title: `🐴 ${ride.horse_name || "Koń"}\n👤 ${ride.client_name || "Klient"}\n👨‍🏫 ${ride.instructor_name || "Instruktor"}`,
    start: ride.start_time,
    end: new Date(
      new Date(ride.start_time).getTime() + ride.duration_minutes * 60000
    ).toISOString(),
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
          editable={false}
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
            alert(`Jazda ID: ${info.event.id}`);
          }}
          dateClick={(info) => {
            alert(`Dodamy jazdę na: ${info.dateStr}`);
          }}
        />
      </Box>
    </Box>
  );
}