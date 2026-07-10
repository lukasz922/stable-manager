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
  updateRide,
} from "../../api/rides";

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
  const [clients, setClients] = useState<Client[]>([]);
  const [horses, setHorses] = useState<Horse[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [form, setForm] = useState(emptyForm);
  const [loadingData, setLoadingData] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isEditing = rideId !== null;

  useEffect(() => {
    async function loadLists() {
      try {
        setLoadingData(true);
        setError("");

        const [clientsData, horsesData, instructorsData] =
          await Promise.all([
            getClients(),
            getHorses(),
            getInstructors(),
          ]);

        setClients(clientsData);
        setHorses(horsesData);
        setInstructors(instructorsData);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać danych formularza.");
      } finally {
        setLoadingData(false);
      }
    }

    loadLists();
  }, []);

  useEffect(() => {
    if (!open) {
      return;
    }

    setError("");

    if (rideId === null) {
      setForm(emptyForm);
      return;
    }

    async function loadSelectedRide() {
      try {
        setLoadingData(true);

        const ride = await getRide(rideId);

    setForm({
  client_id: String(ride.client_id),
  horse_id: String(ride.horse_id),
  instructor_id: String(ride.instructor_id),
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
    if (
      !form.client_id ||
      !form.horse_id ||
      !form.instructor_id
    ) {
      setError("Wybierz klienta, konia i instruktora.");
      return;
    }

    if (!selectedDate) {
      setError("Nie wybrano terminu jazdy.");
      return;
    }

    const payload = {
      client_id: Number(form.client_id),
      horse_id: Number(form.horse_id),
      instructor_id: Number(form.instructor_id),
      start_time: normalizeDate(selectedDate),
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

              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </MenuItem>
              ))}
            </TextField>

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

              {horses.map((horse) => (
                <MenuItem key={horse.id} value={horse.id}>
                  {horse.name}
                </MenuItem>
              ))}
            </TextField>

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

              {instructors.map((instructor) => (
                <MenuItem
                  key={instructor.id}
                  value={instructor.id}
                >
                  {instructor.first_name}{" "}
                  {instructor.last_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Termin"
              value={selectedDate}
              disabled
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
  <MenuItem value="planned">Zaplanowana</MenuItem>
  <MenuItem value="completed">Odbyła się</MenuItem>
  <MenuItem value="cancelled">Odwołana</MenuItem>
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
          {isEditing && (
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
        </div>
      </DialogActions>
    </Dialog>
  );
}