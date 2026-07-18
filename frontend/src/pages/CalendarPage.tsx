import {
  Alert,
  Box,
  Button,
  CircularProgress,
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import FullCalendar from "@fullcalendar/react";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import interactionPlugin from "@fullcalendar/interaction";

import { RideDialog } from "../components/calendar/RideDialog";
import { getRides, updateRide, type Ride } from "../api/rides";
import { getHorses, type Horse } from "../api/horses";
import {getInstructors, type Instructor,} from "../api/instructors";
import { useEffect, useState } from "react";

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
  const [selectedInstructor, setSelectedInstructor] = useState("");
  const [selectedHorse, setSelectedHorse] = useState("");
  const [selectedStatus, setSelectedStatus] = useState("");
  const [horses, setHorses] = useState<Horse[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
 const [clientSearch, setClientSearch] = useState("");
 
 useEffect(() => {
    loadRides();
  }, []);

  async function loadRides() {
  try {
    const [ridesData, horsesData, instructorsData] =
      await Promise.all([
        getRides(),
        getHorses(),
        getInstructors(),
      ]);

    setRides(ridesData);
    setHorses(horsesData);
    setInstructors(instructorsData);
  } catch (error) {
    console.error(error);
    setErrorMessage("Nie udało się pobrać danych.");
  } finally {
    setLoading(false);
  }
}

const filteredRides = rides.filter((ride) => {
  const phrase = clientSearch.trim().toLowerCase();

  const clientMatches =
    !phrase ||
    (ride.client_name || "")
      .toLowerCase()
      .includes(phrase);

  const instructorMatches =
    !selectedInstructor ||
    String(ride.instructor_id) === selectedInstructor;

  const horseMatches =
    !selectedHorse ||
    String(ride.horse_id) === selectedHorse;

  const statusMatches =
    !selectedStatus ||
    ride.status === selectedStatus;

  return (
    clientMatches &&
    instructorMatches &&
    horseMatches &&
    statusMatches
  );
});

const today = new Date().toISOString().slice(0, 10);

const todayRides = filteredRides.filter(
  (ride) => ride.start_time.slice(0, 10) === today
);

const plannedCount = filteredRides.filter(
  (ride) => ride.status === "planned"
).length;

const completedCount = filteredRides.filter(
  (ride) => ride.status === "completed"
).length;

const cancelledCount = filteredRides.filter(
  (ride) => ride.status === "cancelled"
).length;

const events = filteredRides.map((ride) => ({
  id: String(ride.id),
  title: "",
  start: ride.start_time,
  end: new Date(
    new Date(ride.start_time).getTime() + ride.duration_minutes * 60_000
  ),
  backgroundColor:
  ride.status === "completed"
    ? "#2e7d32"
    : ride.status === "checked_in"
    ? "#ed6c02"
    : ride.status === "cancelled"
    ? "#d32f2f"
    : "#1976d2",
  borderColor:
  ride.status === "completed"
    ? "#2e7d32"
    : ride.status === "checked_in"
    ? "#ed6c02"
    : ride.status === "cancelled"
    ? "#d32f2f"
    : "#1976d2",
  extendedProps: {
    clientName: ride.client_name || "Klient",
    horseName: ride.horse_name || "Koń",
    instructorName: ride.instructor_name || "Instruktor",
  },
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
    display: "grid",
    gridTemplateColumns: {
      xs: "1fr",
      sm: "repeat(2, 1fr)",
      lg: "repeat(4, 1fr)",
    },
    gap: 2,
    mb: 3,
  }}
>
  <Box
  onClick={() => setSelectedStatus("")}
  sx={{
    border: "1px solid #e5e7eb",
    borderRadius: 2,
    p: 2,
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "0.2s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: 2,
    },
  }}
>
  <Typography color="text.secondary" variant="body2">
    📅 Dzisiaj
  </Typography>

  <Typography variant="h5" fontWeight={800}>
    {todayRides.length}
  </Typography>
</Box>

  <Box
    onClick={() => setSelectedStatus("planned")} 
sx={{
      border: "1px solid #e5e7eb",
      borderRadius: 2,
      p: 2,
      backgroundColor: "#fff",
    cursor: "pointer",
transition: "0.2s",
"&:hover": {
  transform: "translateY(-2px)",
  boxShadow: 2,
    },
}}
  >
    <Typography color="text.secondary" variant="body2">
      ⏳ Zaplanowane
    </Typography>
    <Typography variant="h5" fontWeight={800}>
      {plannedCount}
    </Typography>
  </Box>

  <Box
  onClick={() => setSelectedStatus("completed")}
  sx={{
    border: "1px solid #e5e7eb",
    borderRadius: 2,
    p: 2,
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "0.2s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: 2,
    },
  }}
>
  <Typography color="text.secondary" variant="body2">
    ✅ Odbyte
  </Typography>

  <Typography variant="h5" fontWeight={800}>
    {completedCount}
  </Typography>
</Box>

  <Box
  onClick={() => setSelectedStatus("cancelled")}
  sx={{
    border: "1px solid #e5e7eb",
    borderRadius: 2,
    p: 2,
    backgroundColor: "#fff",
    cursor: "pointer",
    transition: "0.2s",
    "&:hover": {
      transform: "translateY(-2px)",
      boxShadow: 2,
    },
  }}
>
  <Typography color="text.secondary" variant="body2">
    ❌ Anulowane
  </Typography>

  <Typography variant="h5" fontWeight={800}>
    {cancelledCount}
  </Typography>
</Box>
</Box>
<Typography
  variant="body2"
  color="text.secondary"
  sx={{ mb: 2 }}
>
  Wyświetlanych jazd: {filteredRides.length} z {rides.length}
</Typography>
<Stack
  direction={{ xs: "column", md: "row" }}
  spacing={2}
  sx={{ mb: 3 }}
>
<TextField
  label="🔎 Klient"
  value={clientSearch}
  onChange={(event) => setClientSearch(event.target.value)}
  placeholder="Wpisz imię lub nazwisko"
  sx={{ minWidth: 240 }}
/>  

<TextField
    select
    label="👨‍🏫 Instruktor"
    value={selectedInstructor}
    onChange={(e) => setSelectedInstructor(e.target.value)}
    sx={{ minWidth: 220 }}
  >
    <MenuItem value="">Wszyscy</MenuItem>

    {instructors.map((item) => (
      <MenuItem key={item.id} value={String(item.id)}>
        {item.first_name} {item.last_name}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    select
    label="🐴 Koń"
    value={selectedHorse}
    onChange={(e) => setSelectedHorse(e.target.value)}
    sx={{ minWidth: 220 }}
  >
    <MenuItem value="">Wszystkie</MenuItem>

    {horses.map((item) => (
      <MenuItem key={item.id} value={String(item.id)}>
        {item.name}
      </MenuItem>
    ))}
  </TextField>

  <TextField
    select
    label="📌 Status"
    value={selectedStatus}
    onChange={(e) => setSelectedStatus(e.target.value)}
    sx={{ minWidth: 180 }}
  >
    <MenuItem value="">Wszystkie</MenuItem>
    <MenuItem value="planned">Zaplanowana</MenuItem>
    <MenuItem value="checked_in">🟠 Odbito / klient obecny</MenuItem>
    <MenuItem value="completed">Odbyła się</MenuItem>
    <MenuItem value="cancelled">Anulowana</MenuItem>
  </TextField>

  <Button
    variant="outlined"
    onClick={() => {
    setClientSearch("");  
    setSelectedInstructor("");
    setSelectedHorse("");
    setSelectedStatus("");
    }}
  >
    Wyczyść
  </Button>
</Stack>
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
          slotDuration="00:15:00"
          slotLabelInterval="00:30:00"
          snapDuration="00:15:00"
          events={events}
eventContent={(info) => {
  const start = info.event.start;
  const end = info.event.end;

  const formatTime = (date: Date | null) =>
    date
      ? date.toLocaleTimeString("pl-PL", {
          hour: "2-digit",
          minute: "2-digit",
        })
      : "";

  return (
   <Box
  sx={{
    px: 1,
    py: 0.75,
    borderRadius: 1,
    lineHeight: 1.25,
    overflow: "hidden",
    height: "100%",
    display: "flex",
    flexDirection: "column",
    justifyContent: "center",
  }}
>
      <Typography
        component="div"
        sx={{
          fontSize: "0.78rem",
          letterSpacing: 0.2,
          fontWeight: 800,
          mb: 0.25,
        }}
      >
        {formatTime(start)}–{formatTime(end)}
      </Typography>

      <Typography
        component="div"
        sx={{
          fontSize: "0.82rem",
          fontWeight: 700,
        }}
      >
        👤 {info.event.extendedProps.clientName}
      </Typography>

      <Typography component="div" sx={{ fontSize: "0.72rem" }}>
        🐴 {info.event.extendedProps.horseName}
      </Typography>

      <Typography component="div" sx={{ fontSize: "0.72rem" }}>
        👨‍🏫 {info.event.extendedProps.instructorName}
      </Typography>
    </Box>
  );
}}
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