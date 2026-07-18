import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Stack,
  TextField,
} from "@mui/material";

import type { PassSummary } from "../api/checkin";
import { getHorses, type Horse } from "../api/horses";
import {
  getInstructors,
  type Instructor,
} from "../api/instructors";

type QuickRideDialogProps = {
  open: boolean;
  clientName: string;
  passes: PassSummary[];
  onClose: () => void;
  onSubmit: (data: {
    pass_id: number;
    horse_id: number;
    instructor_id: number;
    duration_minutes: number;
  }) => Promise<void>;
};

export function QuickRideDialog({
  open,
  clientName,
  passes,
  onClose,
  onSubmit,
}: QuickRideDialogProps) {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [instructors, setInstructors] = useState<Instructor[]>([]);

  const [passId, setPassId] = useState("");
  const [horseId, setHorseId] = useState("");
  const [instructorId, setInstructorId] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(60);

  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    async function loadOptions() {
      try {
        setLoadingOptions(true);
        setError("");

        const [horsesData, instructorsData] = await Promise.all([
          getHorses(),
          getInstructors(),
        ]);

     setHorses(horsesData);

        setInstructors(
          instructorsData.filter(
            (instructor) => instructor.status === "active"
          )
        );
      } catch (err) {
        const message =
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać danych formularza.";

        setError(message);
      } finally {
        setLoadingOptions(false);
      }
    }

    loadOptions();
  }, [open]);

  useEffect(() => {
    if (!open) {
      setPassId("");
      setHorseId("");
      setInstructorId("");
      setDurationMinutes(60);
      setError("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!passId || !horseId || !instructorId) {
      setError("Wybierz karnet, konia i instruktora.");
      return;
    }

    if (durationMinutes <= 0) {
      setError("Czas jazdy musi być większy od zera.");
      return;
    }

    try {
      setLoading(true);
      setError("");

      await onSubmit({
        pass_id: Number(passId),
        horse_id: Number(horseId),
        instructor_id: Number(instructorId),
        duration_minutes: durationMinutes,
      });
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : "Nie udało się utworzyć szybkiej jazdy.";

      setError(message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>Szybka jazda — {clientName}</DialogTitle>

      <DialogContent>
        <Stack spacing={3} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          {passes.length === 0 && (
            <Alert severity="warning">
              Klient nie ma aktywnego karnetu z dostępnymi wejściami.
            </Alert>
          )}

          <FormControl fullWidth disabled={loadingOptions || loading}>
            <InputLabel>Karnet</InputLabel>
            <Select
              value={passId}
              label="Karnet"
              onChange={(event) => setPassId(event.target.value)}
            >
              {passes.map((clientPass) => (
                <MenuItem key={clientPass.id} value={clientPass.id}>
                  {clientPass.name} — pozostało:{" "}
                  {clientPass.remaining_entries}, ważny do:{" "}
                  {clientPass.valid_until}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loadingOptions || loading}>
            <InputLabel>Koń</InputLabel>
            <Select
              value={horseId}
              label="Koń"
              onChange={(event) => setHorseId(event.target.value)}
            >
              {horses.map((horse) => (
                <MenuItem key={horse.id} value={horse.id}>
                  {horse.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <FormControl fullWidth disabled={loadingOptions || loading}>
            <InputLabel>Instruktor</InputLabel>
            <Select
              value={instructorId}
              label="Instruktor"
              onChange={(event) =>
                setInstructorId(event.target.value)
              }
            >
              {instructors.map((instructor) => (
                <MenuItem key={instructor.id} value={instructor.id}>
                  {instructor.first_name} {instructor.last_name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <TextField
            label="Czas jazdy w minutach"
            type="number"
            value={durationMinutes}
            onChange={(event) =>
              setDurationMinutes(Number(event.target.value))
            }
            inputProps={{ min: 1 }}
            disabled={loading}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions>
        <Button onClick={onClose} disabled={loading}>
          Anuluj
        </Button>

        <Button
          variant="contained"
          onClick={handleSubmit}
          disabled={
            loading ||
            loadingOptions ||
            passes.length === 0
          }
        >
          {loading ? "Tworzenie..." : "Rozpocznij jazdę"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}