import { useEffect, useMemo, useRef, useState } from "react";
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
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import HistoryRoundedIcon from "@mui/icons-material/HistoryRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import QrCode2RoundedIcon from "@mui/icons-material/QrCode2Rounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";

import { api } from "../api/client";
import {
  activateClient,
  createClient,
  deactivateClient,
  getClients,
  updateClient,
  type Client,
  type ClientCreate,
  type ClientFilter,
} from "../api/clients";

type ClientRide = {
  id: number;
  start_time: string;
  duration_minutes: number;
  status: string;
  horse_name?: string | null;
  instructor_name?: string | null;
  notes?: string | null;
};

type ClientForm = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  riding_level: string;
  barcode: string;
  qr_code: string;
  rfid_uid: string;
  notes: string;
};

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error" | "info";
};

const emptyForm: ClientForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  riding_level: "",
  barcode: "",
  qr_code: "",
  rfid_uid: "",
  notes: "",
};

const rideStatusMap = {
  completed: {
    label: "Zakończona",
    color: "success" as const,
  },
  checked_in: {
    label: "Klient obecny",
    color: "warning" as const,
  },
  cancelled: {
    label: "Anulowana",
    color: "error" as const,
  },
  planned: {
    label: "Zaplanowana",
    color: "primary" as const,
  },
};

function clientInitials(client: Client) {
  return `${client.first_name?.[0] ?? ""}${client.last_name?.[0] ?? ""}`
    .toUpperCase();
}

function fullName(client: Client) {
  return `${client.first_name} ${client.last_name}`.trim();
}

