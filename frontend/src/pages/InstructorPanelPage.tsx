import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  FormControlLabel,
  Paper,
  Stack,
  Tab,
  Tabs,
  TextField,
  Typography,
} from "@mui/material";

import {
  createMyAvailabilityRequest,
  deleteMyAvailabilityRequest,
  getMyAvailabilityRequests,
  getMyInstructorProfile,
  getMyRides,
  getMySchedule,
  updateMyAvailabilityRequest,
} from "../api/instructorMe";
import type {
  MyAvailabilityPayload,
  MyAvailabilityRequest,
  MyInstructorProfile,
  MyRide,
  MyScheduleEntry,
} from "../api/instructorMe";

const monthNames = [
  "Styczeń",
  "Luty",
  "Marzec",
  "Kwiecień",
  "Maj",
  "Czerwiec",
  "Lipiec",
  "Sierpień",
  "Wrzesień",
  "Październik",
  "Listopad",
  "Grudzień",
];

const weekdayOptions = [
  { value: 0, label: "Pon" },
  { value: 1, label: "Wt" },
  { value: 2, label: "Śr" },
  { value: 3, label: "Czw" },
  { value: 4, label: "Pt" },
  { value: 5, label: "Sob" },
  { value: 6, label: "Nd" },
];

const initialAvailability: MyAvailabilityPayload = {
  date_from: "",
  date_to: "",
  weekdays: [0, 1, 2, 3, 4],
  availability_start_time: "08:00",
  availability_end_time: "16:00",
  note: "",
};

function formatTime(value: string | null) {
  return value ? value.slice(0, 5) : "—";
}

function statusLabel(status: string) {
  const labels: Record<string, string> = {
    WORK: "Praca",
    OFF: "Wolne",
    VACATION: "Urlop",
    SICK: "Chorobowe",
    TRAINING: "Szkolenie",
    planned: "Zaplanowana",
    checked_in: "Rozpoczęta",
    completed: "Zakończona",
    cancelled: "Anulowana",
    PENDING: "Oczekujące",
    APPROVED: "Zatwierdzone",
    REJECTED: "Odrzucone",
  };

  return labels[status] ?? status;
}

