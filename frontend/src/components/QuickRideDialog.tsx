import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import DirectionsRunRoundedIcon from "@mui/icons-material/DirectionsRunRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";

import type { PassSummary } from "../api/checkin";
import { getHorses, type Horse } from "../api/horses";
import { getInstructors, type Instructor } from "../api/instructors";

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
    if (!open) return;

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
          instructorsData.filter((instructor) => instructor.status === "active"),
        );
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać danych formularza.",
        );
      } finally {
        setLoadingOptions(false);
      }
    }

    void loadOptions();
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

  const selectedPass = useMemo(
    () => passes.find((item) => item.id === Number(passId)),
    [passes, passId],
  );

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
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się utworzyć szybkiej jazdy.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={loading ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>
        Szybka jazda
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2.5} sx={{ mt: 1 }}>
          <Paper
            elevation={0}
            sx={{
              p: 2,
              bgcolor: "primary.50",
              borderRadius: 3,
              display: "flex",
              alignItems: "center",
              gap: 1.5,
            }}
          >
            <PersonRoundedIcon color="primary" />
            <Box>
              <Typography variant="caption" color="text.secondary">
                Klient
              </Typography>
              <Typography fontWeight={900}>{clientName}</Typography>
            </Box>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          {passes.length === 0 && (
            <Alert severity="warning">
              Klient nie ma aktywnego karnetu z dostępnymi wejściami.
            </Alert>
          )}

          {loadingOptions ? (
            <Box sx={{ py: 5, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : (
            <Box
              sx={{
                display: "grid",
                gridTemplateColumns: { xs: "1fr", md: "repeat(2, 1fr)" },
                gap: 2,
              }}
            >
              <FormControl fullWidth disabled={loading}>
                <InputLabel>Karnet</InputLabel>
                <Select
                  value={passId}
                  label="Karnet"
                  onChange={(event) => setPassId(event.target.value)}
                >
                  {passes.map((clientPass) => (
                    <MenuItem key={clientPass.id} value={clientPass.id}>
                      {clientPass.name} · {clientPass.remaining_entries} wejść
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <TextField
                label="Czas jazdy"
                type="number"
                value={durationMinutes}
                onChange={(event) =>
                  setDurationMinutes(Number(event.target.value))
                }
                inputProps={{ min: 1, step: 5 }}
                disabled={loading}
                helperText="Czas w minutach"
                fullWidth
              />

              <FormControl fullWidth disabled={loading}>
                <InputLabel>Koń</InputLabel>
                <Select
                  value={horseId}
                  label="Koń"
                  onChange={(event) => setHorseId(event.target.value)}
                  startAdornment={<PetsRoundedIcon sx={{ mr: 1 }} color="action" />}
                >
                  {horses.map((horse) => (
                    <MenuItem key={horse.id} value={horse.id}>
                      {horse.name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>

              <FormControl fullWidth disabled={loading}>
                <InputLabel>Instruktor</InputLabel>
                <Select
                  value={instructorId}
                  label="Instruktor"
                  onChange={(event) => setInstructorId(event.target.value)}
                  startAdornment={<SchoolRoundedIcon sx={{ mr: 1 }} color="action" />}
                >
                  {instructors.map((instructor) => (
                    <MenuItem key={instructor.id} value={instructor.id}>
                      {instructor.first_name} {instructor.last_name}
                    </MenuItem>
                  ))}
                </Select>
              </FormControl>
            </Box>
          )}

          {selectedPass && (
            <Alert severity="info">
              Karnet ważny do {selectedPass.valid_until}. Pozostało wejść:{" "}
              {selectedPass.remaining_entries}.
            </Alert>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={loading}>
          Anuluj
        </Button>

        <Button
          variant="contained"
          startIcon={
            loading ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DirectionsRunRoundedIcon />
            )
          }
          onClick={() => void handleSubmit()}
          disabled={
            loading ||
            loadingOptions ||
            passes.length === 0 ||
            !passId ||
            !horseId ||
            !instructorId
          }
        >
          {loading ? "Tworzenie..." : "Rozpocznij jazdę"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}