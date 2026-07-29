import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Avatar,
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
  Divider,
  FormControl,
  IconButton,
  InputAdornment,
  InputLabel,
  Menu,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Stack,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";

import AddRoundedIcon from "@mui/icons-material/AddRounded";
import BadgeRoundedIcon from "@mui/icons-material/BadgeRounded";
import DeleteOutlineRoundedIcon from "@mui/icons-material/DeleteOutlineRounded";
import EditRoundedIcon from "@mui/icons-material/EditRounded";
import EmailRoundedIcon from "@mui/icons-material/EmailRounded";
import LinkRoundedIcon from "@mui/icons-material/LinkRounded";
import MoreVertRoundedIcon from "@mui/icons-material/MoreVertRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PhoneRoundedIcon from "@mui/icons-material/PhoneRounded";
import SearchRoundedIcon from "@mui/icons-material/SearchRounded";
import UnlinkRoundedIcon from "@mui/icons-material/LinkOffRounded";

import {
  createInstructor,
  deleteInstructor,
  getInstructors,
  linkInstructorUser,
  unlinkInstructorUser,
  updateInstructor,
  type Instructor,
  type InstructorCreate,
} from "../api/instructors";
import { usersApi, type User } from "../api/users";
import { useAuth } from "../auth/AuthContext";

type InstructorForm = {
  first_name: string;
  last_name: string;
  phone: string;
  email: string;
  specialization: string;
  hourly_rate: string;
  status: string;
  notes: string;
};

type StatusFilter = "all" | "active" | "inactive";

type MessageState = {
  open: boolean;
  text: string;
  severity: "success" | "error" | "info";
};

const emptyForm: InstructorForm = {
  first_name: "",
  last_name: "",
  phone: "",
  email: "",
  specialization: "",
  hourly_rate: "",
  status: "active",
  notes: "",
};

function fullName(instructor: Instructor) {
  return `${instructor.first_name} ${instructor.last_name}`.trim();
}

function initials(instructor: Instructor) {
  return `${instructor.first_name?.[0] ?? ""}${instructor.last_name?.[0] ?? ""}`
    .toUpperCase();
}

function toPayload(form: InstructorForm): InstructorCreate {
  return {
    first_name: form.first_name.trim(),
    last_name: form.last_name.trim(),
    phone: form.phone.trim() || undefined,
    email: form.email.trim() || undefined,
    specialization: form.specialization.trim() || undefined,
    hourly_rate: form.hourly_rate
      ? Number(form.hourly_rate)
      : undefined,
    status: form.status,
    notes: form.notes.trim() || undefined,
  };
}

