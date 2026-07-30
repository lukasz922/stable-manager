import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";

import { getClients, type Client } from "../../api/clients";
import { getHorses, type Horse } from "../../api/horses";
import {
  getInstructors,
  type Instructor,
} from "../../api/instructors";
import {
  createRide,
  deleteRide,
  getRide,
  getRides,
  updateRide,
  type Ride,
} from "../../api/rides";
import { useAuth } from "../../auth/AuthContext";
import {
  getInstructorSchedule,
  type InstructorSchedule,
} from "../../api/instructorSchedule";

type RideAction = "created" | "updated" | "deleted";

type RideDialogProps = {
  open: boolean;
  selectedDate: string;
  rideId: number | null;
  onClose: () => void;
  onSaved: (action: RideAction) => void;
};

const emptyForm = {
  client_id: "",
  horse_id: "",
  instructor_id: "",
  start_time: "",
  duration_minutes: "60",
  status: "planned",
  notes: "",
};

export function RideDialog({
  open,
  selectedDate,
  rideId,
  onClose,
  onSaved,
}: RideDialogProps) {
  const { hasPermission } = useAuth();
  const canManageCalendar = hasPermission("calendar.manage");
  const [clients, setClients] = useState<Client[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [rides, setRides] = useState<Ride[]>([]);
  const [schedule, setSchedule] = useState<InstructorSchedule[]>([]);

  const [form, setForm] = useState(emptyForm);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = rideId !== null;

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadLists() {
      try {
        setLoadingData(true);
        setError("");

        const [clientsData, horsesData, instructorsData, ridesData] =
          await Promise.all([
            getClients(),
            getHorses(),
            getInstructors(),
            getRides(),
          ]);

        setClients(clientsData);
        setHorses(horsesData);
        setInstructors(instructorsData);
        setRides(ridesData);
      } catch (err) {
        console.error(err);
        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać danych formularza."
        );
      } finally {
        setLoadingData(false);
      }
    }

    void loadLists();
  }, [open]);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");

