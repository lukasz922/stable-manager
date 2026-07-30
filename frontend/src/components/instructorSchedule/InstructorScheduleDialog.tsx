import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControlLabel,
  MenuItem,
  Stack,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";

import type {
  InstructorSchedule,
  InstructorScheduleCreate,
  InstructorScheduleRangeCreate,
  InstructorScheduleRangeDelete,
  InstructorScheduleRangeDeleteResult,
  InstructorScheduleRangeResult,
  InstructorScheduleRangeUpdate,
  InstructorScheduleRangeUpdateResult,
} from "../../api/instructorSchedule";

const weekdayOptions = [
  { value: 0, label: "Pn" },
  { value: 1, label: "Wt" },
  { value: 2, label: "Śr" },
  { value: 3, label: "Czw" },
  { value: 4, label: "Pt" },
  { value: 5, label: "Sob" },
  { value: 6, label: "Nd" },
];

interface Props {
  open: boolean;
  entry: InstructorSchedule | null;
  instructorId: number | null;
  date: string;
  onClose: () => void;
  onSave: (data: InstructorScheduleCreate) => Promise<void>;
  onSaveRange: (
    data: InstructorScheduleRangeCreate
  ) => Promise<InstructorScheduleRangeResult>;
  onUpdateRange: (
    data: InstructorScheduleRangeUpdate
  ) => Promise<InstructorScheduleRangeUpdateResult>;
  onDeleteRange: (
    data: InstructorScheduleRangeDelete
  ) => Promise<InstructorScheduleRangeDeleteResult>;
  onUpdate: (
    id: number,
    data: InstructorScheduleCreate
  ) => Promise<void>;
  onDelete: (id: number) => Promise<void>;
}