function toPayload(form: ClientForm): ClientCreate {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    riding_level: form.riding_level.trim() || undefined,
    barcode: form.barcode.trim() || undefined,
    qr_code: form.qr_code.trim() || undefined,
    rfid_uid: form.rfid_uid.trim() || undefined,
    notes: form.notes.trim() || undefined,
  };
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [clientFilter, setClientFilter] =
    useState<ClientFilter>("active");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [formOpen, setFormOpen] = useState(false);
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);

  const [rfidDialogOpen, setRfidDialogOpen] = useState(false);
  const [rfidScanValue, setRfidScanValue] = useState("");
  const rfidInputRef = useRef<HTMLInputElement>(null);

  const [ridesDialogOpen, setRidesDialogOpen] = useState(false);
  const [ridesLoading, setRidesLoading] = useState(false);
  const [clientRides, setClientRides] = useState<ClientRide[]>([]);
  const [ridesClientName, setRidesClientName] = useState("");

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuClient, setMenuClient] = useState<Client | null>(null);

  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "info",
  });

  async function loadClients() {
    try {
      setLoading(true);
      const data = await getClients(clientFilter);
      setClients(data);
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać klientów.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients();
  }, [clientFilter]);

  useEffect(() => {
    if (!rfidDialogOpen) {
      return;
    }

    const timer = window.setTimeout(
      () => rfidInputRef.current?.focus(),
      100,
    );

    return () => window.clearTimeout(timer);
  }, [rfidDialogOpen]);

  const filteredClients = useMemo(() => {
    const normalized = search.trim().toLowerCase();

    if (!normalized) {
      return clients;
    }

    return clients.filter((client) =>
      [
        client.first_name,
        client.last_name,
        client.phone,
        client.email,
        client.riding_level,
        client.rfid_uid,
        client.barcode,
      ]
        .filter(Boolean)
        .some((value) =>
          String(value).toLowerCase().includes(normalized),
        ),
    );
  }, [clients, search]);

  function openCreateDialog() {
    setEditingClient(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClient(client);
    setForm({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      riding_level: client.riding_level ?? "",
      barcode: client.barcode ?? "",
      qr_code: client.qr_code ?? "",
      rfid_uid: client.rfid_uid ?? "",
      notes: client.notes ?? "",
    });
    setFormOpen(true);
  }

  function openActionsMenu(
    event: React.MouseEvent<HTMLElement>,
    client: Client,
  ) {
    setMenuAnchor(event.currentTarget);
    setMenuClient(client);
  }

  function closeActionsMenu() {
    setMenuAnchor(null);
    setMenuClient(null);
  }

  async function saveClient() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setSnackbar({
        open: true,
        message: "Imię i nazwisko są wymagane.",
        severity: "error",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = toPayload(form);

      if (editingClient) {
        await updateClient(editingClient.id, payload);
      } else {
        await createClient(payload);
      }

      setFormOpen(false);
      setEditingClient(null);
      setForm(emptyForm);

      await loadClients();

      setSnackbar({
        open: true,
        message: editingClient
          ? "Dane klienta zostały zapisane."
          : "Klient został dodany.",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać klienta.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  async function loadClientRides(client: Client) {
    closeActionsMenu();
    setRidesClientName(fullName(client));
    setRidesDialogOpen(true);
    setRidesLoading(true);

    try {
      const response = await api.get<ClientRide[]>(
        `/rides/client/${client.id}`,
      );
      setClientRides(response.data);
    } catch (error) {
      setClientRides([]);
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać historii jazd.",
        severity: "error",
      });
    } finally {
      setRidesLoading(false);
    }
  }

  function openRfidDialog(client: Client) {
    closeActionsMenu();
    setEditingClient(client);
    setForm({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone ?? "",
      email: client.email ?? "",
      riding_level: client.riding_level ?? "",
      barcode: client.barcode ?? "",
      qr_code: client.qr_code ?? "",
      rfid_uid: client.rfid_uid ?? "",
      notes: client.notes ?? "",
    });
    setRfidScanValue("");
    setRfidDialogOpen(true);
  }

  async function assignRfid() {
    const code = rfidScanValue.trim();

    if (!editingClient || !code) {
      return;
    }

    try {
      await updateClient(editingClient.id, {
        ...toPayload(form),
        rfid_uid: code,
      });

      setRfidDialogOpen(false);
      setRfidScanValue("");
      setEditingClient(null);
      await loadClients();

      setSnackbar({
        open: true,
        message: "Karta RFID została przypisana.",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się przypisać karty RFID.",
        severity: "error",
      });
    }
  }

  async function removeRfid(client: Client) {
    closeActionsMenu();

    const confirmed = window.confirm(
      `Odpiąć kartę RFID od klienta ${fullName(client)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      await updateClient(client.id, {
        first_name: client.first_name,
        last_name: client.last_name,
        phone: client.phone ?? undefined,
        email: client.email ?? undefined,
        riding_level: client.riding_level ?? undefined,
        barcode: client.barcode ?? undefined,
        qr_code: client.qr_code ?? undefined,
        rfid_uid: undefined,
        notes: client.notes ?? undefined,
      });

      await api.patch(`/clients/${client.id}`, {
        rfid_uid: null,
      });

      await loadClients();

      setSnackbar({
        open: true,
        message: "Karta RFID została odpięta.",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się odpiąć karty RFID.",
        severity: "error",
      });
    }
  }

  async function toggleClientActivity(client: Client) {
    closeActionsMenu();

    const action = client.is_active
      ? "dezaktywować"
      : "ponownie aktywować";

    const confirmed = window.confirm(
      `Czy na pewno chcesz ${action} klienta ${fullName(client)}?`,
    );

    if (!confirmed) {
      return;
    }

    try {
      if (client.is_active) {
        await deactivateClient(client.id);
      } else {
        await activateClient(client.id);
      }

      await loadClients();

      setSnackbar({
        open: true,
        message: client.is_active
          ? "Klient został dezaktywowany. Historia jazd pozostała zachowana."
          : "Klient został ponownie aktywowany.",
        severity: "success",
      });
    } catch (error) {
      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się zmienić statusu klienta.",
        severity: "error",
      });
    }
  }

  return (
    <Box>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Klienci
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Dane kontaktowe, historia jazd i przypisane karty RFID.
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
          Dodaj klienta
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
        <TextField
          fullWidth
          placeholder="Szukaj po imieniu, telefonie, e-mailu lub RFID"
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonSearchRoundedIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Stack
        direction={{ xs: "column", sm: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", sm: "center" }}
        spacing={1.5}
        sx={{ mb: 2 }}
      >
        <Stack direction="row" spacing={1}>
          {([
            ["active", "Aktywni"],
            ["inactive", "Nieaktywni"],
            ["all", "Wszyscy"],
          ] as const).map(([value, label]) => (
            <Button
              key={value}
              size="small"
              variant={
                clientFilter === value
                  ? "contained"
                  : "outlined"
              }
              onClick={() => setClientFilter(value)}
              sx={{
                borderRadius: 2.5,
                textTransform: "none",
                fontWeight: 700,
              }}
            >
              {label}
            </Button>
          ))}
        </Stack>

        <Typography variant="body2" color="text.secondary">
          Wyświetlono {filteredClients.length} z {clients.length} klientów
        </Typography>
      </Stack>

      {loading ? (
        <Box sx={{ py: 8, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : filteredClients.length === 0 ? (
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
          <PersonSearchRoundedIcon
            sx={{ fontSize: 52, color: "text.disabled", mb: 1 }}
          />
          <Typography fontWeight={800}>
            Nie znaleziono klientów
          </Typography>
          <Typography color="text.secondary">
            Zmień wyszukiwane hasło albo dodaj nowego klienta.
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
          {filteredClients.map((client) => (
            <Card
              key={client.id}
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
                    "0 14px 30px rgba(15, 23, 42, 0.07)",
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
                  alignItems="flex-start"
                  justifyContent="space-between"
                  spacing={2}
                >
                  <Stack
                    direction="row"
                    alignItems="center"
                    spacing={1.5}
                    sx={{ minWidth: 0 }}
                  >
                    <Avatar
                      sx={{
                        width: 48,
                        height: 48,
                        fontWeight: 800,
                      }}
                    >
                      {clientInitials(client)}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography
                        variant="h6"
                        fontWeight={800}
                        noWrap
                      >
                        {fullName(client)}
                      </Typography>

                      <Stack
                        direction="row"
                        spacing={0.75}
                        sx={{ mt: 0.5 }}
                      >
                        <Chip
                          size="small"
                          label={
                            client.riding_level || "Brak poziomu"
                          }
                          variant="outlined"
                        />
                        <Chip
                          size="small"
                          label={
                            client.is_active
                              ? "Aktywny"
                              : "Nieaktywny"
                          }
                          color={
                            client.is_active
                              ? "success"
                              : "default"
                          }
                        />
                      </Stack>
                    </Box>
                  </Stack>

                  <Tooltip title="Więcej akcji">
                    <IconButton
                      onClick={(event) =>
                        openActionsMenu(event, client)
                      }
                    >
                      <MoreVertRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Divider sx={{ my: 2 }} />

                <Stack spacing={1.25}>
                  <Stack direction="row" spacing={1.25}>
                    <PhoneRoundedIcon
                      fontSize="small"
                      color="action"
                    />
                    <Typography
                      variant="body2"
                      color={
                        client.phone
                          ? "text.primary"
                          : "text.secondary"
                      }
                    >
                      {client.phone || "Brak telefonu"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1.25}>
                    <EmailRoundedIcon
                      fontSize="small"
                      color="action"
                    />
                    <Typography
                      variant="body2"
                      color={
                        client.email
                          ? "text.primary"
                          : "text.secondary"
                      }
                      sx={{ wordBreak: "break-word" }}
                    >
                      {client.email || "Brak adresu e-mail"}
                    </Typography>
                  </Stack>

                  <Stack direction="row" spacing={1.25}>
                    <SensorsRoundedIcon
                      fontSize="small"
                      color="action"
                    />
                    <Typography variant="body2">
                      RFID:{" "}
                      <Box
                        component="span"
                        color={
                          client.rfid_uid
                            ? "success.main"
                            : "text.secondary"
                        }
                        fontWeight={700}
                      >
                        {client.rfid_uid || "nieprzypisane"}
                      </Box>
                    </Typography>
                  </Stack>
                </Stack>

                <Stack
                  direction={{ xs: "column", sm: "row" }}
                  spacing={1}
                  sx={{ mt: 2.5 }}
                >
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => openEditDialog(client)}
                  >
                    Edytuj
                  </Button>

                  <Button
                    fullWidth
                    variant="contained"
                    startIcon={<HistoryRoundedIcon />}
                    onClick={() => void loadClientRides(client)}
                  >
                    Historia
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeActionsMenu}
      >
        <MenuItem
          onClick={() => {
            if (menuClient) {
              openRfidDialog(menuClient);
            }
          }}
        >
          <SensorsRoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Zmień kartę RFID
        </MenuItem>

        <MenuItem
          disabled={!menuClient?.rfid_uid}
          onClick={() => {
            if (menuClient) {
              void removeRfid(menuClient);
            }
          }}
        >
          <QrCode2RoundedIcon fontSize="small" sx={{ mr: 1.5 }} />
          Odepnij kartę RFID
        </MenuItem>

        <Divider />

        <MenuItem
          sx={{
            color: menuClient?.is_active
              ? "warning.main"
              : "success.main",
          }}
          onClick={() => {
            if (menuClient) {
              void toggleClientActivity(menuClient);
            }
          }}
        >
          <DeleteOutlineRoundedIcon
            fontSize="small"
            sx={{ mr: 1.5 }}
          />
          {menuClient?.is_active
            ? "Dezaktywuj klienta"
            : "Aktywuj ponownie"}
        </MenuItem>
      </Menu>

      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingClient ? "Edytuj klienta" : "Dodaj klienta"}
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
              value={form.first_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  first_name: event.target.value,
                }))
              }
              required
              autoFocus
            />

            <TextField
              label="Nazwisko"
              value={form.last_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  last_name: event.target.value,
                }))
              }
              required
            />

            <TextField
              label="Telefon"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />

            <TextField
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />

            <TextField
              label="Poziom jazdy"
              value={form.riding_level}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  riding_level: event.target.value,
                }))
              }
            />

            <TextField
              label="Kod kreskowy"
              value={form.barcode}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  barcode: event.target.value,
                }))
              }
            />

            <TextField
              label="Kod QR"
              value={form.qr_code}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  qr_code: event.target.value,
                }))
              }
            />

            <TextField
              label="RFID UID"
              value={form.rfid_uid}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  rfid_uid: event.target.value,
                }))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <Tooltip title="Odczytaj kartę">
                      <IconButton
                        onClick={() => {
                          if (editingClient) {
                            openRfidDialog(editingClient);
                          }
                        }}
                        disabled={!editingClient}
                      >
                        <SensorsRoundedIcon />
                      </IconButton>
                    </Tooltip>
                  </InputAdornment>
                ),
              }}
            />

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
            onClick={() => void saveClient()}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress size={18} color="inherit" />
              ) : (
                <BadgeRoundedIcon />
              )
            }
          >
            {editingClient ? "Zapisz zmiany" : "Dodaj klienta"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={rfidDialogOpen}
        onClose={() => setRfidDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Przypisz kartę RFID</DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2 }}
          >
            Przyłóż kartę do czytnika albo wpisz jej UID ręcznie.
          </Typography>

          <TextField
            inputRef={rfidInputRef}
            autoFocus
            fullWidth
            label="UID karty"
            value={rfidScanValue}
            onChange={(event) =>
              setRfidScanValue(event.target.value)
            }
            onKeyDown={(event) => {
              if (
                event.key === "Enter" &&
                rfidScanValue.trim()
              ) {
                void assignRfid();
              }
            }}
          />
        </DialogContent>

        <DialogActions>
          <Button onClick={() => setRfidDialogOpen(false)}>
            Anuluj
          </Button>
          <Button
            variant="contained"
            disabled={!rfidScanValue.trim()}
            onClick={() => void assignRfid()}
          >
            Przypisz
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={ridesDialogOpen}
        onClose={() => setRidesDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          Historia jazd — {ridesClientName}
        </DialogTitle>

        <DialogContent>
          {ridesLoading ? (
            <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
              <CircularProgress />
            </Box>
          ) : clientRides.length === 0 ? (
            <Typography color="text.secondary" sx={{ py: 4 }}>
              Brak zapisanych jazd.
            </Typography>
          ) : (
            <Stack spacing={1.5}>
              {clientRides.map((ride) => {
                const status =
                  rideStatusMap[
                    ride.status as keyof typeof rideStatusMap
                  ] ?? rideStatusMap.planned;

                return (
                  <Paper
                    key={ride.id}
                    elevation={0}
                    sx={{
                      p: 2,
                      border: "1px solid",
                      borderColor: "divider",
                      borderRadius: 3,
                    }}
                  >
                    <Stack
                      direction={{ xs: "column", sm: "row" }}
                      justifyContent="space-between"
                      spacing={2}
                    >
                      <Box>
                        <Typography fontWeight={800}>
                          {new Date(
                            ride.start_time,
                          ).toLocaleString("pl-PL")}
                        </Typography>

                        <Typography
                          variant="body2"
                          color="text.secondary"
                          sx={{ mt: 0.5 }}
                        >
                          Koń: {ride.horse_name || "—"} · Instruktor:{" "}
                          {ride.instructor_name || "—"} ·{" "}
                          {ride.duration_minutes} min
                        </Typography>
                      </Box>

                      <Chip
                        label={status.label}
                        color={status.color}
                        size="small"
                      />
                    </Stack>
                  </Paper>
                );
              })}
            </Stack>
          )}
        </DialogContent>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={4000}
        onClose={() =>
          setSnackbar((current) => ({
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
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((current) => ({
              ...current,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}