if (rideId === null) {
  setForm({
    ...emptyForm,
    start_time: selectedDate.slice(0, 16),
  });
  return;
}

    async function loadSelectedRide() {
      try {
        setLoadingData(true);

if (rideId === null) {
  return;
}

const ride = await getRide(rideId);
    setForm({
  client_id: String(ride.client_id),
  horse_id: String(ride.horse_id),
  instructor_id: String(ride.instructor_id),
  start_time: ride.start_time.slice(0, 16),
  duration_minutes: String(ride.duration_minutes),
  status: ride.status || "planned",
  notes: ride.notes || "",
});
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać danych jazdy.");
      } finally {
        setLoadingData(false);
      }
    }

    loadSelectedRide();
  }, [open, rideId]);

  useEffect(() => {
    if (!open || !form.start_time) {
      setSchedule([]);
      return;
    }

    const parsedDate = new Date(form.start_time);

    if (Number.isNaN(parsedDate.getTime())) {
      setSchedule([]);
      return;
    }

    let cancelled = false;

    async function loadSchedule() {
      try {
        const data = await getInstructorSchedule(
          parsedDate.getFullYear(),
          parsedDate.getMonth() + 1
        );

        if (!cancelled) {
          setSchedule(data);
        }
      } catch (err) {
        console.error(err);

        if (!cancelled) {
          setSchedule([]);
          setError(
            "Nie udało się pobrać grafiku instruktorów."
          );
        }
      }
    }

    void loadSchedule();

    return () => {
      cancelled = true;
    };
  }, [open, form.start_time]);

  function toMinutes(value: string): number {
    const [hours, minutes] = value.slice(0, 5).split(":").map(Number);
    return hours * 60 + minutes;
  }

  type InstructorAvailability = {
    instructor: Instructor;
    available: boolean;
    reason?: string;
  };

  function getInstructorAvailability(
    instructor: Instructor
  ): InstructorAvailability {
    if (!form.start_time || form.status === "cancelled") {
      return {
        instructor,
        available: true,
      };
    }

    const date = form.start_time.slice(0, 10);
    const startMinutes = toMinutes(form.start_time.slice(11, 16));
    const endMinutes =
      startMinutes + Number(form.duration_minutes || 0);

    const scheduleEntry = schedule.find(
      (item) =>
        item.instructor_id === instructor.id &&
        item.date.startsWith(date)
    );

    if (!scheduleEntry) {
      return {
        instructor,
        available: false,
        reason: "brak grafiku",
      };
    }

    if (scheduleEntry.status !== "WORK") {
      const statusLabels: Record<string, string> = {
        OFF: "wolne",
        VACATION: "urlop",
        SICK: "chorobowe",
        TRAINING: "szkolenie",
      };

      return {
        instructor,
        available: false,
        reason:
          statusLabels[scheduleEntry.status] ??
          `status: ${scheduleEntry.status}`,
      };
    }

    if (
      !scheduleEntry.start_time ||
      !scheduleEntry.end_time ||
      !scheduleEntry.availability_start_time ||
      !scheduleEntry.availability_end_time
    ) {
      return {
        instructor,
        available: false,
        reason: "niepełny grafik",
      };
    }

    const workStart = toMinutes(scheduleEntry.start_time);
    const workEnd = toMinutes(scheduleEntry.end_time);
    const availabilityStart = toMinutes(
      scheduleEntry.availability_start_time
    );
    const availabilityEnd = toMinutes(
      scheduleEntry.availability_end_time
    );

    if (
      startMinutes < workStart ||
      endMinutes > workEnd
    ) {
      return {
        instructor,
        available: false,
        reason: `poza godzinami pracy ${scheduleEntry.start_time.slice(
          0,
          5
        )}–${scheduleEntry.end_time.slice(0, 5)}`,
      };
    }

    if (
      startMinutes < availabilityStart ||
      endMinutes > availabilityEnd
    ) {
      return {
        instructor,
        available: false,
        reason: `poza dyspozycyjnością ${scheduleEntry.availability_start_time.slice(
          0,
          5
        )}–${scheduleEntry.availability_end_time.slice(0, 5)}`,
      };
    }

    const conflictingRide = rides.find((ride) => {
      if (
        ride.id === rideId ||
        ride.status === "cancelled" ||
        ride.instructor_id !== instructor.id
      ) {
        return false;
      }

      const existingStart = new Date(ride.start_time);
      const selectedStart = new Date(form.start_time);

      if (
        Number.isNaN(existingStart.getTime()) ||
        Number.isNaN(selectedStart.getTime())
      ) {
        return false;
      }

      const existingEnd = new Date(
        existingStart.getTime() +
          ride.duration_minutes * 60_000
      );
      const selectedEnd = new Date(
        selectedStart.getTime() +
          Number(form.duration_minutes || 0) * 60_000
      );

      return (
        selectedStart < existingEnd &&
        selectedEnd > existingStart
      );
    });

    if (conflictingRide) {
      const conflictStart = conflictingRide.start_time.slice(11, 16);
      const conflictEndDate = new Date(
        new Date(conflictingRide.start_time).getTime() +
          conflictingRide.duration_minutes * 60_000
      );
      const conflictEnd = conflictEndDate
        .toTimeString()
        .slice(0, 5);

      return {
        instructor,
        available: false,
        reason: `inna jazda ${conflictStart}–${conflictEnd}`,
      };
    }

    return {
      instructor,
      available: true,
    };
  }

  const instructorAvailability = instructors
    .map(getInstructorAvailability)
    .sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }

      const aName =
        `${a.instructor.first_name} ${a.instructor.last_name}`;
      const bName =
        `${b.instructor.first_name} ${b.instructor.last_name}`;

      return aName.localeCompare(bName, "pl");
    });

  const availableInstructorsCount = instructorAvailability.filter(
    (item) => item.available
  ).length;

  type ClientAvailability = {
    client: Client;
    available: boolean;
    reason?: string;
  };

  function getClientAvailability(
    client: Client
  ): ClientAvailability {
    if (!form.start_time || form.status === "cancelled") {
      return {
        client,
        available: true,
      };
    }

    const conflictingRide = rides.find((ride) => {
      if (
        ride.id === rideId ||
        ride.status === "cancelled" ||
        ride.client_id !== client.id
      ) {
        return false;
      }

      const existingStart = new Date(ride.start_time);
      const selectedStart = new Date(form.start_time);

      if (
        Number.isNaN(existingStart.getTime()) ||
        Number.isNaN(selectedStart.getTime())
      ) {
        return false;
      }

      const existingEnd = new Date(
        existingStart.getTime() +
          ride.duration_minutes * 60_000
      );
      const selectedEnd = new Date(
        selectedStart.getTime() +
          Number(form.duration_minutes || 0) * 60_000
      );

      return (
        selectedStart < existingEnd &&
        selectedEnd > existingStart
      );
    });

    if (conflictingRide) {
      const conflictStart = conflictingRide.start_time.slice(11, 16);
      const conflictEndDate = new Date(
        new Date(conflictingRide.start_time).getTime() +
          conflictingRide.duration_minutes * 60_000
      );
      const conflictEnd = conflictEndDate
        .toTimeString()
        .slice(0, 5);

      return {
        client,
        available: false,
        reason: `inna jazda ${conflictStart}–${conflictEnd}`,
      };
    }

    return {
      client,
      available: true,
    };
  }

  const clientAvailability = clients
    .map(getClientAvailability)
    .sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }

      const aName =
        `${a.client.first_name} ${a.client.last_name}`;
      const bName =
        `${b.client.first_name} ${b.client.last_name}`;

      return aName.localeCompare(bName, "pl");
    });

  const availableClientsCount = clientAvailability.filter(
    (item) => item.available
  ).length;

  type HorseAvailability = {
    horse: Horse;
    available: boolean;
    reason?: string;
  };

  function getHorseAvailability(
    horse: Horse
  ): HorseAvailability {
    if (!form.start_time || form.status === "cancelled") {
      return {
        horse,
        available: true,
      };
    }

    const conflictingRide = rides.find((ride) => {
      if (
        ride.id === rideId ||
        ride.status === "cancelled" ||
        ride.horse_id !== horse.id
      ) {
        return false;
      }

      const existingStart = new Date(ride.start_time);
      const selectedStart = new Date(form.start_time);

      if (
        Number.isNaN(existingStart.getTime()) ||
        Number.isNaN(selectedStart.getTime())
      ) {
        return false;
      }

      const existingEnd = new Date(
        existingStart.getTime() +
          ride.duration_minutes * 60_000
      );
      const selectedEnd = new Date(
        selectedStart.getTime() +
          Number(form.duration_minutes || 0) * 60_000
      );

      return (
        selectedStart < existingEnd &&
        selectedEnd > existingStart
      );
    });

    if (conflictingRide) {
      const conflictStart = conflictingRide.start_time.slice(11, 16);
      const conflictEndDate = new Date(
        new Date(conflictingRide.start_time).getTime() +
          conflictingRide.duration_minutes * 60_000
      );
      const conflictEnd = conflictEndDate
        .toTimeString()
        .slice(0, 5);

      return {
        horse,
        available: false,
        reason: `inna jazda ${conflictStart}–${conflictEnd}`,
      };
    }

    return {
      horse,
      available: true,
    };
  }

  const horseAvailability = horses
    .map(getHorseAvailability)
    .sort((a, b) => {
      if (a.available !== b.available) {
        return a.available ? -1 : 1;
      }

      return a.horse.name.localeCompare(b.horse.name, "pl");
    });

  const availableHorsesCount = horseAvailability.filter(
    (item) => item.available
  ).length;

  function normalizeDate(value: string): string {
    return value.replace(/Z$/, "").replace(/[+-]\d{2}:\d{2}$/, "");
  }

  function handleClose() {
    if (saving) {
      return;
    }

    setError("");
    onClose();
  }

  async function handleSave() {
    if (!canManageCalendar) {
      setError("Brak uprawnienia do zarządzania jazdami.");
      return;
    }
    if (
      !form.client_id ||
      !form.horse_id ||
      !form.instructor_id
    ) {
      setError("Wybierz klienta, konia i instruktora.");
      return;
    }

    if (!form.start_time) {
    setError("Nie wybrano terminu jazdy.");
    return;
}

    const payload = {
      client_id: Number(form.client_id),
      horse_id: Number(form.horse_id),
      instructor_id: Number(form.instructor_id),
      start_time: normalizeDate(form.start_time),
      duration_minutes: Number(form.duration_minutes),
      ride_type: "individual",
      status: form.status,
      notes: form.notes.trim() || undefined,
    };

    try {
      setSaving(true);
      setError("");

      if (rideId !== null) {
        await updateRide(rideId, payload);
        onSaved("updated");
      } else {
        await createRide(payload);
        onSaved("created");
      }

      setForm(emptyForm);
      onClose();
   } catch (err) {
  console.error(err);

  setError(
    err instanceof Error
      ? err.message
      : "Nie udało się zapisać jazdy."
  );
} finally {
      setSaving(false);
    }
  }

  async function handleDelete() {
    if (!canManageCalendar) {
      setError("Brak uprawnienia do usuwania jazd.");
      return;
    }
    if (rideId === null) {
      return;
    }

    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć tę jazdę?"
    );

    if (!confirmed) {
      return;
    }

    try {
      setSaving(true);
      setError("");

      await deleteRide(rideId);

      onSaved("deleted");
      setForm(emptyForm);
      onClose();
    } catch (err) {
      console.error(err);
      setError("Nie udało się usunąć jazdy.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>
        {isEditing ? "✏️ Edytuj jazdę" : "📅 Nowa jazda"}
      </DialogTitle>

      <DialogContent>
        {loadingData ? (
          <Stack
            alignItems="center"
            justifyContent="center"
            sx={{ py: 5 }}
          >
            <CircularProgress />
          </Stack>
        ) : (
          <Stack spacing={2} sx={{ mt: 1 }}>
            {error && <Alert severity="error">{error}</Alert>}

            {form.start_time &&
              availableClientsCount === 0 && (
                <Alert severity="warning">
                  Brak dostępnych klientów w wybranym terminie.
                  Sprawdź powody na liście poniżej.
                </Alert>
              )}

            <TextField
              select
              required
              label="Klient"
              value={form.client_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  client_id: event.target.value,
                })
              }
            >
              <MenuItem value="">
                -- wybierz klienta --
              </MenuItem>

              {clientAvailability.map(
                ({ client, available, reason }) => (
                  <MenuItem
                    key={client.id}
                    value={client.id}
                    disabled={!available}
                  >
                    {client.first_name} {client.last_name}
                    {available
                      ? " — dostępny"
                      : ` — ${reason ?? "niedostępny"}`}
                  </MenuItem>
                )
              )}
            </TextField>

            {form.start_time &&
              availableHorsesCount === 0 && (
                <Alert severity="warning">
                  Brak dostępnych koni w wybranym terminie.
                  Sprawdź powody na liście poniżej.
                </Alert>
              )}

            <TextField
              select
              required
              label="Koń"
              value={form.horse_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  horse_id: event.target.value,
                })
              }
            >
              <MenuItem value="">
                -- wybierz konia --
              </MenuItem>

              {horseAvailability.map(
                ({ horse, available, reason }) => (
                  <MenuItem
                    key={horse.id}
                    value={horse.id}
                    disabled={!available}
                  >
                    {horse.name}
                    {available
                      ? " — dostępny"
                      : ` — ${reason ?? "niedostępny"}`}
                  </MenuItem>
                )
              )}
            </TextField>

            {form.start_time &&
              availableInstructorsCount === 0 && (
                <Alert severity="warning">
                  Brak dostępnych instruktorów w wybranym terminie.
                  Sprawdź powody na liście poniżej.
                </Alert>
              )}

            <TextField
              select
              required
              label="Instruktor"
              value={form.instructor_id}
              onChange={(event) =>
                setForm({
                  ...form,
                  instructor_id: event.target.value,
                })
              }
            >
              <MenuItem value="">
                -- wybierz instruktora --
              </MenuItem>

              {instructorAvailability.map(
                ({ instructor, available, reason }) => (
                  <MenuItem
                    key={instructor.id}
                    value={instructor.id}
                    disabled={!available}
                  >
                    {instructor.first_name}{" "}
                    {instructor.last_name}
                    {available
                      ? " — dostępny"
                      : ` — ${reason ?? "niedostępny"}`}
                  </MenuItem>
                )
              )}
            </TextField>

            <TextField
  required
  type="datetime-local"
  label="Data i godzina rozpoczęcia"
  value={form.start_time}
  InputLabelProps={{ shrink: true }}
  inputProps={{ step: 900 }}
  onChange={(event) =>
    setForm({
      ...form,
      start_time: event.target.value,
    })
  }
