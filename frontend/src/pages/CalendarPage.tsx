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
import { getInstructors, type Instructor } from "../api/instructors";
import { useEffect, useState } from "react";
import { useAuth } from "../auth/AuthContext";

function toLocalDateTime(date: Date): string {
  const offset = date.getTimezoneOffset();
  const localDate = new Date(date.getTime() - offset * 60_000);

  return localDate.toISOString().slice(0, 19);
}

const statCardSx = {
  border: "1px solid rgba(148, 163, 184, 0.22)",
  borderRadius: 3.5,
  p: 2.25,
  backgroundColor: "rgba(255,255,255,0.92)",
  cursor: "pointer",
  transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
  boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
  "&:hover": {
    transform: "translateY(-3px)",
    boxShadow: "0 18px 36px rgba(37, 99, 235, 0.10)",
    borderColor: "rgba(37, 99, 235, 0.35)",
  },
} as const;

export function CalendarPage() {
  const { hasPermission } = useAuth();
  const canManageCalendar = hasPermission("calendar.manage");
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
    ? "#e8f5e9"
    : ride.status === "checked_in"
    ? "#fff3e0"
    : ride.status === "cancelled"
    ? "#ffebee"
    : "#e3f2fd",
  textColor: "#172033",
  classNames: [`ride-status-${ride.status}`],
  borderColor:
  ride.status === "completed"
    ? "#43a047"
    : ride.status === "checked_in"
    ? "#fb8c00"
    : ride.status === "cancelled"
    ? "#e53935"
    : "#1e88e5",
  extendedProps: {
    clientName: ride.client_name || "Klient",
    horseName: ride.horse_name || "Koń",
    instructorName: ride.instructor_name || "Instruktor",
    status: ride.status,
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
    <Box className="stable-calendar-page">
      <Box
        sx={{
          display: "flex",
          alignItems: { xs: "flex-start", md: "center" },
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
          p: { xs: 2.5, md: 3 },
          borderRadius: 4,
          flexDirection: { xs: "column", md: "row" },
          background:
            "linear-gradient(135deg, #0f4fd8 0%, #2563eb 58%, #60a5fa 100%)",
          color: "#fff",
          boxShadow: "0 18px 46px rgba(37, 99, 235, 0.22)",
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            Kalendarz jazd
          </Typography>

          <Typography sx={{ color: "rgba(255,255,255,0.82)" }}>
            Zarządzaj planem jazd, dostępnością koni i instruktorów.
          </Typography>
        </Box>

        {canManageCalendar && (
          <Button
            variant="contained"
            onClick={() => {
              setSelectedRideId(null);
              setSelectedDate(toLocalDateTime(new Date()));
              setDialogOpen(true);
            }}
            sx={{
              borderRadius: 2.5,
              px: 2.5,
              py: 1.15,
              textTransform: "none",
              fontWeight: 700,
              bgcolor: "#fff",
              color: "#0f4fd8",
              boxShadow: "0 10px 24px rgba(76, 5, 25, 0.18)",
              "&:hover": {
                bgcolor: "#eff6ff",
              },
            }}
          >
            + Dodaj jazdę
          </Button>
        )}
      </Box>
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
    ...statCardSx,
    borderColor: selectedStatus === "" ? "#90caf9" : "#e7eaf0",
    backgroundColor: selectedStatus === "" ? "#f5faff" : "#ffffff",
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
    ...statCardSx,
    borderColor: selectedStatus === "planned" ? "#90caf9" : "#e7eaf0",
    backgroundColor: selectedStatus === "planned" ? "#f5faff" : "#ffffff",
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
    ...statCardSx,
    borderColor: selectedStatus === "completed" ? "#90caf9" : "#e7eaf0",
    backgroundColor: selectedStatus === "completed" ? "#f5faff" : "#ffffff",
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
    ...statCardSx,
    borderColor: selectedStatus === "cancelled" ? "#90caf9" : "#e7eaf0",
    backgroundColor: selectedStatus === "cancelled" ? "#f5faff" : "#ffffff",
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
  sx={{
    mb: 3,
    p: 2,
    border: "1px solid rgba(148, 163, 184, 0.22)",
    borderRadius: 3.5,
    backgroundColor: "rgba(255,255,255,0.94)",
    boxShadow: "0 12px 30px rgba(15, 23, 42, 0.05)",
  }}
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
        className="stable-calendar-shell"
        sx={{
          background: "rgba(255,255,255,0.96)",
          border: "1px solid rgba(148, 163, 184, 0.22)",
          borderRadius: 4,
          p: { xs: 1, md: 2.25 },
          boxShadow: "0 18px 44px rgba(15, 23, 42, 0.07)",
          overflow: "hidden",
        }}
      >
        <FullCalendar
          plugins={[dayGridPlugin, timeGridPlugin, interactionPlugin]}
          initialView="timeGridWeek"
          height="auto"
          stickyHeaderDates={true}
          dayMaxEventRows={4}
          moreLinkText={(count) => `+${count} więcej`}
          locale="pl"
          firstDay={1}
          weekends={true}
          allDaySlot={false}
          nowIndicator={true}
          selectable={canManageCalendar}
          editable={canManageCalendar}
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
            const status = info.event.extendedProps.status as string;

            const formatTime = (date: Date | null) =>
              date
                ? date.toLocaleTimeString("pl-PL", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

            const statusLabel =
              status === "completed"
                ? "Odbyta"
                : status === "checked_in"
                  ? "Klient obecny"
                  : status === "cancelled"
                    ? "Anulowana"
                    : "Zaplanowana";

            return (
              <Box className="stable-calendar-event-content">
                <Box className="stable-calendar-event-top">
                  <Typography
                    component="div"
                    className="stable-calendar-event-time"
                  >
                    {formatTime(start)}–{formatTime(end)}
                  </Typography>

                  <Box className="stable-calendar-event-badge">
                    {statusLabel}
                  </Box>
                </Box>

                <Typography
                  component="div"
                  className="stable-calendar-event-client"
                >
                  {info.event.extendedProps.clientName}
                </Typography>

                <Typography
                  component="div"
                  className="stable-calendar-event-meta"
                >
                  🐴 {info.event.extendedProps.horseName}
                </Typography>

                <Typography
                  component="div"
                  className="stable-calendar-event-meta"
                >
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
            if (!canManageCalendar) {
              setErrorMessage(
                "Masz dostęp tylko do podglądu kalendarza."
              );
              return;
            }

            setSelectedRideId(Number(info.event.id));
            setSelectedDate(info.event.startStr);
            setDialogOpen(true);
          }}
          dateClick={(info) => {
            if (!canManageCalendar) {
              setErrorMessage(
                "Brak uprawnienia do dodawania jazd."
              );
              return;
            }

            setSelectedRideId(null);
            setSelectedDate(info.dateStr);
            setDialogOpen(true);
          }}
          eventDrop={async (info) => {
            if (!canManageCalendar) {
              info.revert();
              setErrorMessage(
                "Brak uprawnienia do zmiany terminu jazdy."
              );
              return;
            }

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