export function InstructorsPage() {
  const { hasPermission } = useAuth();
  const canManageInstructors =
    hasPermission("instructors.manage");
  const canManageUsers = hasPermission("users.manage");

  const [instructors, setInstructors] = useState<Instructor[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] =
    useState<StatusFilter>("all");

  const [formOpen, setFormOpen] = useState(false);
  const [editingInstructor, setEditingInstructor] =
    useState<Instructor | null>(null);
  const [form, setForm] =
    useState<InstructorForm>(emptyForm);

  const [menuAnchor, setMenuAnchor] =
    useState<HTMLElement | null>(null);
  const [menuInstructor, setMenuInstructor] =
    useState<Instructor | null>(null);

  const [linkDialogOpen, setLinkDialogOpen] =
    useState(false);
  const [linkingInstructor, setLinkingInstructor] =
    useState<Instructor | null>(null);
  const [selectedUserId, setSelectedUserId] =
    useState<number | "">("");

  const [message, setMessage] = useState<MessageState>({
    open: false,
    text: "",
    severity: "info",
  });

  async function loadPage() {
    try {
      setLoading(true);

      const instructorData = await getInstructors();
      setInstructors(instructorData);

      if (canManageUsers) {
        const userData = await usersApi.getUsers();
        setUsers(userData);
      } else {
        setUsers([]);
      }
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać danych instruktorów.",
        severity: "error",
      });
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadPage();
  }, [canManageUsers]);

  const filteredInstructors = useMemo(() => {
    const phrase = search.trim().toLowerCase();

    return instructors.filter((instructor) => {
      const matchesStatus =
        statusFilter === "all" ||
        instructor.status === statusFilter;

      const matchesSearch =
        !phrase ||
        [
          instructor.first_name,
          instructor.last_name,
          instructor.code,
          instructor.specialization,
          instructor.phone,
          instructor.email,
        ]
          .filter(Boolean)
          .some((value) =>
            String(value).toLowerCase().includes(phrase),
          );

      return matchesStatus && matchesSearch;
    });
  }, [instructors, search, statusFilter]);

  const activeCount = instructors.filter(
    (instructor) => instructor.status === "active",
  ).length;
  const inactiveCount = instructors.filter(
    (instructor) => instructor.status === "inactive",
  ).length;
  const linkedCount = instructors.filter(
    (instructor) => instructor.user_id,
  ).length;

  const instructorUsers = users.filter(
    (user) => user.role === "instructor" && user.is_active,
  );

  function getLinkedUser(userId?: number | null) {
    if (!userId) return null;
    return users.find((user) => user.id === userId) ?? null;
  }

  function openCreateDialog() {
    setEditingInstructor(null);
    setForm(emptyForm);
    setFormOpen(true);
  }

  function openEditDialog(instructor: Instructor) {
    setEditingInstructor(instructor);
    setForm({
      first_name: instructor.first_name ?? "",
      last_name: instructor.last_name ?? "",
      phone: instructor.phone ?? "",
      email: instructor.email ?? "",
      specialization: instructor.specialization ?? "",
      hourly_rate: instructor.hourly_rate
        ? String(instructor.hourly_rate)
        : "",
      status: instructor.status ?? "active",
      notes: instructor.notes ?? "",
    });
    setFormOpen(true);
    closeMenu();
  }

  function openMenu(
    event: React.MouseEvent<HTMLElement>,
    instructor: Instructor,
  ) {
    setMenuAnchor(event.currentTarget);
    setMenuInstructor(instructor);
  }

  function closeMenu() {
    setMenuAnchor(null);
    setMenuInstructor(null);
  }

  async function saveInstructor() {
    if (
      !form.first_name.trim() ||
      !form.last_name.trim()
    ) {
      setMessage({
        open: true,
        text: "Imię i nazwisko instruktora są wymagane.",
        severity: "error",
      });
      return;
    }

    if (
      form.hourly_rate &&
      Number(form.hourly_rate) < 0
    ) {
      setMessage({
        open: true,
        text: "Stawka godzinowa nie może być ujemna.",
        severity: "error",
      });
      return;
    }

    try {
      setSaving(true);
      const payload = toPayload(form);

      if (editingInstructor) {
        await updateInstructor(
          editingInstructor.id,
          payload,
        );
      } else {
        await createInstructor(payload);
      }

      setFormOpen(false);
      setEditingInstructor(null);
      setForm(emptyForm);
      await loadPage();

      setMessage({
        open: true,
        text: editingInstructor
          ? "Dane instruktora zostały zapisane."
          : "Instruktor został dodany.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać instruktora.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  function openLinkDialog(instructor: Instructor) {
    closeMenu();

    if (!canManageInstructors || !canManageUsers) {
      setMessage({
        open: true,
        text:
          "Do powiązania konta potrzebne są uprawnienia do instruktorów i użytkowników.",
        severity: "error",
      });
      return;
    }

    setLinkingInstructor(instructor);
    setSelectedUserId(instructor.user_id ?? "");
    setLinkDialogOpen(true);
  }

  async function linkAccount() {
    if (!linkingInstructor || selectedUserId === "") {
      return;
    }

    try {
      await linkInstructorUser(
        linkingInstructor.id,
        Number(selectedUserId),
      );

      setLinkDialogOpen(false);
      setLinkingInstructor(null);
      setSelectedUserId("");
      await loadPage();

      setMessage({
        open: true,
        text: "Konto zostało powiązane z instruktorem.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się powiązać konta.",
        severity: "error",
      });
    }
  }

  async function unlinkAccount(instructor: Instructor) {
    closeMenu();

    const confirmed = window.confirm(
      `Odłączyć konto od instruktora ${fullName(instructor)}?`,
    );

    if (!confirmed) return;

    try {
      await unlinkInstructorUser(instructor.id);
      await loadPage();

      setMessage({
        open: true,
        text: "Konto zostało odłączone.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się odłączyć konta.",
        severity: "error",
      });
    }
  }

  async function removeInstructor(instructor: Instructor) {
    closeMenu();

    const confirmed = window.confirm(
      `Czy na pewno chcesz usunąć instruktora ${fullName(instructor)}?`,
    );

    if (!confirmed) return;

    try {
      await deleteInstructor(instructor.id);
      await loadPage();

      setMessage({
        open: true,
        text: "Instruktor został usunięty.",
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się usunąć instruktora.",
        severity: "error",
      });
    }
  }

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
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
          <Typography variant="h4" fontWeight={800}>
            Instruktorzy
          </Typography>
          <Typography
            color="text.secondary"
            sx={{ mt: 0.75 }}
          >
            Kadra, specjalizacje, stawki i powiązane konta użytkowników.
          </Typography>
        </Box>

        {canManageInstructors && (
          <Button
            variant="contained"
            startIcon={<AddRoundedIcon />}
            onClick={openCreateDialog}
            sx={{
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 800,
            }}
          >
            Dodaj instruktora
          </Button>
        )}
      </Stack>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            lg: "repeat(4, minmax(0, 1fr))",
          },
          gap: 2,
          mb: 3,
        }}
      >
        {[
          {
            label: "Wszyscy",
            value: instructors.length,
            filter: "all" as const,
          },
          {
            label: "Aktywni",
            value: activeCount,
            filter: "active" as const,
          },
          {
            label: "Nieaktywni",
            value: inactiveCount,
            filter: "inactive" as const,
          },
          {
            label: "Powiązane konta",
            value: linkedCount,
            filter: "all" as const,
          },
        ].map((item, index) => (
          <Card
            key={`${item.label}-${index}`}
            elevation={0}
            onClick={() => setStatusFilter(item.filter)}
            sx={{
              cursor: "pointer",
              border: "1px solid",
              borderColor:
                statusFilter === item.filter &&
                item.label !== "Powiązane konta"
                  ? "primary.main"
                  : "divider",
              borderRadius: 4,
              transition:
                "transform 180ms ease, box-shadow 180ms ease",
              "&:hover": {
                transform: "translateY(-2px)",
                boxShadow:
                  "0 12px 28px rgba(15,23,42,0.07)",
              },
            }}
          >
            <CardContent
              sx={{
                p: 2.5,
                "&:last-child": { pb: 2.5 },
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
              >
                {item.label}
              </Typography>
              <Typography variant="h3" fontWeight={800}>
                {item.value}
              </Typography>
            </CardContent>
          </Card>
        ))}
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
          placeholder="Szukaj po imieniu, kodzie, specjalizacji, telefonie lub e-mailu"
          value={search}
          onChange={(event) =>
            setSearch(event.target.value)
          }
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchRoundedIcon color="action" />
              </InputAdornment>
            ),
          }}
        />
      </Paper>

      <Typography
        variant="body2"
        color="text.secondary"
        sx={{ mb: 2 }}
      >
        Wyświetlono {filteredInstructors.length} z{" "}
        {instructors.length} instruktorów
      </Typography>

      {filteredInstructors.length === 0 ? (
        <Paper
          elevation={0}
          sx={{
            py: 8,
            px: 2,
            textAlign: "center",
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
          }}
        >
          <PersonRoundedIcon
            sx={{
              fontSize: 56,
              color: "text.disabled",
              mb: 1,
            }}
          />
          <Typography fontWeight={800}>
            Nie znaleziono instruktorów
          </Typography>
          <Typography color="text.secondary">
            Zmień wyszukiwane hasło lub filtr statusu.
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
          {filteredInstructors.map((instructor) => {
            const linkedUser = getLinkedUser(
              instructor.user_id,
            );

            return (
              <Card
                key={instructor.id}
                elevation={0}
                sx={{
                  height: "100%",
                  border: "1px solid",
                  borderColor: "divider",
                  borderRadius: 4,
                  transition:
                    "transform 180ms ease, box-shadow 180ms ease",
                  "&:hover": {
                    transform: "translateY(-2px)",
                    boxShadow:
                      "0 14px 30px rgba(15,23,42,0.07)",
                  },
                }}
              >
                <CardContent
                  sx={{
                    p: 2.5,
                    "&:last-child": { pb: 2.5 },
                  }}
                >
                  <Stack
                    direction="row"
                    justifyContent="space-between"
                    alignItems="flex-start"
                    spacing={2}
                  >
                    <Stack
                      direction="row"
                      spacing={1.5}
                      alignItems="center"
                      sx={{ minWidth: 0 }}
                    >
                      <Avatar
                        sx={{
                          width: 50,
                          height: 50,
                          fontWeight: 800,
                        }}
                      >
                        {initials(instructor)}
                      </Avatar>

                      <Box sx={{ minWidth: 0 }}>
                        <Typography
                          variant="h6"
                          fontWeight={800}
                          noWrap
                        >
                          {fullName(instructor)}
                        </Typography>
                        <Typography
                          variant="caption"
                          color="text.secondary"
                        >
                          {instructor.code ||
                            "Kod zostanie nadany"}
                        </Typography>
                      </Box>
                    </Stack>

                    {canManageInstructors && (
                      <Tooltip title="Więcej akcji">
                        <IconButton
                          onClick={(event) =>
                            openMenu(event, instructor)
                          }
                        >
                          <MoreVertRoundedIcon />
                        </IconButton>
                      </Tooltip>
                    )}
                  </Stack>

                  <Stack
                    direction="row"
                    spacing={1}
                    sx={{ mt: 2 }}
                  >
                    <Chip
                      size="small"
                      label={
                        instructor.status === "active"
                          ? "Aktywny"
                          : "Nieaktywny"
                      }
                      color={
                        instructor.status === "active"
                          ? "success"
                          : "default"
                      }
                    />

                    {instructor.specialization && (
                      <Chip
                        size="small"
                        variant="outlined"
                        label={instructor.specialization}
                      />
                    )}
                  </Stack>

                  <Divider sx={{ my: 2 }} />

                  <Stack spacing={1.25}>
                    <Stack direction="row" spacing={1.25}>
                      <PhoneRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography
                        variant="body2"
                        color={
                          instructor.phone
                            ? "text.primary"
                            : "text.secondary"
                        }
                      >
                        {instructor.phone || "Brak telefonu"}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <EmailRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography
                        variant="body2"
                        color={
                          instructor.email
                            ? "text.primary"
                            : "text.secondary"
                        }
                        sx={{ wordBreak: "break-word" }}
                      >
                        {instructor.email ||
                          "Brak adresu e-mail"}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <PaymentsRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography variant="body2">
                        {instructor.hourly_rate != null
                          ? `${instructor.hourly_rate.toLocaleString(
                              "pl-PL",
                            )} zł/h`
                          : "Brak stawki godzinowej"}
                      </Typography>
                    </Stack>

                    <Stack direction="row" spacing={1.25}>
                      <BadgeRoundedIcon
                        fontSize="small"
                        color="action"
                      />
                      <Typography
                        variant="body2"
                        color={
                          instructor.user_id
                            ? "success.main"
                            : "text.secondary"
                        }
                      >
                        {instructor.user_id
                          ? linkedUser
                            ? `${linkedUser.full_name} (${linkedUser.username})`
                            : "Konto jest powiązane"
                          : "Brak powiązanego konta"}
                      </Typography>
                    </Stack>
                  </Stack>

                  {canManageInstructors && (
                    <Button
                      fullWidth
                      variant="outlined"
                      startIcon={<EditRoundedIcon />}
                      onClick={() =>
                        openEditDialog(instructor)
                      }
                      sx={{ mt: 2.5 }}
                    >
                      Edytuj
                    </Button>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </Box>
      )}

      <Menu
        anchorEl={menuAnchor}
        open={Boolean(menuAnchor)}
        onClose={closeMenu}
      >
        <MenuItem
          onClick={() => {
            if (menuInstructor) {
              openEditDialog(menuInstructor);
            }
          }}
        >
          <EditRoundedIcon
            fontSize="small"
            sx={{ mr: 1.5 }}
          />
          Edytuj instruktora
        </MenuItem>

        {canManageUsers && (
          <MenuItem
            onClick={() => {
              if (menuInstructor) {
                openLinkDialog(menuInstructor);
              }
            }}
          >
            <LinkRoundedIcon
              fontSize="small"
              sx={{ mr: 1.5 }}
            />
            {menuInstructor?.user_id
              ? "Zmień konto"
              : "Powiąż konto"}
          </MenuItem>
        )}

        {canManageUsers && menuInstructor?.user_id && (
          <MenuItem
            onClick={() => {
              if (menuInstructor) {
                void unlinkAccount(menuInstructor);
              }
            }}
          >
            <UnlinkRoundedIcon
              fontSize="small"
              sx={{ mr: 1.5 }}
            />
            Odłącz konto
          </MenuItem>
        )}

        <Divider />

        <MenuItem
          sx={{ color: "error.main" }}
          onClick={() => {
            if (menuInstructor) {
              void removeInstructor(menuInstructor);
            }
          }}
        >
          <DeleteOutlineRoundedIcon
            fontSize="small"
            sx={{ mr: 1.5 }}
          />
          Usuń instruktora
        </MenuItem>
      </Menu>

      <Dialog
        open={formOpen}
        onClose={() => !saving && setFormOpen(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>
          {editingInstructor
            ? "Edytuj instruktora"
            : "Dodaj instruktora"}
        </DialogTitle>

        <DialogContent>
          <Box
            sx={{
              mt: 1,
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                md: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            <TextField
              label="Imię"
              value={form.first_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  first_name: event.target.value,
                }))
              }
              required
              autoFocus
            />

            <TextField
              label="Nazwisko"
              value={form.last_name}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  last_name: event.target.value,
                }))
              }
              required
            />

            <TextField
              label="Telefon"
              value={form.phone}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  phone: event.target.value,
                }))
              }
            />

            <TextField
              label="E-mail"
              type="email"
              value={form.email}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  email: event.target.value,
                }))
              }
            />

            <TextField
              label="Specjalizacja"
              value={form.specialization}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  specialization:
                    event.target.value,
                }))
              }
            />

            <TextField
              label="Stawka godzinowa"
              type="number"
              value={form.hourly_rate}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  hourly_rate: event.target.value,
                }))
              }
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    zł/h
                  </InputAdornment>
                ),
              }}
              inputProps={{ min: 0, step: "0.01" }}
            />

            <FormControl>
              <InputLabel>Status</InputLabel>
              <Select
                label="Status"
                value={form.status}
                onChange={(event) =>
                  setForm((current) => ({
                    ...current,
                    status: event.target.value,
                  }))
                }
              >
                <MenuItem value="active">
                  Aktywny
                </MenuItem>
                <MenuItem value="inactive">
                  Nieaktywny
                </MenuItem>
              </Select>
            </FormControl>

            <TextField
              label="Notatki"
              value={form.notes}
              onChange={(event) =>
                setForm((current) => ({
                  ...current,
                  notes: event.target.value,
                }))
              }
              multiline
              minRows={3}
              sx={{ gridColumn: { md: "1 / -1" } }}
            />
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, pb: 3 }}>
          <Button
            onClick={() => setFormOpen(false)}
            disabled={saving}
          >
            Anuluj
          </Button>
          <Button
            variant="contained"
            onClick={() => void saveInstructor()}
            disabled={saving}
            startIcon={
              saving ? (
                <CircularProgress
                  size={18}
                  color="inherit"
                />
              ) : (
                <BadgeRoundedIcon />
              )
            }
          >
            {editingInstructor
              ? "Zapisz zmiany"
              : "Dodaj instruktora"}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog
        open={linkDialogOpen}
        onClose={() => setLinkDialogOpen(false)}
        fullWidth
        maxWidth="sm"
      >
        <DialogTitle>
          Powiąż konto użytkownika
        </DialogTitle>

        <DialogContent>
          <Typography
            variant="body2"
            color="text.secondary"
            sx={{ mb: 2, mt: 1 }}
          >
            Instruktor:{" "}
            <strong>
              {linkingInstructor
                ? fullName(linkingInstructor)
                : ""}
            </strong>
          </Typography>

          <FormControl fullWidth>
            <InputLabel>Konto instruktora</InputLabel>
            <Select
              label="Konto instruktora"
              value={selectedUserId}
              onChange={(event) =>
                setSelectedUserId(
                  event.target.value === ""
                    ? ""
                    : Number(event.target.value),
                )
              }
            >
              {instructorUsers.map((user) => {
                const usedByAnotherInstructor =
                  instructors.some(
                    (instructor) =>
                      instructor.user_id === user.id &&
                      instructor.id !==
                        linkingInstructor?.id,
                  );

                return (
                  <MenuItem
                    key={user.id}
                    value={user.id}
                    disabled={usedByAnotherInstructor}
                  >
                    {user.full_name} ({user.username})
                    {usedByAnotherInstructor
                      ? " — konto już przypisane"
                      : ""}
                  </MenuItem>
                );
              })}
            </Select>
          </FormControl>

          {!instructorUsers.length && (
            <Alert severity="info" sx={{ mt: 2 }}>
              Brak aktywnych użytkowników z rolą Instruktor.
            </Alert>
          )}
        </DialogContent>

        <DialogActions>
          <Button
            onClick={() => setLinkDialogOpen(false)}
          >
            Anuluj
          </Button>
          <Button
            variant="contained"
            disabled={selectedUserId === ""}
            onClick={() => void linkAccount()}
          >
            Powiąż konto
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={message.open}
        autoHideDuration={4000}
        onClose={() =>
          setMessage((current) => ({
            ...current,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={message.severity}
          variant="filled"
          onClose={() =>
            setMessage((current) => ({
              ...current,
              open: false,
            }))
          }
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}