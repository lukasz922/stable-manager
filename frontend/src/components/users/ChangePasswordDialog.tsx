import { useEffect, useState } from "react";
import {
  Alert,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";

import type { User } from "../../api/users";

interface ChangePasswordDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onSave: (id: number, password: string) => Promise<void>;
}

export default function ChangePasswordDialog({
  open,
  user,
  onClose,
  onSave,
}: ChangePasswordDialogProps) {
  const [password, setPassword] = useState("");
  const [repeatPassword, setRepeatPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) {
      setPassword("");
      setRepeatPassword("");
      setError("");
    }
  }, [open]);

  async function handleSubmit() {
    if (!user) return;

    if (password.length < 6) {
      setError("Hasło musi mieć co najmniej 6 znaków.");
      return;
    }

    if (password !== repeatPassword) {
      setError("Podane hasła nie są takie same.");
      return;
    }

    try {
      setSaving(true);
      setError("");
      await onSave(user.id, password);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Nie udało się zmienić hasła.",
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
      <DialogTitle sx={{ fontWeight: 900 }}>Zmiana hasła</DialogTitle>

      <DialogContent>
        <Stack spacing={2} sx={{ mt: 1 }}>
          <Paper elevation={0} sx={{ p: 2, bgcolor: "action.hover", borderRadius: 3 }}>
            <Typography variant="caption" color="text.secondary">
              Użytkownik
            </Typography>
            <Typography fontWeight={900}>{user?.full_name}</Typography>
            <Typography color="text.secondary">@{user?.username}</Typography>
          </Paper>

          {error && <Alert severity="error">{error}</Alert>}

          <TextField
            label="Nowe hasło"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            helperText="Minimum 6 znaków"
            fullWidth
            autoFocus
          />

          <TextField
            label="Powtórz nowe hasło"
            type="password"
            value={repeatPassword}
            onChange={(event) => setRepeatPassword(event.target.value)}
            fullWidth
          />
        </Stack>
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={saving}>Anuluj</Button>
        <Button
          variant="contained"
          onClick={() => void handleSubmit()}
          disabled={saving}
          startIcon={
            saving ? <CircularProgress size={18} color="inherit" /> : <KeyRoundedIcon />
          }
        >
          {saving ? "Zapisywanie..." : "Zmień hasło"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}