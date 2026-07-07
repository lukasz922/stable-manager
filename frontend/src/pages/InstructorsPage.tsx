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
import { getInstructors } from "../api/instructors";

export function InstructorsPage() {
  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [loading, setLoading] = useState(true);

const [open, setOpen] = useState(false);
const [error, setError] = useState("");
const [successMessage, setSuccessMessage] = useState("");

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

  async function loadInstructors() {
    try {
      const data = await getInstructors();
      setInstructors(data);
    } finally {
      setLoading(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ display: "flex", justifyContent: "center", mt: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
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
      {instructors.length === 0 ? (
        <Typography>Brak instruktorów w bazie.</Typography>
      ) : (
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))",
            gap: 2,
          }}
        >
          {instructors.map((instructor) => (
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
    </Box>
  );
}