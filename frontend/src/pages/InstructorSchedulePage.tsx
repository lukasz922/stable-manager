import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import ArrowBackRoundedIcon from "@mui/icons-material/ArrowBackRounded";
import ArrowForwardRoundedIcon from "@mui/icons-material/ArrowForwardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ContentCopyRoundedIcon from "@mui/icons-material/ContentCopyRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import TodayRoundedIcon from "@mui/icons-material/TodayRounded";

import { useInstructorSchedule } from "../hooks/useInstructorSchedule";
import { getInstructors } from "../api/instructors";
import type { Instructor } from "../api/instructors";
import type { InstructorSchedule } from "../api/instructorSchedule";
import { InstructorScheduleTable } from "../components/instructorSchedule/InstructorScheduleTable";
import { InstructorScheduleDialog } from "../components/instructorSchedule/InstructorScheduleDialog";

const monthNames = [
  "Styczeń", "Luty", "Marzec", "Kwiecień", "Maj", "Czerwiec",
  "Lipiec", "Sierpień", "Wrzesień", "Październik", "Listopad", "Grudzień",
];

const statusLabels: Record<string, string> = {
  WORK: "Praca",
  OFF: "Wolne",
  VACATION: "Urlop",
  SICK: "Chorobowe",
  TRAINING: "Szkolenie",
};

