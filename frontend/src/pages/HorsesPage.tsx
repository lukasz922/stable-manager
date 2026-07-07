import { useEffect, useState } from "react";
import {
  DialogActions,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  TextField,
  Typography,
} from "@mui/material";

import type { Horse } from "../api/horses";
import { createHorse, getHorses } from "../api/horses";

export function HorsesPage() {
  const [horses, setHorses] = useState<Horse[]>([]);
  const [loading, setLoading] = useState(true);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState("");
  const [form, setForm] = useState({
    name: "",
    breed: "",
    gender: "",
    color: "",
    height_cm: "",
    max_rider_weight: "",
    max_lessons_per_day: "5",
    status: "available",
    notes: "",
  });

  useEffect(() => {
    loadHorses();
  }, []);

  async function loadHorses() {
    try {
      const data = await getHorses();
      setHorses(data);
    } finally {
      setLoading(false);
    }
  }

  async function handleCreateHorse() {

if (!form.name.trim()) {
  setError("Imię konia jest wymagane.");
  return;
}

setError("");   

 await createHorse({
      name: form.name,
      breed: form.breed || undefined,
      gender: form.gender || undefined,
      color: form.color || undefined,
      height_cm: form.height_cm ? Number(form.height_cm) : undefined,
      max_rider_weight: form.max_rider_weight ? Number(form.max_rider_weight) : undefined,
      max_lessons_per_day: Number(form.max_lessons_per_day),
      status: form.status,
      notes: form.notes || undefined,
    });

    setOpen(false);
    setForm({
      name: "",
      breed: "",
      gender: "",
      color: "",
      height_cm: "",
      max_rider_weight: "",
      max_lessons_per_day: "5",
      status: "available",
      notes: "",
    });

    await loadHorses();
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
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800} gutterBottom>
            🐴 Konie
          </Typography>
          <Typography color="text.secondary">
            Lista wszystkich koni w stajni.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => setOpen(true)}>
          + Dodaj konia
        </Button>
      </Box>

      {horses.length === 0 ? (
        <Typography>Brak koni w bazie.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 2,
          }}
        >
          {horses.map((horse) => (
            <Card key={horse.id} elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
              <CardContent>
                <Typography variant="overline">{horse.code}</Typography>

                <Typography variant="h5" fontWeight={700}>
                  {horse.name}
                </Typography>

                <Typography>Rasa: {horse.breed || "-"}</Typography>
                <Typography>Płeć: {horse.gender || "-"}</Typography>
                <Typography>Maść: {horse.color || "-"}</Typography>
                <Typography>Limit jazd: {horse.max_lessons_per_day}</Typography><Chip
  sx={{ mt: 2 }}
  color={
    horse.status === "available"
      ? "success"
      : horse.status === "resting"
      ? "warning"
      : "error"
  }
  label={
    horse.status === "available"
      ? "🟢 Dostępny"
      : horse.status === "resting"
      ? "🟡 Odpoczywa"
      : "🔴 Niedostępny"
  }
/>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj konia</DialogTitle>
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
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />

          <TextField
            label="Rasa"
            fullWidth
            sx={{ mb: 2 }}
            value={form.breed}
            onChange={(e) => setForm({ ...form, breed: e.target.value })}
          />

         <FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>Płeć</InputLabel>
  <Select
    label="Płeć"
    value={form.gender}
    onChange={(e) => setForm({ ...form, gender: e.target.value })}
  >
    <MenuItem value="">Brak</MenuItem>
    <MenuItem value="Klacz">Klacz</MenuItem>
    <MenuItem value="Wałach">Wałach</MenuItem>
    <MenuItem value="Ogier">Ogier</MenuItem>
  </Select>
</FormControl>

          <TextField
            label="Maść"
            fullWidth
            sx={{ mb: 2 }}
            value={form.color}
            onChange={(e) => setForm({ ...form, color: e.target.value })}
          />

          <TextField
            label="Wysokość cm"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.height_cm}
            onChange={(e) => setForm({ ...form, height_cm: e.target.value })}
          />

          <TextField
            label="Maks. waga jeźdźca"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.max_rider_weight}
            onChange={(e) => setForm({ ...form, max_rider_weight: e.target.value })}
          />

          <TextField
            label="Maks. jazd dziennie"
            type="number"
            fullWidth
            sx={{ mb: 2 }}
            value={form.max_lessons_per_day}
            onChange={(e) => setForm({ ...form, max_lessons_per_day: e.target.value })}
          />

         <FormControl fullWidth sx={{ mb: 2 }}>
  <InputLabel>Status</InputLabel>
  <Select
    label="Status"
    value={form.status}
    onChange={(e) => setForm({ ...form, status: e.target.value })}
  >
    <MenuItem value="available">Dostępny</MenuItem>
    <MenuItem value="resting">Odpoczywa</MenuItem>
    <MenuItem value="unavailable">Niedostępny</MenuItem>
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
  <Button onClick={() => setOpen(false)}>
    Anuluj
  </Button>

  <Button variant="contained" onClick={handleCreateHorse}>
    Zapisz konia
  </Button>
</DialogActions>
        </DialogContent>
      </Dialog>
    </Box>
  );
}