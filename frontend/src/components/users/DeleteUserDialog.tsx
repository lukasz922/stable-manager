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
  Typography,
} from "@mui/material";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";

import type { User } from "../../api/users";

interface DeleteUserDialogProps {
  open: boolean;
  user: User | null;
  onClose: () => void;
  onDelete: (id: number) => Promise<void>;
}

export default function DeleteUserDialog({
  open,
  user,
  onClose,
  onDelete,
}: DeleteUserDialogProps) {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (open) setError("");
  }, [open]);

  async function handleDelete() {
    if (!user) return;

    try {
      setDeleting(true);
      setError("");
      await onDelete(user.id);
      onClose();
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Nie udało się usunąć użytkownika.",
      );
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Dialog
      open={open}
      onClose={deleting ? undefined : onClose}
      fullWidth
      maxWidth="xs"
      PaperProps={{ sx: { borderRadius: 4 } }}
    >
      <DialogTitle sx={{ fontWeight: 900 }}>Usuń użytkownika</DialogTitle>

      <DialogContent>
        <Alert severity="warning" sx={{ mb: 2 }}>
          Tej operacji nie można cofnąć. Bezpieczniejszą opcją jest dezaktywacja konta.
        </Alert>

        <Paper elevation={0} sx={{ p: 2, bgcolor: "action.hover", borderRadius: 3 }}>
          <Typography fontWeight={900}>{user?.full_name}</Typography>
          <Typography color="text.secondary">Login: {user?.username}</Typography>
        </Paper>

        {error && (
          <Alert severity="error" sx={{ mt: 2 }}>
            {error}
          </Alert>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, pb: 3 }}>
        <Button onClick={onClose} disabled={deleting}>Anuluj</Button>
        <Button
          color="error"
          variant="contained"
          onClick={() => void handleDelete()}
          disabled={deleting}
          startIcon={
            deleting ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <DeleteOutlineRoundedIcon />
            )
          }
        >
          {deleting ? "Usuwanie..." : "Usuń"}
        </Button>
      </DialogActions>
    </Dialog>
  );
}