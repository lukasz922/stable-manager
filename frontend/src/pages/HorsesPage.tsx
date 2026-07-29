import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
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
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HeightRoundedIcon from "@mui/icons-material/HeightRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import ScaleRoundedIcon from "@mui/icons-material/ScaleRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

import {
  createHorse,
  deleteHorse,
  getHorses,
  updateHorse,
  type Horse,
  type HorseCreate,
} from "../api/horses";

type HorseForm = {
  name: string;
  breed: string;
  gender: string;
  color: string;
  height_cm: string;
  max_rider_weight: string;
  max_lessons_per_day: string;
  status: string;
  notes: string;
};

type StatusFilter =
  | "all"
  | "available"
  | "resting"
  | "unavailable";

type MessageState = {
  open: boolean;
  text: string;
  severity: "success" | "error";
};

const emptyForm: HorseForm = {
  name: "",
  breed: "",
  gender: "",
  color: "",
  height_cm: "",
  max_rider_weight: "",
  max_lessons_per_day: "5",
  status: "available",
  notes: "",
};

const statusMap = {
  available: {
    label: "Dostępny",
    color: "success" as const,
  },
  resting: {
    label: "Odpoczywa",
    color: "warning" as const,
  },
  unavailable: {
    label: "Niedostępny",
    color: "error" as const,
  },
};

function statusInfo(status: string) {
  return (
    statusMap[status as keyof typeof statusMap] ??
    statusMap.unavailable
  );
}

function toPayload(form: HorseForm): HorseCreate {
  return {
    name: form.name.trim(),
    breed: form.breed.trim() || undefined,
    gender: form.gender || undefined,
    color: form.color.trim() || undefined,
    height_cm: form.height_cm
      ? Number(form.height_cm)
      : undefined,
    max_rider_weight: form.max_rider_weight
      ? Number(form.max_rider_weight)
      : undefined,
    max_lessons_per_day:
      Number(form.max_lessons_per_day) || 5,
    status: form.status,
    notes: form.notes.trim() || undefined,
  };
}

