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
  IconButton,
  InputAdornment,
  Menu,
  MenuItem,
  Paper,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";

import { getClients, type Client } from "../api/clients";
import {
  createPass,
  deletePass,
  getPasses,
  updatePass,
  type ClientPass,
  type ClientPassCreate,
} from "../api/passes";
import {
  getPassHistory,
  type PassHistoryItem,
} from "../api/passHistory";
import { useAuth } from "../auth/AuthContext";

type PassForm = {
  client_id: string;
  name: string;
  total_entries: string;
  remaining_entries: string;
  valid_from: string;
  valid_until: string;
  active: string;
};

type PassFilter =
  | "all"
  | "active"
  | "expired"
  | "used"
  | "inactive";

type MessageState = {
  open: boolean;
  text: string;
  severity: "success" | "error";
};

const emptyForm: PassForm = {
  client_id: "",
  name: "Karnet 10 wejść",
  total_entries: "10",
  remaining_entries: "10",
  valid_from: "",
  valid_until: "",
  active: "true",
};

function todayIso() {
  return new Date().toISOString().slice(0, 10);
}

function formatDate(value: string) {
  return new Date(`${value}T00:00:00`).toLocaleDateString(
    "pl-PL",
  );
}

function getPassStatus(passItem: ClientPass) {
  const today = todayIso();

  if (!passItem.active) {
    return {
      key: "inactive" as const,
      label: "Nieaktywny",
      color: "default" as const,
    };
  }

  if (passItem.valid_until < today) {
    return {
      key: "expired" as const,
      label: "Wygasł",
      color: "error" as const,
    };
  }

  if (passItem.remaining_entries <= 0) {
    return {
      key: "used" as const,
      label: "Wykorzystany",
      color: "warning" as const,
    };
  }

  return {
    key: "active" as const,
    label: "Aktywny",
    color: "success" as const,
  };
}

function progressPercent(passItem: ClientPass) {
  if (passItem.total_entries <= 0) return 0;

  return Math.max(
    0,
    Math.min(
      100,
      (passItem.remaining_entries /
        passItem.total_entries) *
        100,
    ),
  );
}

