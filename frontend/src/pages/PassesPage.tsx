import { useEffect, useState } from "react";
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
  MenuItem,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";

import { getClients, type Client } from "../api/clients";
import {
  createPass,
  deletePass,
  getPasses,
  updatePass,
  type ClientPass,
} from "../api/passes";

import {
  getPassHistory,
  type PassHistoryItem,
} from "../api/passHistory";

const emptyForm = {
  client_id: "",
  name: "Karnet 10 wejść",
  total_entries: "10",
  remaining_entries: "10",
  valid_from: "",
  valid_until: "",
  active: "true",
};

export function PassesPage() {
  const [passes, setPasses] = useState<ClientPass[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [loading, setLoading] = useState(true);

  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPassId, setEditingPassId] = useState<number | null>(null);
  const [form, setForm] = useState(emptyForm);

  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");
  const [historyOpen, setHistoryOpen] = useState(false);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [history, setHistory] = useState<PassHistoryItem[]>([]);
  const [historyPassName, setHistoryPassName] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  async function loadData() {
    try {
      setLoading(true);
      setError("");

      const [passesData, clientsData] = await Promise.all([
        getPasses(),
        getClients(),
      ]);

      setPasses(passesData);
      setClients(clientsData);
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się pobrać danych."
      );
    } finally {
      setLoading(false);
    }
  }

  function openCreateDialog() {
    const today = new Date();
    const validUntil = new Date();
    validUntil.setMonth(validUntil.getMonth() + 1);

    setEditingPassId(null);
    setError("");

    setForm({
      ...emptyForm,
      valid_from: today.toISOString().slice(0, 10),
      valid_until: validUntil.toISOString().slice(0, 10),
    });

    setDialogOpen(true);
  }

  function openEditDialog(passItem: ClientPass) {
    setEditingPassId(passItem.id);
    setError("");

    setForm({
      client_id: String(passItem.client_id),
      name: passItem.name,
      total_entries: String(passItem.total_entries),
      remaining_entries: String(passItem.remaining_entries),
      valid_from: passItem.valid_from,
      valid_until: passItem.valid_until,
      active: String(passItem.active),
    });

    setDialogOpen(true);
  }

  function closeDialog() {
    setDialogOpen(false);
    setEditingPassId(null);
    setError("");
    setForm(emptyForm);
  }

  async function handleSave() {
    if (!form.client_id) {
      setError("Wybierz klienta.");
      return;
    }

    if (!form.name.trim()) {
      setError("Nazwa karnetu jest wymagana.");
      return;
    }

    const totalEntries = Number(form.total_entries);
    const remainingEntries = Number(form.remaining_entries);

    if (totalEntries <= 0) {
      setError("Liczba wszystkich wejść musi być większa od zera.");
      return;
    }

    if (remainingEntries < 0 || remainingEntries > totalEntries) {
      setError(
        "Pozostała liczba wejść musi mieścić się między 0 a liczbą wszystkich wejść."
      );
      return;
    }

    if (!form.valid_from || !form.valid_until) {
      setError("Uzupełnij daty ważności karnetu.");
      return;
    }

    if (form.valid_until < form.valid_from) {
      setError("Data końcowa nie może być wcześniejsza niż początkowa.");
      return;
    }

    const payload = {
      client_id: Number(form.client_id),
      name: form.name.trim(),
      total_entries: totalEntries,
      remaining_entries: remainingEntries,
      valid_from: form.valid_from,
      valid_until: form.valid_until,
      active: form.active === "true",
    };

    try {
      setError("");

      if (editingPassId !== null) {
        await updatePass(editingPassId, payload);
        setSuccessMessage("Karnet został zaktualizowany.");
      } else {
        await createPass(payload);
        setSuccessMessage("Karnet został dodany.");
      }

      closeDialog();
      await loadData();
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać karnetu."
      );
    }
  }

  async function handleDelete(passItem: ClientPass) {
    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć karnet „${passItem.name}” klienta ${passItem.client_name || ""}?`
    );

    if (!confirmed) {
      return;
    }

    try {
      await deletePass(passItem.id);
      await loadData();
      setSuccessMessage("Karnet został usunięty.");
    } catch (err) {
      console.error(err);

      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się usunąć karnetu."
      );
    }
  }

async function openHistory(passItem: ClientPass) {
  console.log("Kliknięto historię", passItem);

  setHistoryOpen(true);
  setHistoryLoading(true);
  setHistory([]);
  setHistoryPassName(passItem.name);
  setError("");

  try {
    const data = await getPassHistory(passItem.id);

    console.log("Historia:", data);
    setHistory(data);
  } catch (err) {
    console.error("Błąd historii:", err);

    setError(
      err instanceof Error
        ? err.message
        : "Nie udało się pobrać historii."
    );
  } finally {
    setHistoryLoading(false);
  }
}
  const filteredPasses = passes.filter((passItem) => {
    const phrase = search.toLowerCase();

    return (
      passItem.name.toLowerCase().includes(phrase) ||
      (passItem.client_name || "").toLowerCase().includes(phrase)
    );
  });

  function getPassStatus(passItem: ClientPass) {
    const today = new Date().toISOString().slice(0, 10);

    if (!passItem.active) {
      return {
        label: "Nieaktywny",
        color: "default" as const,
      };
    }

    if (passItem.valid_until < today) {
      return {
        label: "Wygasł",
        color: "error" as const,
      };
    }

    if (passItem.remaining_entries <= 0) {
      return {
        label: "Wykorzystany",
        color: "warning" as const,
      };
    }

    return {
      label: "Aktywny",
      color: "success" as const,
    };
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

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
          <Typography variant="h4" fontWeight={800} gutterBottom>
            🎫 Karnety
          </Typography>

          <Typography color="text.secondary">
            Zarządzanie karnetami i liczbą pozostałych wejść.
          </Typography>
        </Box>

        <Button variant="contained" onClick={openCreateDialog}>
          + Dodaj karnet
        </Button>
      </Box>

      {error && !dialogOpen && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <TextField
        label="Szukaj karnetu"
        placeholder="Nazwa karnetu lub klient..."
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={(event) => setSearch(event.target.value)}
      />

      {filteredPasses.length === 0 ? (
        <Typography>Brak karnetów w bazie.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 2,
          }}
        >
          {filteredPasses.map((passItem) => {
            const status = getPassStatus(passItem);

            return (
              <Card
                key={passItem.id}
                elevation={0}
                sx={{ border: "1px solid #e5e7eb" }}
              >
                <CardContent>
                  <Typography variant="overline">
                    KARNET #{passItem.id}
                  </Typography>

                  <Typography variant="h5" fontWeight={700} gutterBottom>
                    {passItem.name}
                  </Typography>

                  <Typography>
                    Klient: {passItem.client_name || `ID ${passItem.client_id}`}
                  </Typography>

                  <Typography sx={{ mt: 1 }}>
                    Pozostało wejść:{" "}
                    <strong>
                      {passItem.remaining_entries} / {passItem.total_entries}
                    </strong>
                  </Typography>

                  <Typography>
                    Ważny od: {passItem.valid_from}
                  </Typography>

                  <Typography>
                    Ważny do: {passItem.valid_until}
                  </Typography>

                  <Chip
                    sx={{ mt: 2 }}
                    label={status.label}
                    color={status.color}
                  />

             <Box sx={{ mt: 2, display: "flex", gap: 1, flexWrap: "wrap" }}>
  <Button
    variant="outlined"
    size="small"
    onClick={() => openEditDialog(passItem)}
  >
    Edytuj
  </Button>

  <Button
    variant="outlined"
    size="small"
    onClick={() => openHistory(passItem)}
  >
    Historia
  </Button>

  <Button
    variant="outlined"
    color="error"
    size="small"
    onClick={() => handleDelete(passItem)}
  >
    Usuń
  </Button>
</Box>
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Dialog
        open={dialogOpen}
        onClose={closeDialog}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          {editingPassId !== null ? "✏️ Edytuj karnet" : "🎫 Nowy karnet"}
        </DialogTitle>

        <DialogContent>
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
              <MenuItem value="">-- wybierz klienta --</MenuItem>

              {clients.map((client) => (
                <MenuItem key={client.id} value={client.id}>
                  {client.first_name} {client.last_name}
                </MenuItem>
              ))}
            </TextField>

            <TextField
              required
              label="Nazwa karnetu"
              value={form.name}
              onChange={(event) =>
                setForm({
                  ...form,
                  name: event.target.value,
                })
              }
            />

            <TextField
              required
              type="number"
              label="Liczba wszystkich wejść"
              value={form.total_entries}
              onChange={(event) =>
                setForm({
                  ...form,
                  total_entries: event.target.value,
                })
              }
            />

            <TextField
              required
              type="number"
              label="Pozostała liczba wejść"
              value={form.remaining_entries}
              onChange={(event) =>
                setForm({
                  ...form,
                  remaining_entries: event.target.value,
                })
              }
            />

            <TextField
              required
              type="date"
              label="Ważny od"
              value={form.valid_from}
              InputLabelProps={{ shrink: true }}
              onChange={(event) =>
                setForm({
                  ...form,
                  valid_from: event.target.value,
                })
              }
            />

            <TextField
              required
              type="date"
              label="Ważny do"
              value={form.valid_until}
              InputLabelProps={{ shrink: true }}
              onChange={(event) =>
                setForm({
                  ...form,
                  valid_until: event.target.value,
                })
              }
            />

            <TextField
              select
              label="Status"
              value={form.active}
              onChange={(event) =>
                setForm({
                  ...form,
                  active: event.target.value,
                })
              }
            >
              <MenuItem value="true">Aktywny</MenuItem>
              <MenuItem value="false">Nieaktywny</MenuItem>
            </TextField>
          </Stack>
        </DialogContent>

        <DialogActions>
          <Button onClick={closeDialog}>Anuluj</Button>

          <Button variant="contained" onClick={handleSave}>
            {editingPassId !== null
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
          📜 Historia karnetu — {historyPassName}
        </DialogTitle>

        <DialogContent>
          {historyLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
              <CircularProgress />
            </Box>
          ) : history.length === 0 ? (
            <Typography color="text.secondary">
              Brak operacji w historii tego karnetu.
            </Typography>
          ) : (
            <Stack spacing={2} sx={{ mt: 1 }}>
             {history.map((item) => (
  <Box
    key={item.id}
    sx={{
      border: "1px solid #e5e7eb",
      borderRadius: 2,
      p: 2,
    }}
  >
    <Typography fontWeight={700}>
      {item.operation === "DEDUCT"
        ? "➖ Odliczono wejście"
        : "➕ Zwrócono wejście"}
    </Typography>

    {item.ride_date ? (
      <>
        <Typography
          variant="body2"
          fontWeight={700}
          sx={{ mt: 1 }}
        >
          📅 {new Date(`${item.ride_date}T00:00:00`).toLocaleDateString("pl-PL")}
{item.ride_start_time
  ? `, ${item.ride_start_time}`
  : ""}
        </Typography>

        {item.client_name && (
          <Typography variant="body2">
            👤 {item.client_name}
          </Typography>
        )}

        {item.horse_name && (
          <Typography variant="body2">
            🐴 {item.horse_name}
          </Typography>
        )}

        {item.instructor_name && (
          <Typography variant="body2">
            👨‍🏫 {item.instructor_name}
          </Typography>
        )}
      </>
    ) : item.ride_id ? (
      <Typography variant="body2" sx={{ mt: 1 }}>
        Jazda #{item.ride_id}
      </Typography>
    ) : (
      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mt: 1 }}
      >
        🗑️ Jazda została usunięta
      </Typography>
    )}

    <Typography
      variant="body2"
      color="text.secondary"
      sx={{ mt: 1 }}
    >
      🕒 Operacja:{" "}
      {new Date(
        item.created_at.endsWith("Z")
          ? item.created_at
          : `${item.created_at}Z`
      ).toLocaleString("pl-PL")}
    </Typography>

    {item.note && (
      <Typography sx={{ mt: 1 }}>
        {item.note}
      </Typography>
    )}
  </Box>
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
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
      >
        <Alert
          severity="success"
          variant="filled"
          onClose={() => setSuccessMessage("")}
        >
          {successMessage}
        </Alert>
      </Snackbar>
    </Box>
  );
}