export function InstructorScheduleDialog({
  open,
  entry,
  instructorId,
  date,
  onClose,
  onSave,
  onSaveRange,
  onUpdateRange,
  onDeleteRange,
  onUpdate,
  onDelete,
}: Props) {
  const [status, setStatus] = useState("WORK");
  const [startTime, setStartTime] = useState("08:00");
  const [endTime, setEndTime] = useState("16:00");
  const [availabilityStartTime, setAvailabilityStartTime] =
    useState("08:00");
  const [availabilityEndTime, setAvailabilityEndTime] =
    useState("18:00");
  const [note, setNote] = useState("");

  const [applyToRange, setApplyToRange] = useState(false);
  const [dateTo, setDateTo] = useState("");
  const [selectedWeekdays, setSelectedWeekdays] = useState<number[]>([
    0,
    1,
    2,
    3,
    4,
  ]);
  const [overwriteExisting, setOverwriteExisting] = useState(false);

  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  useEffect(() => {
    if (!open) {
      return;
    }

    setFormError("");
    setApplyToRange(false);
    setDateTo(date);
    setSelectedWeekdays([0, 1, 2, 3, 4]);
    setOverwriteExisting(false);

    if (entry) {
      setStatus(entry.status);
      setStartTime(entry.start_time ?? "");
      setEndTime(entry.end_time ?? "");
      setAvailabilityStartTime(
        entry.availability_start_time ?? ""
      );
      setAvailabilityEndTime(
        entry.availability_end_time ?? ""
      );
      setNote(entry.note ?? "");
    } else {
      setStatus("WORK");
      setStartTime("08:00");
      setEndTime("16:00");
      setAvailabilityStartTime("08:00");
      setAvailabilityEndTime("18:00");
      setNote("");
    }
  }, [open, entry, date]);


  const showError = (message: string) => {
    setFormError(message);
  };

  const validateTimes = (): boolean => {
    if (status !== "WORK") {
      return true;
    }

    if (!startTime || !endTime) {
      showError("Należy podać godziny rozpoczęcia i zakończenia pracy.");
      return false;
    }

    if (!availabilityStartTime || !availabilityEndTime) {
      showError("Należy podać obie godziny dyspozycyjności.");
      return false;
    }

    if (startTime >= endTime) {
      showError("Godzina zakończenia musi być późniejsza niż godzina rozpoczęcia.");
      return false;
    }

    if (availabilityStartTime >= availabilityEndTime) {
      showError("Koniec dyspozycyjności musi być późniejszy niż jej początek.");
      return false;
    }

    if (
      startTime < availabilityStartTime ||
      endTime > availabilityEndTime
    ) {
      showError("Godziny pracy muszą mieścić się w zadeklarowanej dyspozycyjności.");
      return false;
    }

    return true;
  };

  const validateRange = (): boolean => {
    if (!dateTo) {
      showError("Wybierz datę końcową zakresu.");
      return false;
    }

    if (dateTo < date) {
      showError("Data końcowa nie może być wcześniejsza od daty początkowej.");
      return false;
    }

    if (selectedWeekdays.length === 0) {
      showError("Wybierz co najmniej jeden dzień tygodnia.");
      return false;
    }

    return true;
  };

  const handleSave = async () => {
    if (instructorId === null || !date || !validateTimes()) {
      return;
    }

    if (applyToRange && !validateRange()) {
      return;
    }

    const singleData: InstructorScheduleCreate = {
      instructor_id: instructorId,
      date,
      start_time: startTime,
      end_time: endTime,
      availability_start_time: availabilityStartTime,
      availability_end_time: availabilityEndTime,
      status,
      note: note.trim() || undefined,
    };

    setSaving(true);

    try {
      if (entry && applyToRange) {
        const rangeData: InstructorScheduleRangeUpdate = {
          instructor_id: instructorId,
          date_from: date,
          date_to: dateTo,
          start_time: startTime,
          end_time: endTime,
          availability_start_time: availabilityStartTime,
          availability_end_time: availabilityEndTime,
          status,
          note: note.trim() || undefined,
          weekdays: selectedWeekdays,
        };

        const result = await onUpdateRange(rangeData);

        alert(
          [
            "Zaktualizowano zakres grafiku.",
            `Zaktualizowane: ${result.updated}`,
            `Pominięte: ${result.skipped}`,
          ].join("\n")
        );
      } else if (entry) {
        await onUpdate(entry.id, singleData);
      } else if (applyToRange) {
        const rangeData: InstructorScheduleRangeCreate = {
          instructor_id: instructorId,
          date_from: date,
          date_to: dateTo,
          start_time: startTime,
          end_time: endTime,
          availability_start_time: availabilityStartTime,
          availability_end_time: availabilityEndTime,
          status,
          note: note.trim() || undefined,
          weekdays: selectedWeekdays,
          skip_weekends: false,
          overwrite_existing: overwriteExisting,
        };

        const result = await onSaveRange(rangeData);

        alert(
          [
            "Zapisano zakres grafiku.",
            `Utworzone: ${result.created}`,
            `Zaktualizowane: ${result.updated}`,
            `Pominięte: ${result.skipped}`,
          ].join("\n")
        );
      } else {
        await onSave(singleData);
      }

      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się zapisać grafiku.";

      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!entry) {
      return;
    }

    const confirmed = window.confirm(
      "Czy na pewno chcesz usunąć ten wpis?"
    );

    if (!confirmed) {
      return;
    }

    setSaving(true);

    try {
      await onDelete(entry.id);
      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć wpisu.";

      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteRange = async () => {
    if (
      !entry ||
      instructorId === null ||
      !date ||
      !validateRange()
    ) {
      return;
    }

    const confirmed = window.confirm(
      [
        "Czy na pewno chcesz usunąć wpisy z wybranego zakresu?",
        `Od: ${date}`,
        `Do: ${dateTo}`,
      ].join("\n")
    );

    if (!confirmed) {
      return;
    }

    const payload: InstructorScheduleRangeDelete = {
      instructor_id: instructorId,
      date_from: date,
      date_to: dateTo,
      weekdays: selectedWeekdays,
    };

    setSaving(true);

    try {
      const result = await onDeleteRange(payload);

      alert(
        [
          "Usunięto zakres grafiku.",
          `Usunięte: ${result.deleted}`,
          `Pominięte: ${result.skipped}`,
        ].join("\n")
      );

      onClose();
    } catch (error: unknown) {
      const message =
        error instanceof Error
          ? error.message
          : "Nie udało się usunąć zakresu grafiku.";

      showError(message);
    } finally {
      setSaving(false);
    }
  };

  const isWork = status === "WORK";

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="md"
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 800 }}>
        {entry ? "Edytuj wpis w grafiku" : "Dodaj wpis do grafiku"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {formError && (
            <Alert severity="error" onClose={() => setFormError("")}>
              {formError}
            </Alert>
          )}
          <TextField
            label="Data początkowa"
            value={date}
            disabled
            fullWidth
          />

          <TextField
            select
            label="Status"
            value={status}
            onChange={(event) => setStatus(event.target.value)}
            fullWidth
          >
            <MenuItem value="WORK">Praca</MenuItem>
            <MenuItem value="OFF">Wolne</MenuItem>
            <MenuItem value="VACATION">Urlop</MenuItem>
            <MenuItem value="SICK">Chorobowe</MenuItem>
            <MenuItem value="TRAINING">Szkolenie</MenuItem>
          </TextField>

          <TextField
            label="Dyspozycyjność od"
            type="time"
            value={availabilityStartTime}
            onChange={(event) =>
              setAvailabilityStartTime(event.target.value)
            }
            disabled={!isWork}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            fullWidth
          />

          <TextField
            label="Dyspozycyjność do"
            type="time"
            value={availabilityEndTime}
            onChange={(event) =>
              setAvailabilityEndTime(event.target.value)
            }
            disabled={!isWork}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            fullWidth
          />

          <TextField
            label="Godzina rozpoczęcia pracy"
            type="time"
            value={startTime}
            onChange={(event) => setStartTime(event.target.value)}
            disabled={!isWork}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            fullWidth
          />

          <TextField
            label="Godzina zakończenia pracy"
            type="time"
            value={endTime}
            onChange={(event) => setEndTime(event.target.value)}
            disabled={!isWork}
            InputLabelProps={{ shrink: true }}
            inputProps={{ step: 300 }}
            fullWidth
          />

          <TextField
            label="Notatka"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            multiline
            minRows={3}
            fullWidth
          />

          <Divider />

          <FormControlLabel
            control={
              <Checkbox
                checked={applyToRange}
                onChange={(event) =>
                  setApplyToRange(event.target.checked)
                }
              />
            }
            label={
              entry
                ? "Edytuj także kolejne dni"
                : "Zastosuj także na kolejne dni"
            }
          />

          {applyToRange && (
            <Stack spacing={1.5}>
              <TextField
                label="Do dnia"
                type="date"
                value={dateTo}
                onChange={(event) =>
                  setDateTo(event.target.value)
                }
                InputLabelProps={{ shrink: true }}
                inputProps={{ min: date }}
                fullWidth
              />

              <Stack spacing={1}>
                <Typography variant="body2" fontWeight={700}>
                  Dni tygodnia
                </Typography>

                <ToggleButtonGroup
                  value={selectedWeekdays}
                  onChange={(_, values: number[]) =>
                    setSelectedWeekdays(values)
                  }
                  size="small"
                  fullWidth
                >
                  {weekdayOptions.map((day) => (
                    <ToggleButton
                      key={day.value}
                      value={day.value}
                      sx={{
                        textTransform: "none",
                        minWidth: 0,
                      }}
                    >
                      {day.label}
                    </ToggleButton>
                  ))}
                </ToggleButtonGroup>
              </Stack>

              {!entry && (
                <FormControlLabel
                  control={
                    <Checkbox
                      checked={overwriteExisting}
                      onChange={(event) =>
                        setOverwriteExisting(
                          event.target.checked
                        )
                      }
                    />
                  }
                  label="Nadpisz istniejące wpisy"
                />
              )}
            </Stack>
          )}
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        {entry && !applyToRange && (
          <Button
            color="error"
            onClick={handleDelete}
            disabled={saving}
            sx={{ mr: "auto" }}
          >
            Usuń
          </Button>
        )}

        {entry && applyToRange && (
          <Button
            color="error"
            onClick={handleDeleteRange}
            disabled={saving}
            sx={{ mr: "auto" }}
          >
            Usuń zakres
          </Button>
        )}

        <Button onClick={onClose} disabled={saving}>
          Anuluj
        </Button>

        <Button
          onClick={handleSave}
          variant="contained"
          startIcon={saving ? <CircularProgress size={18} color="inherit" /> : undefined}
          disabled={saving || instructorId === null || !date}
        >
          {saving
            ? "Zapisywanie..."
            : entry && applyToRange
            ? "Zapisz zakres"
            : "Zapisz"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}