export function PassesPage() {
  const { hasPermission } = useAuth();
  const canManagePasses =
    hasPermission("passes.manage");

  const [passes, setPasses] = useState<ClientPass[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [passFilter, setPassFilter] =
    useState<PassFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingPass, setEditingPass] =
    useState<ClientPass | null>(null);
  const [form, setForm] = useState<PassForm>(emptyForm);

  const [menuAnchor, setMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [menuPass, setMenuPass] =
    useState<ClientPass | null>(null);

  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] =
    useState(false);
  const [history, setHistory] =
    useState<PassHistoryItem[]>([]);
  const [historyPassName, setHistoryPassName] =
    useState("");

  const [message, setMessage] = useState<MessageState>({
    open: false,
    text: "",
    severity: "success",
  });

  async function loadData() {
    try {
      setLoading(true);

      const [passesData, clientsData] =
        await Promise.all([
          getPasses(),
          getClients("active"),
        ]);

      setPasses(passesData);
      setClients(clientsData);
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać danych karnetów.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadData();
  }, []);

  const filteredPasses = useMemo(() => {
    const phrase = search.trim().toLowerCase();

    return passes.filter((passItem) => {
      const status = getPassStatus(passItem);

      const matchesFilter =
        passFilter === "all" ||
        status.key === passFilter;

      const matchesSearch =
        !phrase ||
        passItem.name.toLowerCase().includes(phrase) ||
        (passItem.client_name ?? "")
          .toLowerCase()
          .includes(phrase);

      return matchesFilter && matchesSearch;
    });
  }, [passes, search, passFilter]);

  const counts = {
    all: passes.length,
    active: passes.filter(
      (item) => getPassStatus(item).key === "active",
    ).length,
    expired: passes.filter(
      (item) => getPassStatus(item).key === "expired",
    ).length,
    used: passes.filter(
      (item) => getPassStatus(item).key === "used",
    ).length,
    inactive: passes.filter(
      (item) =>
        getPassStatus(item).key === "inactive",
    ).length,
  };

  function openCreateDialog() {
    const today = new Date();
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);

    setEditingPass(null);
    setForm({
      ...emptyForm,
      valid_from: today.toISOString().slice(0, 10),
      valid_until: validUntil
        .toISOString()
        .slice(0, 10),
    });
    setFormOpen(true);
  }

  function openEditDialog(passItem: ClientPass) {
    setEditingPass(passItem);
    setForm({
      client_id: String(passItem.client_id),
      name: passItem.name,
      total_entries: String(passItem.total_entries),
      remaining_entries: String(
        passItem.remaining_entries,
      ),
      valid_from: passItem.valid_from,
      valid_until: passItem.valid_until,
      active: String(passItem.active),
    });
    setFormOpen(true);
    closeMenu();
  }

  function openMenu(
    event: React.MouseEvent<HTMLElement>,
    passItem: ClientPass,
  ) {
    setMenuAnchor(event.currentTarget);
    setMenuPass(passItem);
  }

  function closeMenu() {
    setMenuAnchor(null);
    setMenuPass(null);
  }

  async function savePass() {
    const totalEntries = Number(form.total_entries);
    const remainingEntries = Number(
      form.remaining_entries,
    );

    if (!form.client_id) {
      setMessage({
        open: true,
        text: "Wybierz klienta.",
        severity: "error",
      });
      return;
    }

    if (!form.name.trim()) {
      setMessage({
        open: true,
        text: "Nazwa karnetu jest wymagana.",
        severity: "error",
      });
      return;
    }

    if (
      totalEntries <= 0 ||
      remainingEntries < 0 ||
      remainingEntries > totalEntries
    ) {
      setMessage({
        open: true,
        text:
          "Sprawdź liczbę wszystkich i pozostałych wejść.",
        severity: "error",
      });
      return;
    }

    if (
      !form.valid_from ||
      !form.valid_until ||
      form.valid_until < form.valid_from
    ) {
      setMessage({
        open: true,
        text: "Sprawdź daty ważności karnetu.",
        severity: "error",
      });
      return;
    }

    const payload: ClientPassCreate = {
      client_id: Number(form.client_id),
      name: form.name.trim(),
      total_entries: totalEntries,
      remaining_entries: remainingEntries,
      valid_from: form.valid_from,
      valid_until: form.valid_until,
      active: form.active === "true",
    };

    try {
      setSaving(true);

      if (editingPass) {
        await updatePass(editingPass.id, payload);
      } else {
        await createPass(payload);
      }

      setFormOpen(false);
      setEditingPass(null);
      await loadData();

      setMessage({
        open: true,
        text: editingPass
          ? "Karnet został zaktualizowany."
          : "Karnet został dodany.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać karnetu.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function openHistory(passItem: ClientPass) {
    closeMenu();
    setHistoryOpen(true);
    setHistoryLoading(true);
    setHistory([]);
    setHistoryPassName(passItem.name);

    try {
      const data = await getPassHistory(passItem.id);
      setHistory(data);
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać historii.",
        severity: "error",
      });
    } finally {
      setHistoryLoading(false);
    }
  }

  async function removePass(passItem: ClientPass) {
    closeMenu();

    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć karnet „${passItem.name}”?`,
    );

    if (!confirmed) return;

    try {
      await deletePass(passItem.id);
      await loadData();

      setMessage({
        open: true,
        text: "Karnet został usunięty.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się usunąć karnetu.",
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
            Karnety
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.75 }}
          >
            Wejścia klientów, terminy ważności i historia wykorzystania.
          </Typography>
        </Box>

        {canManagePasses && (
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
            Dodaj karnet
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(5, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {([
          ["all", "Wszystkie"],
          ["active", "Aktywne"],
          ["expired", "Wygasłe"],
          ["used", "Wykorzystane"],
          ["inactive", "Nieaktywne"],
        ] as const).map(([key, label]) => (
          <Card
            key={key}
            elevation={0}
            onClick={() => setPassFilter(key)}
            sx={{
              cursor: "pointer",
              border: "1px solid",
              borderColor:
                passFilter === key
                  ? "primary.main"
                  : "divider",
              borderRadius: 4,
            }}
          >
            <CardContent
              sx={{
                p: 2,
                "&:last-child": { pb: 2 },
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
              >
                {label}
              </Typography>
              <Typography variant="h4" fontWeight={800}>
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
          placeholder="Szukaj po nazwie karnetu lub kliencie"
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
        Wyświetlono {filteredPasses.length} z{" "}
        {passes.length} karnetów
      </Typography>

      {filteredPasses.length === 0 ? (
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
          <ConfirmationNumberRoundedIcon
            sx={{
              fontSize: 56,
              color: "text.disabled",
              mb: 1,
            }}
          />
          <Typography fontWeight={800}>
            Nie znaleziono karnetów
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
          {filteredPasses.map((passItem) => {
            const status = getPassStatus(passItem);
            const percent = progressPercent(passItem);

            return (
              <Card
                key={passItem.id}
                elevation={0}
                sx={{
                  height: "100%",
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
                    >
                      <Avatar>
                        <ConfirmationNumberRoundedIcon />
                      </Avatar>
                      <Box>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                        >
                          {passItem.name}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          Karnet #{passItem.id}
                        </Typography>
                      </Box>
                    </Stack>

                    <Tooltip title="Więcej akcji">
                      <IconButton
                        onClick={(event) =>
                          openMenu(event, passItem)
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
                      size="small"
                      label={status.label}
                      color={status.color}
                    />
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1.25}>
                      <PersonRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography variant="body2">
                        {passItem.client_name ||
                          `Klient #${passItem.client_id}`}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <CalendarMonthRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography variant="body2">
                        {formatDate(passItem.valid_from)} –{" "}
                        {formatDate(passItem.valid_until)}
                      </Typography>
                    </Stack>
                  </Stack>

                  <Box sx={{ mt: 2.5 }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      sx={{ mb: 0.75 }}
                    >
                      <Typography
                        variant="body2"
                        fontWeight={700}
                      >
                        Pozostałe wejścia
                      </Typography>
                      <Typography
                        variant="body2"
                        fontWeight={800}
                      >
                        {passItem.remaining_entries} /{" "}
                        {passItem.total_entries}
                      </Typography>
                    </Stack>

                    <Box
                      sx={{
                        height: 8,
                        borderRadius: 99,
                        bgcolor: "action.hover",
                        overflow: "hidden",
                      }}
                    >
                      <Box
                        sx={{
                          width: `${percent}%`,
                          height: "100%",
                          borderRadius: 99,
                          bgcolor:
                            percent > 25
                              ? "success.main"
                              : "warning.main",
                        }}
                      />
                    </Box>
                  </Box>

                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<HistoryRoundedIcon />}
                    onClick={() =>
                      void openHistory(passItem)
                    }
                    sx={{ mt: 2.5 }}
                  >
                    Historia karnetu
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
        {canManagePasses && (
          <MenuItem
            onClick={() => {
              if (menuPass) {
                openEditDialog(menuPass);
              }
            }}
          >
            <EditRoundedIcon
              fontSize="small"
              sx={{ mr: 1.5 }}
            />
            Edytuj karnet
          </MenuItem>
        )}

        <MenuItem
          onClick={() => {
            if (menuPass) {
              void openHistory(menuPass);
            }
          }}
        >
          <HistoryRoundedIcon
            fontSize="small"
            sx={{ mr: 1.5 }}
          />
          Historia karnetu
        </MenuItem>

        {canManagePasses && (
          <>
            <Divider />
            <MenuItem
              sx={{ color: "error.main" }}
              onClick={() => {
                if (menuPass) {
                  void removePass(menuPass);
                }
              }}
            >
              <DeleteOutlineRoundedIcon
                fontSize="small"
                sx={{ mr: 1.5 }}
              />
              Usuń karnet
            </MenuItem>
          </>
        )}
      </Menu>

      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingPass ? "Edytuj karnet" : "Nowy karnet"}
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
              select
              label="Klient"
              value={form.client_id}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  client_id: event.target.value,
                }))
              }
              required
            >
              <MenuItem value="">
                Wybierz klienta
              </MenuItem>
              {clients.map((client) => (
                <MenuItem
                  key={client.id}
                  value={client.id}
                >
                  {client.first_name} {client.last_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              label="Nazwa karnetu"
              value={form.name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  name: event.target.value,
                }))
              }
              required
            />

            <TextField
              type="number"
              label="Wszystkie wejścia"
              value={form.total_entries}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  total_entries: event.target.value,
                }))
              }
              inputProps={{ min: 1 }}
              required
            />

            <TextField
              type="number"
              label="Pozostałe wejścia"
              value={form.remaining_entries}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  remaining_entries: event.target.value,
                }))
              }
              inputProps={{ min: 0 }}
              required
            />

            <TextField
              type="date"
              label="Ważny od"
              value={form.valid_from}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  valid_from: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              type="date"
              label="Ważny do"
              value={form.valid_until}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  valid_until: event.target.value,
                }))
              }
              InputLabelProps={{ shrink: true }}
              required
            />

            <TextField
              select
              label="Status"
              value={form.active}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  active: event.target.value,
                }))
              }
            >
              <MenuItem value="true">Aktywny</MenuItem>
              <MenuItem value="false">
                Nieaktywny
              </MenuItem>
            </TextField>
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
            onClick={() => void savePass()}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <ConfirmationNumberRoundedIcon />
              )
            }
          >
            {editingPass
              ? "Zapisz zmiany"
              : "Dodaj karnet"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Historia karnetu — {historyPassName}
        </DialogTitle>

        <DialogContent>
          {historyLoading ? (
            <Box
              sx={{
                py: 5,
                display: "grid",
                placeItems: "center",
              }}
            >
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography
              color="text.secondary"
              sx={{ py: 3 }}
            >
              Brak operacji w historii tego karnetu.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {history.map((item) => (
                <Paper
                  key={item.id}
                  elevation={0}
                  sx={{
                    p: 2,
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 3,
                  }}
                >
                  <Typography fontWeight={800}>
                    {item.operation === "DEDUCT"
                      ? "Odliczono wejście"
                      : "Zwrócono wejście"}
                  </Typography>

                  {item.ride_date && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 0.75 }}
                    >
                      Jazda:{" "}
                      {new Date(
                        `${item.ride_date}T00:00:00`,
                      ).toLocaleDateString("pl-PL")}
                      {item.ride_start_time
                        ? `, ${item.ride_start_time}`
                        : ""}
                    </Typography>
                  )}

                  {(item.horse_name ||
                    item.instructor_name) && (
                    <Typography
                      variant="body2"
                      color="text.secondary"
                    >
                      {item.horse_name
                        ? `Koń: ${item.horse_name}`
                        : ""}
                      {item.horse_name &&
                      item.instructor_name
                        ? " · "
                        : ""}
                      {item.instructor_name
                        ? `Instruktor: ${item.instructor_name}`
                        : ""}
                    </Typography>
                  )}

                  <Typography
                    variant="caption"
                    color="text.secondary"
                    sx={{ display: "block", mt: 1 }}
                  >
                    Operacja:{" "}
                    {new Date(
                      item.created_at.endsWith("Z")
                        ? item.created_at
                        : `${item.created_at}Z`,
                    ).toLocaleString("pl-PL")}
                  </Typography>

                  {item.note && (
                    <Typography
                      variant="body2"
                      sx={{ mt: 1 }}
                    >
                      {item.note}
                    </Typography>
                  )}
                </Paper>
              ))}
            </Stack>
          )}
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setHistoryOpen(false)}>
            Zamknij
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