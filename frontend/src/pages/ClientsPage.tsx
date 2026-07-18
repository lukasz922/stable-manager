import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Dialog,
  DialogContent,
  DialogTitle,
  Grid,
  TextField,
  Typography,
} from "@mui/material";

import { api } from "../api/client";

type Client = {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  riding_level?: string | null;
  barcode?: string | null;
  rfid_uid?: string | null;
  notes?: string | null;
};

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
  rfid_uid: string;
  notes: string;
};

const emptyForm: ClientForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  riding_level: "",
  barcode: "",
  rfid_uid: "",
  notes: "",
};

function getApiErrorMessage(error: unknown, fallback: string): string {
  if (typeof error === "object" && error !== null && "response" in error) {
    const response = (
      error as {
        response?: {
          data?: {
            detail?: string;
          };
        };
      }
    ).response;

    if (typeof response?.data?.detail === "string") {
      return response.data.detail;
    }
  }

  return fallback;
}

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");

  const [open, setOpen] = useState(false);
  const [editingClientId, setEditingClientId] = useState<number | null>(null);
  const [form, setForm] = useState<ClientForm>(emptyForm);
  const [error, setError] = useState("");

  const [rfidDialogOpen, setRfidDialogOpen] = useState(false);
  const [rfidScanValue, setRfidScanValue] = useState("");

  const [ridesDialogOpen, setRidesDialogOpen] = useState(false);
  const [clientRides, setClientRides] = useState<ClientRide[]>([]);
  const [ridesClientName, setRidesClientName] = useState("");
  const [ridesLoading, setRidesLoading] = useState(false);

  async function loadClients() {
    try {
      const response = await api.get<Client[]>("/clients");
      setClients(response.data);
    } catch (loadError) {
      console.error(loadError);
      setError("Nie udało się pobrać klientów.");
    }
  }

  useEffect(() => {
    loadClients();
  }, []);

  async function loadClientRides(client: Client) {
    setRidesLoading(true);
    setRidesClientName(`${client.first_name} ${client.last_name}`);
    setRidesDialogOpen(true);

    try {
      const response = await api.get<ClientRide[]>(
        `/rides/client/${client.id}`
      );
      setClientRides(response.data);
    } catch (loadError) {
      console.error(loadError);
      setClientRides([]);
    } finally {
      setRidesLoading(false);
    }
  }

  function openCreateDialog() {
    setEditingClientId(null);
    setError("");
    setForm(emptyForm);
    setOpen(true);
  }

  function openEditDialog(client: Client) {
    setEditingClientId(client.id);
    setError("");

    setForm({
      first_name: client.first_name,
      last_name: client.last_name,
      phone: client.phone || "",
      email: client.email || "",
      riding_level: client.riding_level || "",
      barcode: client.barcode || "",
      rfid_uid: client.rfid_uid || "",
      notes: client.notes || "",
    });

    setOpen(true);
  }

  function openRfidDialog(client?: Client) {
    setError("");
    setRfidScanValue("");

    if (client) {
      setEditingClientId(client.id);

      setForm({
        first_name: client.first_name,
        last_name: client.last_name,
        phone: client.phone || "",
        email: client.email || "",
        riding_level: client.riding_level || "",
        barcode: client.barcode || "",
        rfid_uid: client.rfid_uid || "",
        notes: client.notes || "",
      });
    }

    setRfidDialogOpen(true);
  }

  async function saveClient() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Imię i nazwisko są wymagane.");
      return;
    }

    try {
      setError("");

      const payload = {
        first_name: form.first_name.trim(),
        last_name: form.last_name.trim(),
        phone: form.phone.trim() || null,
        email: form.email.trim() || null,
        riding_level: form.riding_level.trim() || null,
        barcode: form.barcode.trim() || null,
        rfid_uid: form.rfid_uid.trim() || null,
        notes: form.notes.trim() || null,
      };

      if (editingClientId === null) {
        await api.post("/clients", payload);
      } else {
        await api.patch(`/clients/${editingClientId}`, payload);
      }

      setOpen(false);
      setEditingClientId(null);
      setForm(emptyForm);

      await loadClients();
    } catch (saveError) {
      console.error(saveError);
      setError(
        getApiErrorMessage(saveError, "Nie udało się zapisać klienta.")
      );
    }
  }

  async function assignRfidToForm() {
    const code = rfidScanValue.trim();

    if (!code) {
      return;
    }

    try {
      setError("");

      if (editingClientId !== null) {
        await api.patch(`/clients/${editingClientId}`, {
          rfid_uid: code,
        });

        await loadClients();
      }

      setForm((currentForm) => ({
        ...currentForm,
        rfid_uid: code,
      }));

      setRfidScanValue("");
      setRfidDialogOpen(false);
    } catch (assignError) {
      console.error(assignError);
      setError(
        getApiErrorMessage(
          assignError,
          "Nie udało się zmienić karty RFID."
        )
      );
    }
  }

  async function removeRfid(client: Client) {
    const confirmed = window.confirm(
      `Czy na pewno chcesz odpiąć kartę RFID od klienta ${client.first_name} ${client.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      setError("");

      await api.patch(`/clients/${client.id}`, {
        rfid_uid: null,
      });

      await loadClients();
    } catch (removeError) {
      console.error(removeError);
      setError(
        getApiErrorMessage(
          removeError,
          "Nie udało się usunąć karty RFID."
        )
      );
    }
  }

  const normalizedSearch = search.trim().toLowerCase();

  const filteredClients = clients.filter((client) => {
    return (
      client.first_name.toLowerCase().includes(normalizedSearch) ||
      client.last_name.toLowerCase().includes(normalizedSearch) ||
      (client.phone || "").toLowerCase().includes(normalizedSearch) ||
      (client.email || "").toLowerCase().includes(normalizedSearch) ||
      (client.rfid_uid || "").toLowerCase().includes(normalizedSearch)
    );
  });

  return (
    <Box>
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          gap: 2,
          mb: 3,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Klienci
          </Typography>

          <Typography color="text.secondary">
            Zarządzanie klientami stajni.
          </Typography>
        </Box>

        <Button variant="contained" onClick={openCreateDialog}>
          + Dodaj klienta
        </Button>
      </Box>

      {error && !open && !rfidDialogOpen && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <TextField
        fullWidth
        label="🔍 Szukaj klienta"
        sx={{ mb: 2 }}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Wyświetlono {filteredClients.length} z {clients.length} klientów
      </Typography>

      <Grid container spacing={2}>
        {filteredClients.map((client) => (
          <Grid item xs={12} md={6} lg={4} key={client.id}>
            <Card
              elevation={0}
              sx={{
                height: "100%",
                border: "1px solid #e5e7eb",
              }}
            >
              <CardContent>
                <Typography variant="h6" fontWeight={700}>
                  {client.first_name} {client.last_name}
                </Typography>

                <Typography color="text.secondary">
                  📞 {client.phone || "brak telefonu"}
                </Typography>

                <Typography color="text.secondary">
                  ✉️ {client.email || "brak e-maila"}
                </Typography>

                <Typography color="text.secondary">
                  Poziom: {client.riding_level || "brak"}
                </Typography>

                <Typography color="text.secondary">
                  Kod: {client.barcode || "brak"}
                </Typography>

                <Typography color="text.secondary">
                  📡 RFID: {client.rfid_uid || "brak"}
                </Typography>

                <Box
                  sx={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: 1,
                    mt: 2,
                  }}
                >
                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openEditDialog(client)}
                  >
                    Edytuj
                  </Button>

                  <Button
                    variant="contained"
                    size="small"
                    onClick={() => loadClientRides(client)}
                  >
                    📜 Historia jazd
                  </Button>

                  <Button
                    variant="outlined"
                    size="small"
                    onClick={() => openRfidDialog(client)}
                  >
                    📡 Zmień RFID
                  </Button>

                  <Button
                    color="error"
                    variant="outlined"
                    size="small"
                    disabled={!client.rfid_uid}
                    onClick={() => removeRfid(client)}
                  >
                    ❌ Usuń RFID
                  </Button>
               <Button
  color="error"
  variant="contained"
  size="small"
  onClick={async () => {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć klienta ${client.first_name} ${client.last_name}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await api.delete(`/clients/${client.id}`);
      await loadClients();
    } catch (error) {
      console.error(error);

      setError(
        getApiErrorMessage(
          error,
          "Nie udało się usunąć klienta."
        )
      );
    }
  }}
>
  🗑️ Usuń klienta
</Button>



			   </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog
        open={open}
        onClose={() => setOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingClientId === null ? "Dodaj klienta" : "Edytuj klienta"}
        </DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mt: 1, mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Imię"
            fullWidth
            sx={{ mt: 1, mb: 2 }}
            value={form.first_name}
            onChange={(event) =>
              setForm({
                ...form,
                first_name: event.target.value,
              })
            }
          />

          <TextField
            label="Nazwisko"
            fullWidth
            sx={{ mb: 2 }}
            value={form.last_name}
            onChange={(event) =>
              setForm({
                ...form,
                last_name: event.target.value,
              })
            }
          />

          <TextField
            label="Telefon"
            fullWidth
            sx={{ mb: 2 }}
            value={form.phone}
            onChange={(event) =>
              setForm({
                ...form,
                phone: event.target.value,
              })
            }
          />

          <TextField
            label="E-mail"
            fullWidth
            sx={{ mb: 2 }}
            value={form.email}
            onChange={(event) =>
              setForm({
                ...form,
                email: event.target.value,
              })
            }
          />

          <TextField
            label="Poziom jazdy"
            fullWidth
            sx={{ mb: 2 }}
            value={form.riding_level}
            onChange={(event) =>
              setForm({
                ...form,
                riding_level: event.target.value,
              })
            }
          />

          <TextField
            label="Kod kreskowy / karta"
            fullWidth
            sx={{ mb: 2 }}
            value={form.barcode}
            onChange={(event) =>
              setForm({
                ...form,
                barcode: event.target.value,
              })
            }
          />

          <TextField
            label="RFID UID"
            fullWidth
            sx={{ mb: 2 }}
            value={form.rfid_uid}
            onChange={(event) =>
              setForm({
                ...form,
                rfid_uid: event.target.value,
              })
            }
          />

          <Button
            variant="outlined"
            fullWidth
            sx={{ mb: 2 }}
            onClick={() => openRfidDialog()}
          >
            📡 Odczytaj kartę RFID
          </Button>

          <TextField
            label="Notatki"
            fullWidth
            multiline
            rows={3}
            sx={{ mb: 2 }}
            value={form.notes}
            onChange={(event) =>
              setForm({
                ...form,
                notes: event.target.value,
              })
            }
          />

          <Button variant="contained" fullWidth onClick={saveClient}>
            {editingClientId === null ? "Dodaj klienta" : "Zapisz zmiany"}
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={rfidDialogOpen}
        onClose={() => setRfidDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>📡 Odczyt karty RFID</DialogTitle>

        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Typography sx={{ mb: 2 }}>
            Przyłóż kartę do czytnika albo wpisz kod ręcznie.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Kod RFID"
            value={rfidScanValue}
            onChange={(event) => setRfidScanValue(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                assignRfidToForm();
              }
            }}
          />

          <Button
            variant="contained"
            fullWidth
            sx={{ mt: 2 }}
            disabled={!rfidScanValue.trim()}
            onClick={assignRfidToForm}
          >
            Przypisz kartę
          </Button>
        </DialogContent>
      </Dialog>

      <Dialog
        open={ridesDialogOpen}
        onClose={() => setRidesDialogOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>Historia jazd – {ridesClientName}</DialogTitle>

        <DialogContent>
          {ridesLoading ? (
            <Typography>Ładowanie...</Typography>
          ) : clientRides.length === 0 ? (
            <Typography>Brak jazd.</Typography>
          ) : (
            clientRides.map((ride) => (
              <Card
                key={ride.id}
                elevation={0}
                sx={{
                  mb: 2,
                  border: "1px solid #e5e7eb",
                }}
              >
                <CardContent>
                  <Typography fontWeight={700}>
                    {new Date(ride.start_time).toLocaleString("pl-PL")}
                  </Typography>

                  <Typography>🐴 {ride.horse_name || "-"}</Typography>

                  <Typography>
                    👨‍🏫 {ride.instructor_name || "-"}
                  </Typography>

                  <Typography>⏱️ {ride.duration_minutes} min</Typography>

                  <Typography
                    sx={{
                      mt: 1,
                      fontWeight: 700,
                    }}
                  >
                    {ride.status === "completed"
                      ? "🟢 Odbyta"
                      : ride.status === "checked_in"
                        ? "🟠 Odbita / klient obecny"
                        : ride.status === "cancelled"
                          ? "🔴 Anulowana"
                          : "🔵 Zaplanowana"}
                  </Typography>
                </CardContent>
              </Card>
            ))
          )}
        </DialogContent>
      </Dialog>
    </Box>
  );
}
