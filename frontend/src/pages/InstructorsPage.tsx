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
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Snackbar,
  TextField,
  Typography,
} from "@mui/material";

import type { Instructor } from "../api/instructors";
import { createInstructor, getInstructors } from "../api/instructors";

export function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [search, setSearch] = useState("");

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    specialization: "",
    hourly_rate: "",
    status: "active",
    notes: "",
  });

  useEffect(() => {
    loadInstructors();
  }, []);

  async function loadInstructors() {
    try {
      const data = await getInstructors();
      setInstructors(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateInstructor() {
    if (!form.first_name.trim() || !form.last_name.trim()) {
      setError("Imię i nazwisko instruktora są wymagane.");
      return;
    }

    setError("");

    await createInstructor({
      first_name: form.first_name,
      last_name: form.last_name,
      phone: form.phone || undefined,
      email: form.email || undefined,
      specialization: form.specialization || undefined,
      hourly_rate: form.hourly_rate ? Number(form.hourly_rate) : undefined,
      status: form.status,
      notes: form.notes || undefined,
    });

    setOpen(false);

    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      specialization: "",
      hourly_rate: "",
      status: "active",
      notes: "",
    });

    await loadInstructors();
    setSuccessMessage("Instruktor został dodany.");
  }

  const filteredInstructors = instructors.filter((instructor) => {
    const phrase = search.toLowerCase();

    return (
      instructor.first_name.toLowerCase().includes(phrase) ||
      instructor.last_name.toLowerCase().includes(phrase) ||
      (instructor.code || "").toLowerCase().includes(phrase) ||
      (instructor.specialization || "").toLowerCase().includes(phrase)
    );
  });

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            👨‍🏫 Instruktorzy
          </Typography>

          <Typography color="text.secondary">
            Lista instruktorów pracujących w stajni.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => setOpen(true)}>
          + Dodaj instruktora
        </Button>
      </Box>

      <TextField
        label="🔍 Szukaj instruktora"
        placeholder="Imię, nazwisko, kod lub specjalizacja..."
        fullWidth
        sx={{ mb: 3 }}
        value={search}
        onChange={(e) => setSearch(e.target.value)}
      />

      {filteredInstructors.length === 0 ? (
        <Typography>Brak instruktorów w bazie.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 2,
          }}
        >
          {filteredInstructors.map((instructor) => (
            <Card
              key={instructor.id}
              elevation={0}
              sx={{ border: "1px solid #e5e7eb" }}
            >
              <CardContent>
                <Typography variant="overline">{instructor.code}</Typography>

                <Typography variant="h5" fontWeight={700}>
                  {instructor.first_name} {instructor.last_name}
                </Typography>

                <Typography>Telefon: {instructor.phone || "-"}</Typography>
                <Typography>E-mail: {instructor.email || "-"}</Typography>
                <Typography>
                  Specjalizacja: {instructor.specialization || "-"}
                </Typography>
                <Typography>
                  Stawka:{" "}
                  {instructor.hourly_rate
                    ? `${instructor.hourly_rate} zł/h`
                    : "-"}
                </Typography>

                <Chip
                  sx={{ mt: 2 }}
                  color={instructor.status === "active" ? "success" : "warning"}
                  label={instructor.status === "active" ? "Aktywny" : "Nieaktywny"}
                />
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj instruktora</DialogTitle>
        <DialogContent>
          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <TextField
            label="Imię"
            fullWidth
            sx={{ mt: 1, mb: 2 }}
            value={form.first_name}
            onChange={(e) => setForm({ ...form, first_name: e.target.value })}
          />

          <TextField
            label="Nazwisko"
            fullWidth
            sx={{ mb: 2 }}
            value={form.last_name}
            onChange={(e) => setForm({ ...form, last_name: e.target.value })}
          />

          <TextField
            label="Telefon"
            fullWidth
            sx={{ mb: 2 }}
            value={form.phone}
            onChange={(e) => setForm({ ...form, phone: e.target.value })}
          />

          <TextField
            label="E-mail"
            fullWidth
            sx={{ mb: 2 }}
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
          />

          <TextField
            label="Specjalizacja"
            fullWidth
            sx={{ mb: 2 }}
            value={form.specialization}
            onChange={(e) =>
              setForm({ ...form, specialization: e.target.value })
            }
          />

          <TextField
            label="Stawka godzinowa"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.hourly_rate}
            onChange={(e) => setForm({ ...form, hourly_rate: e.target.value })}
          />

          <FormControl fullWidth sx={{ mb: 2 }}>
            <InputLabel>Status</InputLabel>
            <Select
              label="Status"
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
            >
              <MenuItem value="active">Aktywny</MenuItem>
              <MenuItem value="inactive">Nieaktywny</MenuItem>
            </Select>
          </FormControl>

          <TextField
            label="Notatki"
            multiline
            rows={3}
            fullWidth
            sx={{ mb: 2 }}
            value={form.notes}
            onChange={(e) => setForm({ ...form, notes: e.target.value })}
          />

          <DialogActions sx={{ px: 0 }}>
            <Button onClick={() => setOpen(false)}>Anuluj</Button>
            <Button variant="contained" onClick={handleCreateInstructor}>
              Zapisz instruktora
            </Button>
          </DialogActions>
        </DialogContent>
      </Dialog>

      <Snackbar
        open={Boolean(successMessage)}
        autoHideDuration={3000}
        onClose={() => setSuccessMessage("")}
        message={successMessage}
      />
    </Box>
  );
}