/>

            <TextField
              select
              label="Czas trwania"
              value={form.duration_minutes}
              onChange={(event) =>
                setForm({
                  ...form,
                  duration_minutes: event.target.value,
                })
              }
            >
              <MenuItem value="30">30 minut</MenuItem>
              <MenuItem value="45">45 minut</MenuItem>
              <MenuItem value="60">60 minut</MenuItem>
              <MenuItem value="90">90 minut</MenuItem>
            </TextField>
<TextField
  select
  label="Status"
  value={form.status}
  onChange={(event) =>
    setForm({
      ...form,
      status: event.target.value,
    })
  }
>
  <MenuItem value="planned">📅 Zaplanowana</MenuItem>
  <MenuItem value="checked_in">🟠 Odbito / klient obecny</MenuItem>
  <MenuItem value="completed">✅ Odbyła się</MenuItem>
  <MenuItem value="cancelled">❌ Odwołana</MenuItem>
</TextField>
            <TextField
              multiline
              rows={3}
              label="Notatki"
              value={form.notes}
              onChange={(event) =>
                setForm({
                  ...form,
                  notes: event.target.value,
                })
              }
            />
          </Stack>
        )}
      </DialogContent>

      <DialogActions
        sx={{
          justifyContent: "space-between",
          px: 3,
          pb: 2,
        }}
      >
        <div>
          {isEditing && canManageCalendar && (
            <Button
              color="error"
              onClick={handleDelete}
              disabled={saving || loadingData}
            >
              Usuń jazdę
            </Button>
          )}
        </div>

        <div>
          <Button
            onClick={handleClose}
            disabled={saving}
          >
            Anuluj
          </Button>

          {canManageCalendar && (
            <Button
              variant="contained"
              onClick={handleSave}
              disabled={saving || loadingData}
            >
              {saving
                ? "Zapisywanie..."
                : isEditing
                  ? "Zapisz zmiany"
                  : "Dodaj jazdę"}
            </Button>
          )}
        </div>
      </DialogActions>
    </Dialog>
  );
}