export function HorsesPage() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingHorse, setEditingHorse] =
    useState<Horse | null>(null);
  const [form, setForm] = useState<HorseForm>(emptyForm);

  const [menuAnchor, setMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [menuHorse, setMenuHorse] =
    useState<Horse | null>(null);

  const [message, setMessage] = useState<MessageState>({
    open: false,
    text: "",
    severity: "success",
  });

  async function loadHorses() {
    try {
      setLoading(true);
      const data = await getHorses();
      setHorses(data);
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać listy koni.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadHorses();
  }, []);

  const filteredHorses = useMemo(() => {
    const phrase = search.trim().toLowerCase();

    return horses.filter((horse) => {
      const matchesStatus =
        statusFilter === "all" ||
        horse.status === statusFilter;

      const matchesSearch =
        !phrase ||
        [
          horse.name,
          horse.code,
          horse.breed,
          horse.gender,
          horse.color,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(phrase),
          );

      return matchesStatus && matchesSearch;
    });
  }, [horses, search, statusFilter]);

  const availableCount = horses.filter(
    (horse) => horse.status === "available",
  ).length;
  const restingCount = horses.filter(
    (horse) => horse.status === "resting",
  ).length;
  const unavailableCount = horses.filter(
    (horse) => horse.status === "unavailable",
  ).length;

  function openCreateDialog() {
    setEditingHorse(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditDialog(horse: Horse) {
    setEditingHorse(horse);
    setForm({
      name: horse.name ?? "",
      breed: horse.breed ?? "",
      gender: horse.gender ?? "",
      color: horse.color ?? "",
      height_cm: horse.height_cm
        ? String(horse.height_cm)
        : "",
      max_rider_weight: horse.max_rider_weight
        ? String(horse.max_rider_weight)
        : "",
      max_lessons_per_day: String(
        horse.max_lessons_per_day ?? 5,
      ),
      status: horse.status ?? "available",
      notes: horse.notes ?? "",
    });
    setFormOpen(true);
    closeMenu();
  }

  function openMenu(
    event: React.MouseEvent<HTMLElement>,
    horse: Horse,
  ) {
    setMenuAnchor(event.currentTarget);
    setMenuHorse(horse);
  }

  function closeMenu() {
    setMenuAnchor(null);
    setMenuHorse(null);
  }

  async function saveHorse() {
    if (!form.name.trim()) {
      setMessage({
        open: true,
        text: "Imię konia jest wymagane.",
        severity: "error",
      });
      return;
    }

    if (Number(form.max_lessons_per_day) < 1) {
      setMessage({
        open: true,
        text: "Limit jazd dziennie musi wynosić co najmniej 1.",
        severity: "error",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = toPayload(form);

      if (editingHorse) {
        await updateHorse(editingHorse.id, payload);
      } else {
        await createHorse(payload);
      }

      setFormOpen(false);
      setEditingHorse(null);
      setForm(emptyForm);
      await loadHorses();

      setMessage({
        open: true,
        text: editingHorse
          ? "Dane konia zostały zapisane."
          : "Koń został dodany.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać konia.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function removeHorse(horse: Horse) {
    closeMenu();

    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć konia „${horse.name}”?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await deleteHorse(horse.id);
      await loadHorses();

      setMessage({
        open: true,
        text: "Koń został usunięty.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się usunąć konia.",
        severity: "error",
      });
    }
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
            Konie
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.75 }}
          >
            Dostępność, limity pracy i podstawowe dane koni.
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
          Dodaj konia
        </Button>
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            label: "Wszystkie",
            value: horses.length,
            filter: "all" as const,
          },
          {
            label: "Dostępne",
            value: availableCount,
            filter: "available" as const,
          },
          {
            label: "Odpoczywają",
            value: restingCount,
            filter: "resting" as const,
          },
          {
            label: "Niedostępne",
            value: unavailableCount,
            filter: "unavailable" as const,
          },
        ].map((item) => (
          <Card
            key={item.filter}
            elevation={0}
            onClick={() => setStatusFilter(item.filter)}
            sx={{
              cursor: "pointer",
              border: "1px solid",
              borderColor:
                statusFilter === item.filter
                  ? "primary.main"
                  : "divider",
              borderRadius: 4,
              transition:
                "transform 180ms ease, box-shadow 180ms ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow:
                  "0 12px 28px rgba(15,23,42,0.07)",
              },
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                "&:last-child": { pb: 2.5 },
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
              >
                {item.label}
              </Typography>
              <Typography variant="h3" fontWeight={800}>
                {item.value}
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
          placeholder="Szukaj po imieniu, kodzie, rasie lub maści"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon color="action" />
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
        Wyświetlono {filteredHorses.length} z {horses.length} koni
      </Typography>

      {loading ? (
        <Box
          sx={{
            py: 8,
            display: "grid",
            placeItems: "center",
          }}
        >
          <CircularProgress />
        </Box>
      ) : filteredHorses.length === 0 ? (
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
          <PetsRoundedIcon
            sx={{
              fontSize: 56,
              color: "text.disabled",
              mb: 1,
            }}
          />
          <Typography fontWeight={800}>
            Nie znaleziono koni
          </Typography>
          <Typography color="text.secondary">
            Zmień wyszukiwane hasło lub wybrany status.
          </Typography>
        </Paper>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {filteredHorses.map((horse) => {
            const status = statusInfo(horse.status);

            return (
              <Card
                key={horse.id}
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 4,
                  transition:
                    "transform 180ms ease, box-shadow 180ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow:
                      "0 14px 30px rgba(15,23,42,0.07)",
                  },
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
                          width: 50,
                          height: 50,
                          bgcolor: "primary.main",
                        }}
                      >
                        <PetsRoundedIcon />
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          noWrap
                        >
                          {horse.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {horse.code || "Kod zostanie nadany"}
                        </Typography>
                      </Box>
                    </Stack>

                    <Tooltip title="Więcej akcji">
                      <IconButton
                        onClick={(event) =>
                          openMenu(event, horse)
                        }
                      >
                        <MoreVertRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 2 }}
                  >
                    <Chip
                      label={status.label}
                      color={status.color}
                      size="small"
                    />
                    {horse.breed && (
                      <Chip
                        label={horse.breed}
                        variant="outlined"
                        size="small"
                      />
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1.25}>
                      <ScheduleRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography variant="body2">
                        Maks. {horse.max_lessons_per_day} jazd dziennie
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <HeightRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography
                        variant="body2"
                        color={
                          horse.height_cm
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        {horse.height_cm
                          ? `${horse.height_cm} cm`
                          : "Brak danych o wysokości"}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <ScaleRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography
                        variant="body2"
                        color={
                          horse.max_rider_weight
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        {horse.max_rider_weight
                          ? `Jeździec do ${horse.max_rider_weight} kg`
                          : "Brak limitu wagi"}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => openEditDialog(horse)}
                    sx={{ mt: 2.5 }}
                  >
                    Edytuj
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() => {
            if (menuHorse) {
              openEditDialog(menuHorse);
            }
          }}
        >
          <EditRoundedIcon
            fontSize="small"
            sx={{ mr: 1.5 }}
          />
          Edytuj konia
        </MenuItem>

        <Divider />

        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            if (menuHorse) {
              void removeHorse(menuHorse);
            }
          }}
        >
          <DeleteOutlineRoundedIcon
            fontSize="small"
            sx={{ mr: 1.5 }}
          />
          Usuń konia
        </MenuItem>
      </Menu>

      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingHorse ? "Edytuj konia" : "Dodaj konia"}
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
            <TextField
              label="Imię"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
              autoFocus
            />

            <TextField
              label="Rasa"
              value={form.breed}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  breed: event.target.value,
                }))
              }
            />

            <FormControl>
              <InputLabel>Płeć</InputLabel>
              <Select
                label="Płeć"
                value={form.gender}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    gender: event.target.value,
                  }))
                }
              >
                <MenuItem value="">Brak</MenuItem>
                <MenuItem value="Klacz">Klacz</MenuItem>
                <MenuItem value="Wałach">Wałach</MenuItem>
                <MenuItem value="Ogier">Ogier</MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Maść"
              value={form.color}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  color: event.target.value,
                }))
              }
            />

            <TextField
              label="Wysokość"
              type="number"
              value={form.height_cm}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  height_cm: event.target.value,
                }))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    cm
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Maksymalna waga jeźdźca"
              type="number"
              value={form.max_rider_weight}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  max_rider_weight: event.target.value,
                }))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    kg
                  </InputAdornment>
                ),
              }}
            />

            <TextField
              label="Maks. jazd dziennie"
              type="number"
              value={form.max_lessons_per_day}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  max_lessons_per_day: event.target.value,
                }))
              }
              inputProps={{ min: 1 }}
            />

            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <MenuItem value="available">
                  Dostępny
                </MenuItem>
                <MenuItem value="resting">
                  Odpoczywa
                </MenuItem>
                <MenuItem value="unavailable">
                  Niedostępny
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notatki"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
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
            onClick={() => void saveHorse()}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <PetsRoundedIcon />
              )
            }
          >
            {editingHorse
              ? "Zapisz zmiany"
              : "Dodaj konia"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={message.open}
        autoHideDuration={4000}
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