import { useMemo, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
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
import BlockRoundedIcon from "@mui/icons-material/BlockRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import KeyRoundedIcon from "@mui/icons-material/KeyRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PersonSearchRoundedIcon from "@mui/icons-material/PersonSearchRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

import ChangePasswordDialog from "../components/users/ChangePasswordDialog";
import DeleteUserDialog from "../components/users/DeleteUserDialog";
import UserDialog from "../components/users/UserDialog";
import { useUsers } from "../hooks/useUsers";
import type { User } from "../api/users";

type FilterValue = "all" | "active" | "inactive";

type MessageState = {
  open: boolean;
  text: string;
  severity: "success" | "error" | "info";
};

function roleLabel(role: string) {
  if (role === "admin") return "Administrator";
  if (role === "reception") return "Recepcja";
  if (role === "instructor") return "Instruktor";
  return role;
}

function roleColor(role: string) {
  if (role === "admin") return "error" as const;
  if (role === "reception") return "primary" as const;
  if (role === "instructor") return "secondary" as const;
  return "default" as const;
}

function initials(user: User) {
  const value = user.full_name?.trim() || user.username;
  const parts = value.split(/\s+/).filter(Boolean);
  return `${parts[0]?.[0] ?? ""}${parts[1]?.[0] ?? ""}`.toUpperCase();
}

export default function UsersPage() {
  const {
    users,
    loading,
    error,
    createUser,
    updateUser,
    deleteUser,
    toggleActive,
    changePassword,
  } = useUsers();

  const [filter, setFilter] = useState<FilterValue>("all");
  const [search, setSearch] = useState("");

  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);

  const [passwordDialogOpen, setPasswordDialogOpen] = useState(false);
  const [passwordUser, setPasswordUser] = useState<User | null>(null);

  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deleteDialogUser, setDeleteDialogUser] = useState<User | null>(null);

  const [menuAnchor, setMenuAnchor] = useState<HTMLElement | null>(null);
  const [menuUser, setMenuUser] = useState<User | null>(null);

  const [message, setMessage] = useState<MessageState>({
    open: false,
    text: "",
    severity: "info",
  });

  const filteredUsers = useMemo(() => {
    const phrase = search.trim().toLowerCase();

    return users.filter((user) => {
      const matchesStatus =
        filter === "all" ||
        (filter === "active" && user.is_active) ||
        (filter === "inactive" && !user.is_active);

      const matchesSearch =
        !phrase ||
        user.username.toLowerCase().includes(phrase) ||
        user.full_name.toLowerCase().includes(phrase) ||
        roleLabel(user.role).toLowerCase().includes(phrase);

      return matchesStatus && matchesSearch;
    });
  }, [users, filter, search]);

  const activeCount = users.filter((user) => user.is_active).length;
  const inactiveCount = users.length - activeCount;
  const adminCount = users.filter((user) => user.role === "admin").length;

  function openMenu(event: React.MouseEvent<HTMLElement>, user: User) {
    setMenuAnchor(event.currentTarget);
    setMenuUser(user);
  }

  function closeMenu() {
    setMenuAnchor(null);
    setMenuUser(null);
  }

  function handleAdd() {
    setSelectedUser(null);
    setDialogOpen(true);
  }

  function handleEdit(user: User) {
    closeMenu();
    setSelectedUser(user);
    setDialogOpen(true);
  }

  function handlePassword(user: User) {
    closeMenu();
    setPasswordUser(user);
    setPasswordDialogOpen(true);
  }

  function handleDelete(user: User) {
    closeMenu();
    setDeleteDialogUser(user);
    setDeleteDialogOpen(true);
  }

  async function handleToggleActive(user: User) {
    closeMenu();

    try {
      await toggleActive(user.id, !user.is_active);
      setMessage({
        open: true,
        text: user.is_active
          ? "Użytkownik został dezaktywowany."
          : "Użytkownik został aktywowany.",
        severity: "success",
      });
    } catch (err) {
      setMessage({
        open: true,
        text:
          err instanceof Error
            ? err.message
            : "Nie udało się zmienić statusu użytkownika.",
        severity: "error",
      });
    }
  }

  async function handleCreate(payload: Parameters<typeof createUser>[0]) {
    await createUser(payload);
    setMessage({
      open: true,
      text: "Użytkownik został dodany.",
      severity: "success",
    });
  }

  async function handleUpdate(
    id: number,
    payload: Parameters<typeof updateUser>[1],
  ) {
    await updateUser(id, payload);
    setMessage({
      open: true,
      text: "Dane użytkownika zostały zapisane.",
      severity: "success",
    });
  }

  async function handleChangePassword(id: number, password: string) {
    await changePassword(id, password);
    setMessage({
      open: true,
      text: "Hasło użytkownika zostało zmienione.",
      severity: "success",
    });
  }

  async function handleDeleteConfirmed(id: number) {
    await deleteUser(id);
    setMessage({
      open: true,
      text: "Użytkownik został usunięty.",
      severity: "success",
    });
  }

  return (
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography variant="h4" fontWeight={900}>
            Użytkownicy
          </Typography>
          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Zarządzanie kontami, rolami i dostępem pracowników.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={<AddRoundedIcon />}
          onClick={handleAdd}
          sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
        >
          Dodaj użytkownika
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "repeat(2, minmax(0, 1fr))",
            md: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        <SummaryCard
          label="Wszyscy"
          value={users.length}
          active={filter === "all"}
          icon={<PeopleRoundedIcon />}
          onClick={() => setFilter("all")}
        />
        <SummaryCard
          label="Aktywni"
          value={activeCount}
          active={filter === "active"}
          icon={<CheckCircleRoundedIcon />}
          onClick={() => setFilter("active")}
        />
        <SummaryCard
          label="Nieaktywni"
          value={inactiveCount}
          active={filter === "inactive"}
          icon={<BlockRoundedIcon />}
          onClick={() => setFilter("inactive")}
        />
        <SummaryCard
          label="Administratorzy"
          value={adminCount}
          icon={<SecurityRoundedIcon />}
        />
      </Box>

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
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Szukaj po loginie, nazwie lub roli"
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <PersonSearchRoundedIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Wyświetlono {filteredUsers.length} z {users.length} użytkowników
      </Typography>

      {loading ? (
        <Box sx={{ minHeight: 340, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : filteredUsers.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            p: 6,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
          }}
        >
          <PeopleRoundedIcon sx={{ fontSize: 52, color: "text.disabled" }} />
          <Typography fontWeight={800} sx={{ mt: 1 }}>
            Brak użytkowników
          </Typography>
          <Typography color="text.secondary">
            Zmień filtr lub wyszukiwane hasło.
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
          {filteredUsers.map((user) => (
            <Card
              key={user.id}
              elevation={0}
              sx={{
                border: "1px solid",
                borderColor: "divider",
                borderRadius: 4,
              }}
            >
              <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                <Stack direction="row" justifyContent="space-between" spacing={2}>
                  <Stack direction="row" spacing={1.5} sx={{ minWidth: 0 }}>
                    <Avatar sx={{ width: 48, height: 48, fontWeight: 900 }}>
                      {initials(user)}
                    </Avatar>

                    <Box sx={{ minWidth: 0 }}>
                      <Typography variant="h6" fontWeight={900} noWrap>
                        {user.full_name || user.username}
                      </Typography>
                      <Typography color="text.secondary" noWrap>
                        @{user.username}
                      </Typography>
                    </Box>
                  </Stack>

                  <Tooltip title="Więcej akcji">
                    <IconButton onClick={(event) => openMenu(event, user)}>
                      <MoreVertRoundedIcon />
                    </IconButton>
                  </Tooltip>
                </Stack>

                <Stack direction="row" spacing={1} flexWrap="wrap" sx={{ mt: 2 }}>
                  <Chip
                    size="small"
                    label={roleLabel(user.role)}
                    color={roleColor(user.role)}
                    variant="outlined"
                  />
                  <Chip
                    size="small"
                    label={user.is_active ? "Aktywny" : "Nieaktywny"}
                    color={user.is_active ? "success" : "default"}
                  />
                </Stack>

                <Stack direction="row" spacing={1} sx={{ mt: 2.5 }}>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<EditRoundedIcon />}
                    onClick={() => handleEdit(user)}
                  >
                    Edytuj
                  </Button>
                  <Button
                    fullWidth
                    variant="outlined"
                    startIcon={<KeyRoundedIcon />}
                    onClick={() => handlePassword(user)}
                  >
                    Hasło
                  </Button>
                </Stack>
              </CardContent>
            </Card>
          ))}
        </Box>
      )}

      <Menu anchorEl={menuAnchor} open={Boolean(menuAnchor)} onClose={closeMenu}>
        {menuUser && (
          <>
            <MenuItem onClick={() => handleEdit(menuUser)}>
              <EditRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
              Edytuj użytkownika
            </MenuItem>
            <MenuItem onClick={() => handlePassword(menuUser)}>
              <KeyRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
              Zmień hasło
            </MenuItem>
            <MenuItem onClick={() => void handleToggleActive(menuUser)}>
              {menuUser.is_active ? (
                <BlockRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
              ) : (
                <CheckCircleRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
              )}
              {menuUser.is_active ? "Dezaktywuj" : "Aktywuj"}
            </MenuItem>
            <MenuItem onClick={() => handleDelete(menuUser)} sx={{ color: "error.main" }}>
              <DeleteOutlineRoundedIcon fontSize="small" sx={{ mr: 1.25 }} />
              Usuń użytkownika
            </MenuItem>
          </>
        )}
      </Menu>

      <UserDialog
        open={dialogOpen}
        user={selectedUser}
        onClose={() => {
          setDialogOpen(false);
          setSelectedUser(null);
        }}
        onCreate={handleCreate}
        onUpdate={handleUpdate}
      />

      <ChangePasswordDialog
        open={passwordDialogOpen}
        user={passwordUser}
        onClose={() => {
          setPasswordDialogOpen(false);
          setPasswordUser(null);
        }}
        onSave={handleChangePassword}
      />

      <DeleteUserDialog
        open={deleteDialogOpen}
        user={deleteDialogUser}
        onClose={() => {
          setDeleteDialogOpen(false);
          setDeleteDialogUser(null);
        }}
        onDelete={handleDeleteConfirmed}
      />

      <Snackbar
        open={message.open}
        autoHideDuration={5000}
        onClose={() => setMessage((current) => ({ ...current, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={message.severity}
          variant="filled"
          onClose={() => setMessage((current) => ({ ...current, open: false }))}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}

function SummaryCard({
  label,
  value,
  active = false,
  icon,
  onClick,
}: {
  label: string;
  value: number;
  active?: boolean;
  icon: React.ReactNode;
  onClick?: () => void;
}) {
  return (
    <Card
      elevation={0}
      onClick={onClick}
      sx={{
        cursor: onClick ? "pointer" : "default",
        border: "1px solid",
        borderColor: active ? "primary.main" : "divider",
        borderRadius: 4,
      }}
    >
      <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
        <Box sx={{ color: active ? "primary.main" : "text.secondary" }}>
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={700}>
          {label}
        </Typography>
        <Typography variant="h3" fontWeight={900}>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}