export function InstructorPanelPage() {
  const today = new Date();

  const [tab, setTab] = useState(0);
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [profile, setProfile] =
    useState<MyInstructorProfile | null>(null);
  const [schedule, setSchedule] = useState<MyScheduleEntry[]>([]);
  const [rides, setRides] = useState<MyRide[]>([]);
  const [requests, setRequests] =
    useState<MyAvailabilityRequest[]>([]);
  const [availability, setAvailability] =
    useState<MyAvailabilityPayload>(initialAvailability);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [editingRequestId, setEditingRequestId] =
    useState<number | null>(null);

  const monthLabel = useMemo(
    () => `${monthNames[month - 1]} ${year}`,
    [month, year]
  );

  async function loadProfile() {
    const data = await getMyInstructorProfile();
    setProfile(data);
  }

  async function loadSchedule() {
    const data = await getMySchedule(year, month);
    setSchedule(data);
  }

  async function loadRides() {
    const firstDay = `${year}-${String(month).padStart(2, "0")}-01`;
    const lastDay = new Date(year, month, 0)
      .toISOString()
      .slice(0, 10);

    const data = await getMyRides(firstDay, lastDay);
    setRides(data);
  }

  async function loadRequests() {
    const data = await getMyAvailabilityRequests();
    setRequests(data);
  }

  async function loadAll() {
    setLoading(true);
    setError("");

    try {
      await Promise.all([
        loadProfile(),
        loadSchedule(),
        loadRides(),
        loadRequests(),
      ]);
    } catch (loadError: unknown) {
      setError(
        loadError instanceof Error
          ? loadError.message
          : "Nie udało się pobrać panelu instruktora."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadAll();
  }, []);

  useEffect(() => {
    if (!loading) {
      void Promise.all([loadSchedule(), loadRides()]);
    }
  }, [year, month]);

  function changeMonth(offset: number) {
    const target = new Date(year, month - 1 + offset, 1);
    setYear(target.getFullYear());
    setMonth(target.getMonth() + 1);
  }

  function toggleWeekday(day: number) {
    const selected = availability.weekdays ?? [];

    setAvailability({
      ...availability,
      weekdays: selected.includes(day)
        ? selected.filter((item) => item !== day)
        : [...selected, day].sort(),
    });
  }

  async function handleSaveAvailability() {
    setSaving(true);
    setError("");
    setSuccess("");

    const payload: MyAvailabilityPayload = {
      ...availability,
      availability_start_time:
        availability.availability_start_time.length === 5
          ? `${availability.availability_start_time}:00`
          : availability.availability_start_time,
      availability_end_time:
        availability.availability_end_time.length === 5
          ? `${availability.availability_end_time}:00`
          : availability.availability_end_time,
      note: availability.note || null,
    };

    try {
      if (editingRequestId !== null) {
        await updateMyAvailabilityRequest(
          editingRequestId,
          payload
        );
        setSuccess("Zgłoszenie zostało zaktualizowane.");
      } else {
        await createMyAvailabilityRequest(payload);
        setSuccess("Zgłoszenie dyspozycyjności zostało wysłane.");
      }

      setAvailability(initialAvailability);
      setEditingRequestId(null);
      await loadRequests();
    } catch (saveError: unknown) {
      setError(
        saveError instanceof Error
          ? saveError.message
          : "Nie udało się zapisać zgłoszenia."
      );
    } finally {
      setSaving(false);
    }
  }

  function handleEditRequest(request: MyAvailabilityRequest) {
    setEditingRequestId(request.id);
    setAvailability({
      date_from: request.date_from,
      date_to: request.date_to,
      weekdays: request.weekdays,
      availability_start_time:
        request.availability_start_time.slice(0, 5),
      availability_end_time:
        request.availability_end_time.slice(0, 5),
      note: request.note ?? "",
    });
    setError("");
    setSuccess("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  function handleCancelEdit() {
    setEditingRequestId(null);
    setAvailability(initialAvailability);
    setError("");
  }

  async function handleDeleteRequest(requestId: number) {
    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć to oczekujące zgłoszenie?"
    );

    if (!confirmed) return;

    try {
      await deleteMyAvailabilityRequest(requestId);

      if (editingRequestId === requestId) {
        handleCancelEdit();
      }

      await loadRequests();
      setSuccess("Zgłoszenie zostało usunięte.");
    } catch (deleteError: unknown) {
      setError(
        deleteError instanceof Error
          ? deleteError.message
          : "Nie udało się usunąć zgłoszenia."
      );
    }
  }

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" mt={6}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Panel instruktora
      </Typography>

      {profile && (
        <Typography color="text.secondary" mb={2}>
          {profile.first_name} {profile.last_name}
          {profile.specialization
            ? ` • ${profile.specialization}`
            : ""}
        </Typography>
      )}

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {success && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {success}
        </Alert>
      )}

      <Paper sx={{ mb: 2 }}>
        <Tabs
          value={tab}
          onChange={(_, value) => setTab(value)}
          variant="scrollable"
        >
          <Tab label="Mój grafik" />
          <Tab label="Moje jazdy" />
          <Tab label="Moja dyspozycyjność" />
        </Tabs>
      </Paper>

      {(tab === 0 || tab === 1) && (
        <Paper
          variant="outlined"
          sx={{
            p: 2,
            mb: 2,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            gap: 2,
            flexWrap: "wrap",
          }}
        >
          <Button variant="outlined" onClick={() => changeMonth(-1)}>
            ← Poprzedni
          </Button>

          <Typography variant="h6" fontWeight={700}>
            {monthLabel}
          </Typography>

          <Button variant="outlined" onClick={() => changeMonth(1)}>
            Następny →
          </Button>
        </Paper>
      )}

      {tab === 0 && (
        <Stack spacing={1.5}>
          {schedule.map((entry) => (
            <Paper key={entry.id} variant="outlined" sx={{ p: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
                flexWrap="wrap"
              >
                <Box>
                  <Typography fontWeight={700}>
                    {entry.date}
                  </Typography>
                  <Typography color="text.secondary">
                    Praca: {formatTime(entry.start_time)} –{" "}
                    {formatTime(entry.end_time)}
                  </Typography>
                  <Typography color="text.secondary">
                    Dyspozycyjność:{" "}
                    {formatTime(entry.availability_start_time)} –{" "}
                    {formatTime(entry.availability_end_time)}
                  </Typography>
                </Box>

                <Chip label={statusLabel(entry.status)} />
              </Box>
            </Paper>
          ))}

          {!schedule.length && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">
                Brak wpisów w grafiku na wybrany miesiąc.
              </Typography>
            </Paper>
          )}
        </Stack>
      )}

      {tab === 1 && (
        <Stack spacing={1.5}>
          {rides.map((ride) => (
            <Paper key={ride.id} variant="outlined" sx={{ p: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                alignItems="center"
                gap={2}
                flexWrap="wrap"
              >
                <Box>
                  <Typography fontWeight={700}>
                    {new Date(ride.start_time).toLocaleString("pl-PL")}
                  </Typography>
                  <Typography>
                    Klient: {ride.client_name || `#${ride.client_id}`}
                  </Typography>
                  <Typography>
                    Koń: {ride.horse_name || `#${ride.horse_id}`}
                  </Typography>
                  <Typography color="text.secondary">
                    Czas: {ride.duration_minutes} min • {ride.ride_type}
                  </Typography>
                </Box>

                <Chip label={statusLabel(ride.status)} />
              </Box>
            </Paper>
          ))}

          {!rides.length && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">
                Brak jazd w wybranym miesiącu.
              </Typography>
            </Paper>
          )}
        </Stack>
      )}

      {tab === 2 && (
        <Stack spacing={2}>
          <Box sx={{ display: "flex", justifyContent: "center" }}>
            <Paper
              variant="outlined"
              sx={{
                p: { xs: 2, sm: 3 },
                width: "100%",
                maxWidth: 760,
              }}
            >
              <Typography variant="h6" fontWeight={700} mb={2}>
                {editingRequestId !== null
                  ? "Edytuj zgłoszenie"
                  : "Zgłoś dyspozycyjność"}
              </Typography>

              <Stack spacing={2}>
                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                    },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Data od"
                    type="date"
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                    value={availability.date_from}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        date_from: event.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Data do"
                    type="date"
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                    value={availability.date_to}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        date_to: event.target.value,
                      })
                    }
                  />
                </Box>

                <Box>
                  <Typography fontWeight={700} mb={1}>
                    Dni tygodnia
                  </Typography>

                  <Box
                    sx={{
                      display: "flex",
                      flexWrap: "wrap",
                      columnGap: 1,
                      rowGap: 0.5,
                    }}
                  >
                    {weekdayOptions.map((day) => (
                      <FormControlLabel
                        key={day.value}
                        sx={{ mr: 0.5 }}
                        control={
                          <Checkbox
                            checked={(
                              availability.weekdays ?? []
                            ).includes(day.value)}
                            onChange={() => toggleWeekday(day.value)}
                          />
                        }
                        label={day.label}
                      />
                    ))}
                  </Box>
                </Box>

                <Box
                  sx={{
                    display: "grid",
                    gridTemplateColumns: {
                      xs: "1fr",
                      sm: "1fr 1fr",
                    },
                    gap: 2,
                  }}
                >
                  <TextField
                    label="Dostępny od"
                    type="time"
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                    value={availability.availability_start_time}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        availability_start_time: event.target.value,
                      })
                    }
                  />

                  <TextField
                    label="Dostępny do"
                    type="time"
                    fullWidth
                    slotProps={{
                      inputLabel: { shrink: true },
                    }}
                    value={availability.availability_end_time}
                    onChange={(event) =>
                      setAvailability({
                        ...availability,
                        availability_end_time: event.target.value,
                      })
                    }
                  />
                </Box>

                <TextField
                  label="Notatka"
                  multiline
                  minRows={3}
                  fullWidth
                  value={availability.note ?? ""}
                  onChange={(event) =>
                    setAvailability({
                      ...availability,
                      note: event.target.value,
                    })
                  }
                />

                <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                  {editingRequestId !== null && (
                    <Button
                      variant="outlined"
                      onClick={handleCancelEdit}
                      disabled={saving}
                    >
                      Anuluj edycję
                    </Button>
                  )}

                  <Button
                    variant="contained"
                    onClick={handleSaveAvailability}
                    disabled={
                      saving ||
                      !availability.date_from ||
                      !availability.date_to ||
                      !availability.availability_start_time ||
                      !availability.availability_end_time
                    }
                  >
                    {saving
                      ? "Zapisywanie..."
                      : editingRequestId !== null
                        ? "Zapisz zmiany"
                        : "Wyślij zgłoszenie"}
                  </Button>
                </Box>
              </Stack>
            </Paper>
          </Box>

          <Typography variant="h6" fontWeight={700}>
            Moje zgłoszenia
          </Typography>

          {requests.map((request) => (
            <Paper key={request.id} variant="outlined" sx={{ p: 2 }}>
              <Box
                display="flex"
                justifyContent="space-between"
                gap={2}
                flexWrap="wrap"
              >
                <Box>
                  <Typography fontWeight={700}>
                    {request.date_from} – {request.date_to}
                  </Typography>
                  <Typography>
                    {formatTime(request.availability_start_time)} –{" "}
                    {formatTime(request.availability_end_time)}
                  </Typography>
                  {request.note && (
                    <Typography color="text.secondary">
                      {request.note}
                    </Typography>
                  )}
                  {request.admin_note && (
                    <Typography color="text.secondary">
                      Administrator: {request.admin_note}
                    </Typography>
                  )}
                </Box>

                <Box
                  display="flex"
                  alignItems="center"
                  gap={1}
                  flexWrap="wrap"
                >
                  <Chip label={statusLabel(request.status)} />

                  {request.status === "PENDING" && (
                    <>
                      <Button
                        size="small"
                        variant="outlined"
                        onClick={() => handleEditRequest(request)}
                      >
                        Edytuj
                      </Button>

                      <Button
                        size="small"
                        variant="outlined"
                        color="error"
                        onClick={() => handleDeleteRequest(request.id)}
                      >
                        Usuń
                      </Button>
                    </>
                  )}
                </Box>
              </Box>
            </Paper>
          ))}

          {!requests.length && (
            <Paper variant="outlined" sx={{ p: 3 }}>
              <Typography color="text.secondary">
                Nie masz jeszcze zgłoszeń dyspozycyjności.
              </Typography>
            </Paper>
          )}
        </Stack>
      )}
    </Box>
  );
}