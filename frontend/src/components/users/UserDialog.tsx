import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Stack,
  TextField,
} from "@mui/material";
import PersonAddRoundedIcon from "@mui/icons-material/PersonAddRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";

import type { User, UserCreate, UserUpdate } from "../../api/users";

interface UserDialogProps {
  open: boolean;
  user?: User | null;
  onClose: () => void;
  onCreate: (payload: UserCreate) => Promise<void>;
  onUpdate: (id: number, payload: UserUpdate) => Promise<void>;
}

const emptyForm = {
  username: "",
  full_name: "",
  password: "",
  role: "reception",
};

export default function UserDialog({
  open,
  user,
  onClose,
  onCreate,
  onUpdate,
}: UserDialogProps) {
  const [form, setForm] = useState(emptyForm);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const isEdit = Boolean(user);

  useEffect(() => {
    setForm(
      user
        ? {
            username: user.username,
            full_name: user.full_name,
            password: "",
            role: user.role,
          }
        : emptyForm,
    );
    setError("");
  }, [user, open]);

  function handleChange(field: keyof typeof form) {
    return (event: React.ChangeEvent<HTMLInputElement>) => {
      setForm((current) => ({ ...current, [field]: event.target.value }));
    };
  }

  async function handleSubmit() {
    if (!form.username.trim() || !form.full_name.trim()) {
      setError("Uzupełnij login oraz imię i nazwisko.");
      return;
    }

    if (!isEdit && form.password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    try {
      setSaving(true);
      setError("");

      if (user) {
        await onUpdate(user.id, {
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          role: form.role,
        });
      } else {
        await onCreate({
          username: form.username.trim(),
          full_name: form.full_name.trim(),
          password: form.password,
          role: form.role,
        });
      }

      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się zapisać użytkownika.",
      );
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={saving ? undefined : onClose}
      fullWidth
      maxWidth="sm"
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>
        {isEdit ? "Edytuj użytkownika" : "Dodaj użytkownika"}
      </DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Login"
            value={form.username}
            onChange={handleChange("username")}
            fullWidth
            autoFocus
          />

          <TextField
            label="Imię i nazwisko"
            value={form.full_name}
            onChange={handleChange("full_name")}
            fullWidth
          />

          {!isEdit && (
            <TextField
              label="Hasło"
              type="password"
              value={form.password}
              onChange={handleChange("password")}
              helperText="Minimum 6 znaków"
              fullWidth
            />
          )}

          <TextField
            label="Rola"
            select
            value={form.role}
            onChange={handleChange("role")}
            fullWidth
          >
            <MenuItem value="admin">Administrator</MenuItem>
            <MenuItem value="reception">Recepcja</MenuItem>
            <MenuItem value="instructor">Instruktor</MenuItem>
          </TextField>
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={saving}>
          Anuluj
        </Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving}
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : isEdit ? (
              <SaveRoundedIcon />
            ) : (
              <PersonAddRoundedIcon />
            )
          }
        >
          {saving ? "Zapisywanie..." : "Zapisz"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}