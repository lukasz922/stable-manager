import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  FormControlLabel,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import CloseRoundedIcon from "@mui/icons-material/CloseRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import {
  approveAvailabilityRequest,
  createAvailabilityRequest,
  deleteAvailabilityRequest,
  getAvailabilityRequests,
  rejectAvailabilityRequest,
  type InstructorAvailabilityRequest,
  type InstructorAvailabilityRequestPayload,
} from "../api/instructorAvailabilityRequests";
import {
  getInstructors,
  type Instructor,
} from "../api/instructors";

type RequestFilter =
  | "ALL"
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

type DecisionMode = "approve" | "reject";

type MessageState = {
  open: boolean;
  text: string;
  severity: "success" | "error" | "info";
};

const weekdays = [
  { value: 0, label: "Pon" },
  { value: 1, label: "Wt" },
  { value: 2, label: "Śr" },
  { value: 3, label: "Czw" },
  { value: 4, label: "Pt" },
  { value: 5, label: "Sob" },
  { value: 6, label: "Nd" },
];

const initialForm: InstructorAvailabilityRequestPayload = {
  instructor_id: 0,
  date_from: "",
  date_to: "",
  weekdays: [0, 1, 2, 3, 4],
  availability_start_time: "08:00",
  availability_end_time: "16:00",
  note: "",
};

function statusInfo(status: string) {
  if (status === "APPROVED") {
    return {
      label: "Zatwierdzone",
      color: "success" as const,
    };
  }

  if (status === "REJECTED") {
    return {
      label: "Odrzucone",
      color: "error" as const,
    };
  }

  return {
    label: "Oczekujące",
    color: "warning" as const,
  };
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "pl-PL",
  );
}

function formatTime(value: string) {
  return value.slice(0, 5);
}

function formatWeekdays(days: number[] | null) {
  if (!days?.length) {
    return "Wszystkie dni";
  }

  return days
    .map(
      (day) =>
        weekdays.find((item) => item.value === day)?.label,
    )
    .filter(Boolean)
    .join(", ");
}

function fullName(instructor?: Instructor) {
  if (!instructor) {
    return "Nieznany instruktor";
  }

  return `${instructor.first_name} ${instructor.last_name}`.trim();
}

function initials(instructor?: Instructor) {
  if (!instructor) {
    return "?";
  }

  return `${instructor.first_name?.[0] ?? ""}${instructor.last_name?.[0] ?? ""}`
    .toUpperCase();
}