export function InstructorSchedulePage() {
  const today = new Date();
  const [year, setYear] = useState(today.getFullYear());
  const [month, setMonth] = useState(today.getMonth() + 1);
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [copyOpen, setCopyOpen] = useState(false);
  const [copying, setCopying] = useState(false);
  const [selectedInstructorId, setSelectedInstructorId] = useState<number | null>(null);
  const [selectedDate, setSelectedDate] = useState("");
  const [selectedEntry, setSelectedEntry] = useState<InstructorSchedule | null>(null);
  const [message, setMessage] = useState({
    open: false,
    text: "",
    severity: "success" as "success" | "error" | "info",
  });

  const {
    schedule, loading, save, saveRange, updateRange,
    deleteRange, update, remove, copy,
  } = useInstructorSchedule(year, month);

  const currentMonthLabel = useMemo(
    () => `${monthNames[month - 1]} ${year}`,
    [month, year],
  );

  useEffect(() => {
    getInstructors()
      .then(setInstructors)
      .catch((error: unknown) => {
        setMessage({
          open: true,
          text: error instanceof Error ? error.message : "Nie udało się pobrać instruktorów.",
          severity: "error",
        });
      });
  }, []);

  const counts = useMemo(() => {
    const result: Record<string, number> = {
      WORK: 0, OFF: 0, VACATION: 0, SICK: 0, TRAINING: 0,
    };
    schedule.forEach((item) => {
      result[item.status] = (result[item.status] ?? 0) + 1;
    });
    return result;
  }, [schedule]);

  function changeMonth(offset: number) {
    const target = new Date(year, month - 1 + offset, 1);
    setYear(target.getFullYear());
    setMonth(target.getMonth() + 1);
  }

  function goToToday() {
    const now = new Date();
    setYear(now.getFullYear());
    setMonth(now.getMonth() + 1);
  }

  async function handleCopyPreviousMonth() {
    const sourceYear = month === 1 ? year - 1 : year;
    const sourceMonth = month === 1 ? 12 : month - 1;

    try {
      setCopying(true);
      await copy(sourceYear, sourceMonth, year, month);
      setCopyOpen(false);
      setMessage({
        open: true,
        text: "Grafik z poprzedniego miesiąca został skopiowany.",
        severity: "success",
      });
    } catch (error: unknown) {
      setMessage({
        open: true,
        text: error instanceof Error ? error.message : "Nie udało się skopiować grafiku.",
        severity: "error",
      });
    } finally {
      setCopying(false);
    }
  }

  function handleCellClick(instructorId: number, date: string) {
    const entry =
      schedule.find(
        (item) =>
          item.instructor_id === instructorId &&
          item.date.startsWith(date),
      ) ?? null;

    setSelectedEntry(entry);
    setSelectedInstructorId(instructorId);
    setSelectedDate(date);
    setDialogOpen(true);
  }

  function handleCloseDialog() {
    setDialogOpen(false);
    setSelectedEntry(null);
    setSelectedInstructorId(null);
    setSelectedDate("");
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Grafik instruktorów
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Ustalaj godziny pracy, dyspozycyjność, urlopy i dni wolne.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<ContentCopyRoundedIcon />}
          onClick={() => setCopyOpen(true)}
          sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
        >
          Kopiuj poprzedni miesiąc
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          mb: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
        }}
      >
        <Stack
          direction={{ xs: "column", sm: "row" }}
          alignItems="center"
          justifyContent="space-between"
          spacing={2}
        >
          <Stack direction="row" spacing={1}>
            <Button
              variant="outlined"
              startIcon={<ArrowBackRoundedIcon />}
              onClick={() => changeMonth(-1)}
            >
              Poprzedni
            </Button>
            <Button
              variant="outlined"
              startIcon={<TodayRoundedIcon />}
              onClick={goToToday}
            >
              Dzisiaj
            </Button>
          </Stack>

          <Stack direction="row" spacing={1} alignItems="center">
            <CalendarMonthRoundedIcon color="primary" />
            <Typography variant="h5" fontWeight={800} textAlign="center">
              {currentMonthLabel}
            </Typography>
          </Stack>

          <Button
            variant="outlined"
            endIcon={<ArrowForwardRoundedIcon />}
            onClick={() => changeMonth(1)}
          >
            Następny
          </Button>
        </Stack>
      </Paper>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "repeat(2, 1fr)", md: "repeat(4, 1fr)" },
          gap: 2,
          mb: 2,
        }}
      >
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <EventAvailableRoundedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">Wpisy w miesiącu</Typography>
                <Typography variant="h4" fontWeight={800}>{schedule.length}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
          <CardContent>
            <Stack direction="row" spacing={1.5} alignItems="center">
              <GroupsRoundedIcon color="primary" />
              <Box>
                <Typography variant="body2" color="text.secondary">Instruktorzy</Typography>
                <Typography variant="h4" fontWeight={800}>{instructors.length}</Typography>
              </Box>
            </Stack>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Dni pracy</Typography>
            <Typography variant="h4" fontWeight={800}>{counts.WORK}</Typography>
          </CardContent>
        </Card>
        <Card elevation={0} sx={{ border: "1px solid", borderColor: "divider", borderRadius: 4 }}>
          <CardContent>
            <Typography variant="body2" color="text.secondary">Nieobecności</Typography>
            <Typography variant="h4" fontWeight={800}>
              {counts.OFF + counts.VACATION + counts.SICK}
            </Typography>
          </CardContent>
        </Card>
      </Box>

      <Paper
        elevation={0}
        sx={{
          p: 2,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
        }}
      >
        <Stack direction="row" gap={1} flexWrap="wrap" sx={{ mb: 2 }}>
          {Object.entries(statusLabels).map(([key, label]) => (
            <Chip
              key={key}
              label={`${label}: ${counts[key] ?? 0}`}
              variant="outlined"
              size="small"
            />
          ))}
        </Stack>

        {loading ? (
          <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
            <CircularProgress />
          </Box>
        ) : instructors.length === 0 ? (
          <Alert severity="info">Brak instruktorów do wyświetlenia.</Alert>
        ) : (
          <InstructorScheduleTable
            instructors={instructors}
            schedule={schedule}
            year={year}
            month={month}
            onCellClick={handleCellClick}
          />
        )}
      </Paper>

      <InstructorScheduleDialog
        open={dialogOpen}
        entry={selectedEntry}
        instructorId={selectedInstructorId}
        date={selectedDate}
        onClose={handleCloseDialog}
        onSave={save}
        onSaveRange={saveRange}
        onUpdateRange={updateRange}
        onDeleteRange={deleteRange}
        onUpdate={update}
        onDelete={remove}
      />

      <Dialog open={copyOpen} onClose={() => !copying && setCopyOpen(false)} fullWidth maxWidth="xs">
        <DialogTitle>Kopiowanie grafiku</DialogTitle>
        <DialogContent>
          <Alert severity="info" sx={{ mt: 1 }}>
            Grafik z poprzedniego miesiąca zostanie skopiowany do {currentMonthLabel}.
            Istniejące wpisy nie powinny zostać usunięte.
          </Alert>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setCopyOpen(false)} disabled={copying}>Anuluj</Button>
          <Button
            variant="contained"
            onClick={() => void handleCopyPreviousMonth()}
            disabled={copying}
          >
            {copying ? "Kopiowanie..." : "Kopiuj"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={message.open}
        autoHideDuration={5000}
        onClose={() => setMessage((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={message.severity}
          variant="filled"
          onClose={() => setMessage((current) => ({ ...current, open: false }))}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}