import { useEffect, useState } from "react";
import {
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
  phone?: string;
  email?: string;
  riding_level?: string;
  barcode?: string;
};

export function ClientsPage() {
  const [clients, setClients] = useState<Client[]>([]);
  const [open, setOpen] = useState(false);

  const [form, setForm] = useState({
    first_name: "",
    last_name: "",
    phone: "",
    email: "",
    riding_level: "",
    barcode: "",
    notes: "",
  });

  async function loadClients() {
    const response = await api.get("/clients");
    setClients(response.data);
  }

  async function createClient() {
    await api.post("/clients", form);
    setOpen(false);
    setForm({
      first_name: "",
      last_name: "",
      phone: "",
      email: "",
      riding_level: "",
      barcode: "",
      notes: "",
    });
    loadClients();
  }

  useEffect(() => {
    loadClients();
  }, []);

  return (
    <Box>
      <Box sx={{ display: "flex", justifyContent: "space-between", mb: 3 }}>
        <Box>
          <Typography variant="h4" fontWeight={800}>
            Klienci
          </Typography>
          <Typography color="text.secondary">
            Zarządzanie klientami stajni.
          </Typography>
        </Box>

        <Button variant="contained" onClick={() => setOpen(true)}>
          + Dodaj klienta
        </Button>
      </Box>

      <Grid container spacing={2}>
        {clients.map((client) => (
          <Grid item xs={12} md={6} lg={4} key={client.id}>
            <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
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
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      <Dialog open={open} onClose={() => setOpen(false)} fullWidth maxWidth="sm">
        <DialogTitle>Dodaj klienta</DialogTitle>
        <DialogContent>
          <TextField label="Imię" fullWidth sx={{ mt: 1, mb: 2 }} value={form.first_name} onChange={(e) => setForm({ ...form, first_name: e.target.value })} />
          <TextField label="Nazwisko" fullWidth sx={{ mb: 2 }} value={form.last_name} onChange={(e) => setForm({ ...form, last_name: e.target.value })} />
          <TextField label="Telefon" fullWidth sx={{ mb: 2 }} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
          <TextField label="E-mail" fullWidth sx={{ mb: 2 }} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} />
          <TextField label="Poziom jazdy" fullWidth sx={{ mb: 2 }} value={form.riding_level} onChange={(e) => setForm({ ...form, riding_level: e.target.value })} />
          <TextField label="Kod kreskowy / karta" fullWidth sx={{ mb: 2 }} value={form.barcode} onChange={(e) => setForm({ ...form, barcode: e.target.value })} />
          <TextField label="Notatki" fullWidth multiline rows={3} sx={{ mb: 2 }} value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />

          <Button variant="contained" fullWidth onClick={createClient}>
            Zapisz klienta
          </Button>
        </DialogContent>
      </Dialog>
    </Box>
  );
}