export function InstructorAvailabilityRequestsPage() {
  const [requests, setRequests] = useState<
    InstructorAvailabilityRequest[]
  >([]);
  const [instructors, setInstructors] = useState<Instructor[]>(
    [],
  );
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] =
    useState<RequestFilter>("ALL");

  const [formOpen, setFormOpen] = useState(false);
  const [form, setForm] =
    useState<InstructorAvailabilityRequestPayload>(
      initialForm,
    );

  const [decisionOpen, setDecisionOpen] =
    useState(false);
  const [decisionMode, setDecisionMode] =
    useState<DecisionMode>("approve");
  const [decisionRequest, setDecisionRequest] =
    useState<InstructorAvailabilityRequest | null>(null);
  const [decisionNote, setDecisionNote] = useState("");

  const [message, setMessage] = useState<MessageState>({
    open: false,
    text: "",
    severity: "info",
  });

  const instructorsById = useMemo(
    () =>
      new Map(
        instructors.map((instructor) => [
          instructor.id,
          instructor,
        ]),
      ),
    [instructors],
  );

  async function loadData() {
    try {
      setLoading(true);

      const [requestData, instructorData] =
        await Promise.all([
          getAvailabilityRequests(),
          getInstructors(),
        ]);

      setRequests(requestData);
      setInstructors(instructorData);
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać danych dyspozycyjności.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredRequests = useMemo(() => {
    const phrase = search.trim().toLowerCase();

    return requests.filter((request) => {
      const instructor = instructorsById.get(
        request.instructor_id,
      );

      const matchesFilter =
        filter === "ALL" || request.status === filter;

      const matchesSearch =
        !phrase ||
        fullName(instructor)
          .toLowerCase()
          .includes(phrase) ||
        (request.note ?? "")
          .toLowerCase()
          .includes(phrase) ||
        (request.admin_note ?? "")
          .toLowerCase()
          .includes(phrase);

      return matchesFilter && matchesSearch;
    });
  }, [requests, instructorsById, search, filter]);

  const counts = {
    ALL: requests.length,
    PENDING: requests.filter(
      (request) => request.status === "PENDING",
    ).length,
    APPROVED: requests.filter(
      (request) => request.status === "APPROVED",
    ).length,
    REJECTED: requests.filter(
      (request) => request.status === "REJECTED",
    ).length,
  };

  function toggleWeekday(day: number) {
    const selected = form.weekdays ?? [];

    setForm((current) => ({
      ...current,
      weekdays: selected.includes(day)
        ? selected.filter((item) => item !== day)
        : [...selected, day].sort(),
    }));
  }

  function openCreateDialog() {
    setForm(initialForm);
    setFormOpen(true);
  }

  async function createRequest() {
    if (!form.instructor_id) {
      setMessage({
        open: true,
        text: "Wybierz instruktora.",
        severity: "error",
      });
      return;
    }

    if (
      !form.date_from ||
      !form.date_to ||
      form.date_to < form.date_from
    ) {
      setMessage({
        open: true,
        text: "Sprawdź zakres dat.",
        severity: "error",
      });
      return;
    }

    if (
      !form.availability_start_time ||
      !form.availability_end_time ||
      form.availability_end_time <=
        form.availability_start_time
    ) {
      setMessage({
        open: true,
        text:
          "Godzina zakończenia musi być późniejsza niż rozpoczęcia.",
        severity: "error",
      });
      return;
    }

    if (!form.weekdays?.length) {
      setMessage({
        open: true,
        text: "Wybierz co najmniej jeden dzień tygodnia.",
        severity: "error",
      });
      return;
    }

    try {
      setSaving(true);

      await createAvailabilityRequest({
        ...form,
        availability_start_time:
          form.availability_start_time.length === 5
            ? `${form.availability_start_time}:00`
            : form.availability_start_time,
        availability_end_time:
          form.availability_end_time.length === 5
            ? `${form.availability_end_time}:00`
            : form.availability_end_time,
        note: form.note?.trim() || null,
      });

      setFormOpen(false);
      setForm(initialForm);
      await loadData();

      setMessage({
        open: true,
        text: "Zgłoszenie dyspozycyjności zostało dodane.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się utworzyć zgłoszenia.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function openDecisionDialog(
    request: InstructorAvailabilityRequest,
    mode: DecisionMode,
  ) {
    setDecisionRequest(request);
    setDecisionMode(mode);
    setDecisionNote(
      mode === "approve"
        ? "Zatwierdzone"
        : "Odrzucone przez administratora",
    );
    setDecisionOpen(true);
  }

  async function saveDecision() {
    if (!decisionRequest) {
      return;
    }

    try {
      setSaving(true);

      if (decisionMode === "approve") {
        const result = await approveAvailabilityRequest(
          decisionRequest.id,
          decisionNote.trim() || null,
        );

        setMessage({
          open: true,
          text:
            `Zatwierdzono zgłoszenie. Utworzono: ${result.created}, ` +
            `zaktualizowano: ${result.updated}, pominięto: ${result.skipped}.`,
          severity: "success",
        });
      } else {
        await rejectAvailabilityRequest(
          decisionRequest.id,
          decisionNote.trim() || null,
        );

        setMessage({
          open: true,
          text: "Zgłoszenie zostało odrzucone.",
          severity: "success",
        });
      }

      setDecisionOpen(false);
      setDecisionRequest(null);
      setDecisionNote("");
      await loadData();
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać decyzji.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeRequest(
    request: InstructorAvailabilityRequest,
  ) {
    const confirmed = window.confirm(
      "Usunąć oczekujące zgłoszenie?",
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteAvailabilityRequest(request.id);
      await loadData();

      setMessage({
        open: true,
        text: "Zgłoszenie zostało usunięte.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się usunąć zgłoszenia.",
        severity: "error",
      });
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
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
            Dyspozycyjność instruktorów
          </Typography>

          <Typography
            color="text.secondary"
            sx={{ mt: 0.75 }}
          >
            Zgłoszenia dostępności, akceptacja i automatyczne
            tworzenie grafiku.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={openCreateDialog}
          sx={{
            borderRadius: 2.5,
            textTransform: "none",
            fontWeight: 800,
          }}
        >
          Dodaj zgłoszenie
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {([
          ["ALL", "Wszystkie"],
          ["PENDING", "Oczekujące"],
          ["APPROVED", "Zatwierdzone"],
          ["REJECTED", "Odrzucone"],
        ] as const).map(([key, label]) => (
          <Card
            key={key}
            elevation={0}
            onClick={() => setFilter(key)}
            sx={{
              cursor: "pointer",
              border: "1px solid",
              borderColor:
                filter === key
                  ? "primary.main"
                  : "divider",
              borderRadius: 4,
            }}
          >
            <CardContent
              sx={{
                p: 2.25,
                "&:last-child": { pb: 2.25 },
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
              >
                {label}
              </Typography>

              <Typography variant="h3" fontWeight={800}>
                {counts[key]}
              </Typography>
            </CardContent>
          </Card>
        ))}
      </Box>

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
        <TextField
          fullWidth
          placeholder="Szukaj instruktora lub treści notatki"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonSearchRoundedIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Wyświetlono {filteredRequests.length} z{" "}
        {requests.length} zgłoszeń
      </Typography>

      {filteredRequests.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 2,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
          }}
        >
          <EventAvailableRoundedIcon
            sx={{
              fontSize: 56,
              color: "text.disabled",
              mb: 1,
            }}
          />

          <Typography fontWeight={800}>
            Brak zgłoszeń
          </Typography>

          <Typography color="text.secondary">
            Zmień filtr lub dodaj nowe zgłoszenie.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              lg: "repeat(2, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {filteredRequests.map((request) => {
            const instructor = instructorsById.get(
              request.instructor_id,
            );
            const status = statusInfo(request.status);

            return (
              <Card
                key={request.id}
                elevation={0}
                sx={{
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 4,
                }}
              >
                <CardContent
                  sx={{
                    p: 2.5,
                    "&:last-child": { pb: 2.5 },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Avatar
                        sx={{
                          width: 48,
                          height: 48,
                          fontWeight: 800,
                        }}
                      >
                        {initials(instructor)}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          noWrap
                        >
                          {fullName(instructor)}
                        </Typography>

                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Zgłoszenie #{request.id}
                        </Typography>
                      </Box>
                    </Stack>

                    <Chip
                      size="small"
                      label={status.label}
                      color={status.color}
                    />
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1.25}>
                      <CalendarMonthRoundedIcon
                        fontSize="small"
                        color="action"
                      />

                      <Typography variant="body2">
                        {formatDate(request.date_from)} –{" "}
                        {formatDate(request.date_to)}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <ScheduleRoundedIcon
                        fontSize="small"
                        color="action"
                      />

                      <Typography variant="body2">
                        {formatTime(
                          request.availability_start_time,
                        )}{" "}
                        –{" "}
                        {formatTime(
                          request.availability_end_time,
                        )}
                      </Typography>
                    </Stack>

                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      Dni: {formatWeekdays(request.weekdays)}
                    </Typography>

                    {(request.note ||
                      request.admin_note) && (
                      <Paper
                        elevation={0}
                        sx={{
                          p: 1.5,
                          bgcolor: "action.hover",
                          borderRadius: 2.5,
                        }}
                      >
                        {request.note && (
                          <Typography variant="body2">
                            {request.note}
                          </Typography>
                        )}

                        {request.admin_note && (
                          <Typography
                            variant="caption"
                            color="text.secondary"
                            sx={{ display: "block", mt: 0.5 }}
                          >
                            Administrator:{" "}
                            {request.admin_note}
                          </Typography>
                        )}
                      </Paper>
                    )}
                  </Stack>

                  {request.status === "PENDING" && (
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      spacing={1}
                      sx={{ mt: 2.5 }}
                    >
                      <Button
                        fullWidth
                        variant="contained"
                        color="success"
                        startIcon={
                          <CheckCircleRoundedIcon />
                        }
                        onClick={() =>
                          openDecisionDialog(
                            request,
                            "approve",
                          )
                        }
                      >
                        Zatwierdź
                      </Button>

                      <Button
                        fullWidth
                        variant="outlined"
                        color="error"
                        startIcon={<CloseRoundedIcon />}
                        onClick={() =>
                          openDecisionDialog(
                            request,
                            "reject",
                          )
                        }
                      >
                        Odrzuć
                      </Button>

                      <Button
                        variant="text"
                        color="inherit"
                        startIcon={
                          <DeleteOutlineRoundedIcon />
                        }
                        onClick={() =>
                          void removeRequest(request)
                        }
                      >
                        Usuń
                      </Button>
                    </Stack>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Nowe zgłoszenie dyspozycyjności
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              mt: 1,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <FormControl
              fullWidth
              sx={{
                gridColumn: { md: "1 / -1" },
              }}
            >
              <InputLabel>Instruktor</InputLabel>
              <Select
                label="Instruktor"
                value={form.instructor_id || ""}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    instructor_id: Number(
                      event.target.value,
                    ),
                  }))
                }
              >
                {instructors.map((instructor) => (
                  <MenuItem
                    key={instructor.id}
                    value={instructor.id}
                  >
                    {fullName(instructor)}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <TextField
              label="Data od"
              type="date"
              value={form.date_from}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  date_from: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Data do"
              type="date"
              value={form.date_to}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  date_to: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Dostępny od"
              type="time"
              value={form.availability_start_time}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  availability_start_time:
                    event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <TextField
              label="Dostępny do"
              type="time"
              value={form.availability_end_time}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  availability_end_time:
                    event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
            />

            <Box sx={{ gridColumn: { md: "1 / -1" } }}>
              <Typography fontWeight={800} sx={{ mb: 1 }}>
                Dni tygodnia
              </Typography>

              <Stack
                direction="row"
                flexWrap="wrap"
                gap={0.5}
              >
                {weekdays.map((day) => (
                  <FormControlLabel
                    key={day.value}
                    control={
                      <Checkbox
                        checked={(
                          form.weekdays ?? []
                        ).includes(day.value)}
                        onChange={() =>
                          toggleWeekday(day.value)
                        }
                      />
                    }
                    label={day.label}
                  />
                ))}
              </Stack>
            </Box>

            <TextField
              label="Notatka"
              value={form.note ?? ""}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  note: event.target.value,
                }))
              }
              multiline
              minRows={3}
              sx={{ gridColumn: { md: "1 / -1" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setFormOpen(false)}
            disabled={saving}
          >
            Anuluj
          </Button>

          <Button
            variant="contained"
            onClick={() => void createRequest()}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <EventAvailableRoundedIcon />
              )
            }
          >
            Zapisz zgłoszenie
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={decisionOpen}
        onClose={() =>
          !saving && setDecisionOpen(false)
        }
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {decisionMode === "approve"
            ? "Zatwierdź zgłoszenie"
            : "Odrzuć zgłoszenie"}
        </DialogTitle>

        <DialogContent>
          {decisionRequest && (
            <Alert
              severity={
                decisionMode === "approve"
                  ? "success"
                  : "warning"
              }
              sx={{ mb: 2, mt: 1 }}
            >
              {fullName(
                instructorsById.get(
                  decisionRequest.instructor_id,
                ),
              )}
              : {formatDate(decisionRequest.date_from)} –{" "}
              {formatDate(decisionRequest.date_to)}
            </Alert>
          )}

          <TextField
            fullWidth
            label={
              decisionMode === "approve"
                ? "Notatka administratora"
                : "Powód odrzucenia"
            }
            value={decisionNote}
            onChange={(event) =>
              setDecisionNote(event.target.value)
            }
            multiline
            minRows={3}
          />
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setDecisionOpen(false)}
            disabled={saving}
          >
            Anuluj
          </Button>

          <Button
            variant="contained"
            color={
              decisionMode === "approve"
                ? "success"
                : "error"
            }
            onClick={() => void saveDecision()}
            disabled={saving}
          >
            {decisionMode === "approve"
              ? "Zatwierdź"
              : "Odrzuć"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={message.open}
        autoHideDuration={5000}
        onClose={() =>
          setMessage((current) => ({
            ...current,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={message.severity}
          variant="filled"
          onClose={() =>
            setMessage((current) => ({
              ...current,
              open: false,
            }))
          }
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}