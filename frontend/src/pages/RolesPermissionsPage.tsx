import { useEffect, useMemo, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Checkbox,
  Chip,
  CircularProgress,
  Divider,
  FormControlLabel,
  Paper,
  Snackbar,
  Stack,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";
import AdminPanelSettingsRoundedIcon from "@mui/icons-material/AdminPanelSettingsRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import SaveRoundedIcon from "@mui/icons-material/SaveRounded";
import SecurityRoundedIcon from "@mui/icons-material/SecurityRounded";

import {
  getPermissions,
  getRoles,
  updateRolePermissions,
  type Permission,
  type Role,
} from "../api/roles";

const moduleLabels: Record<string, string> = {
  dashboard: "Dashboard",
  reception: "Recepcja",
  calendar: "Kalendarz",
  clients: "Klienci",
  horses: "Konie",
  instructors: "Instruktorzy",
  schedule: "Grafik instruktorów",
  availability: "Dyspozycyjność",
  passes: "Karnety",
  scanner: "Skaner",
  users: "Użytkownicy",
  roles: "Role i uprawnienia",
  payments: "Płatności",
  reports: "Raporty",
  instructor: "Panel instruktora",
};

const roleDescriptions: Record<string, string> = {
  admin: "Pełny dostęp administracyjny do systemu.",
  reception: "Obsługa klientów, jazd, karnetów i recepcji.",
  instructor: "Dostęp wyłącznie do panelu instruktora.",
};

type MessageState = {
  open: boolean;
  text: string;
  severity: "success" | "error" | "info";
};

export function RolesPermissionsPage() {
  const [roles, setRoles] = useState<Role[]>([]);
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [selectedRoleId, setSelectedRoleId] = useState<number | null>(null);
  const [selectedCodes, setSelectedCodes] = useState<string[]>([]);
  const [initialCodes, setInitialCodes] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState<MessageState>({
    open: false,
    text: "",
    severity: "info",
  });

  const selectedRole = useMemo(
    () => roles.find((role) => role.id === selectedRoleId) ?? null,
    [roles, selectedRoleId],
  );

  const groupedPermissions = useMemo(() => {
    const groups: Record<string, Permission[]> = {};

    for (const permission of permissions) {
      groups[permission.module] ??= [];
      groups[permission.module].push(permission);
    }

    return Object.entries(groups).sort(([a], [b]) =>
      (moduleLabels[a] ?? a).localeCompare(moduleLabels[b] ?? b, "pl"),
    );
  }, [permissions]);

  const hasChanges = useMemo(() => {
    const current = [...selectedCodes].sort();
    const initial = [...initialCodes].sort();

    return (
      current.length !== initial.length ||
      current.some((code, index) => code !== initial[index])
    );
  }, [selectedCodes, initialCodes]);

  useEffect(() => {
    async function loadData() {
      try {
        setLoading(true);

        const [rolesData, permissionsData] = await Promise.all([
          getRoles(),
          getPermissions(),
        ]);

        setRoles(rolesData);
        setPermissions(permissionsData);

        const firstRole = rolesData[0] ?? null;
        const codes =
          firstRole?.permissions.map((permission) => permission.code) ?? [];

        setSelectedRoleId(firstRole?.id ?? null);
        setSelectedCodes(codes);
        setInitialCodes(codes);
      } catch (error) {
        setMessage({
          open: true,
          text:
            error instanceof Error
              ? error.message
              : "Nie udało się pobrać ról i uprawnień.",
          severity: "error",
        });
      } finally {
        setLoading(false);
      }
    }

    void loadData();
  }, []);

  function handleRoleChange(roleId: number) {
    const role = roles.find((item) => item.id === roleId);
    const codes =
      role?.permissions.map((permission) => permission.code) ?? [];

    setSelectedRoleId(roleId);
    setSelectedCodes(codes);
    setInitialCodes(codes);
  }

  function isPermissionLocked(permission: Permission) {
    if (!selectedRole) return true;

    if (permission.code === "instructor.panel") {
      return selectedRole.code !== "instructor";
    }

    if (
      selectedRole.code === "instructor" &&
      permission.code !== "instructor.panel"
    ) {
      return true;
    }

    return (
      selectedRole.code === "admin" &&
      permission.code === "roles.manage"
    );
  }

  function togglePermission(permission: Permission) {
    if (isPermissionLocked(permission)) return;

    setSelectedCodes((current) =>
      current.includes(permission.code)
        ? current.filter((code) => code !== permission.code)
        : [...current, permission.code].sort(),
    );
  }

  function toggleModule(modulePermissions: Permission[]) {
    const editable = modulePermissions.filter(
      (permission) => !isPermissionLocked(permission),
    );

    if (!editable.length) return;

    const allSelected = editable.every((permission) =>
      selectedCodes.includes(permission.code),
    );

    setSelectedCodes((current) => {
      if (allSelected) {
        const toRemove = new Set(
          editable.map((permission) => permission.code),
        );
        return current.filter((code) => !toRemove.has(code));
      }

      return Array.from(
        new Set([
          ...current,
          ...editable.map((permission) => permission.code),
        ]),
      ).sort();
    });
  }

  async function handleSave() {
    if (!selectedRoleId || !selectedRole) return;

    try {
      setSaving(true);

      const updatedRole = await updateRolePermissions(
        selectedRoleId,
        selectedCodes,
      );

      setRoles((current) =>
        current.map((role) =>
          role.id === updatedRole.id ? updatedRole : role,
        ),
      );

      const codes = updatedRole.permissions.map(
        (permission) => permission.code,
      );

      setSelectedCodes(codes);
      setInitialCodes(codes);

      setMessage({
        open: true,
        text: `Uprawnienia roli „${updatedRole.name}” zostały zapisane.`,
        severity: "success",
      });
    } catch (error) {
      setMessage({
        open: true,
        text:
          error instanceof Error
            ? error.message
            : "Nie udało się zapisać uprawnień.",
        severity: "error",
      });
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <Box sx={{ minHeight: 400, display: "grid", placeItems: "center" }}>
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
          <Stack direction="row" spacing={1.25} alignItems="center">
            <AdminPanelSettingsRoundedIcon color="primary" sx={{ fontSize: 36 }} />
            <Typography variant="h4" fontWeight={900}>
              Role i uprawnienia
            </Typography>
          </Stack>

          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Określ, które moduły i operacje są dostępne dla każdej roli.
          </Typography>
        </Box>

        <Button
          variant="contained"
          startIcon={
            saving ? (
              <CircularProgress size={18} color="inherit" />
            ) : (
              <SaveRoundedIcon />
            )
          }
          onClick={() => void handleSave()}
          disabled={!selectedRole || !hasChanges || saving}
          sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 800 }}
        >
          {saving ? "Zapisywanie..." : "Zapisz uprawnienia"}
        </Button>
      </Stack>

      <Paper
        elevation={0}
        sx={{
          mb: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
          overflow: "hidden",
        }}
      >
        <Tabs
          value={selectedRoleId}
          onChange={(_, value) => handleRoleChange(value)}
          variant="scrollable"
          scrollButtons="auto"
          sx={{
            px: 1,
            "& .MuiTab-root": {
              minHeight: 64,
              textTransform: "none",
              fontWeight: 800,
            },
          }}
        >
          {roles.map((role) => (
            <Tab
              key={role.id}
              value={role.id}
              label={
                <Stack direction="row" spacing={1} alignItems="center">
                  <SecurityRoundedIcon fontSize="small" />
                  <span>{role.name}</span>
                  <Chip
                    size="small"
                    label={role.permissions.length}
                    variant="outlined"
                  />
                </Stack>
              }
            />
          ))}
        </Tabs>
      </Paper>

      {selectedRole && (
        <>
          <Card
            elevation={0}
            sx={{
              mb: 3,
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 4,
            }}
          >
            <CardContent sx={{ p: 2.5 }}>
              <Stack
                direction={{ xs: "column", sm: "row" }}
                justifyContent="space-between"
                spacing={2}
              >
                <Box>
                  <Typography variant="h6" fontWeight={900}>
                    {selectedRole.name}
                  </Typography>
                  <Typography color="text.secondary">
                    {roleDescriptions[selectedRole.code] ??
                      "Zarządzaj dostępem tej roli."}
                  </Typography>
                </Box>

                <Stack direction="row" spacing={1} flexWrap="wrap">
                  <Chip
                    label={`${selectedCodes.length} uprawnień`}
                    color="primary"
                    variant="outlined"
                  />
                  {hasChanges && (
                    <Chip label="Niezapisane zmiany" color="warning" />
                  )}
                </Stack>
              </Stack>
            </CardContent>
          </Card>

          {selectedRole.code === "instructor" && (
            <Alert severity="info" sx={{ mb: 3 }}>
              Rola instruktora ma dostęp wyłącznie do panelu instruktora.
            </Alert>
          )}

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                lg: "repeat(2, minmax(0, 1fr))",
              },
              gap: 2,
            }}
          >
            {groupedPermissions.map(([module, modulePermissions]) => {
              const editablePermissions = modulePermissions.filter(
                (permission) => !isPermissionLocked(permission),
              );

              const selectedInModule = modulePermissions.filter(
                (permission) => selectedCodes.includes(permission.code),
              ).length;

              const allEditableSelected =
                editablePermissions.length > 0 &&
                editablePermissions.every((permission) =>
                  selectedCodes.includes(permission.code),
                );

              return (
                <Card
                  key={module}
                  elevation={0}
                  sx={{
                    border: "1px solid",
                    borderColor: "divider",
                    borderRadius: 4,
                  }}
                >
                  <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
                    <Stack
                      direction="row"
                      justifyContent="space-between"
                      alignItems="center"
                      spacing={2}
                    >
                      <Box>
                        <Typography variant="h6" fontWeight={900}>
                          {moduleLabels[module] ?? module}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {selectedInModule} z {modulePermissions.length} aktywnych
                        </Typography>
                      </Box>

                      {editablePermissions.length > 0 && (
                        <Button
                          size="small"
                          onClick={() => toggleModule(modulePermissions)}
                        >
                          {allEditableSelected
                            ? "Odznacz moduł"
                            : "Zaznacz moduł"}
                        </Button>
                      )}
                    </Stack>

                    <Divider sx={{ my: 2 }} />

                    <Stack spacing={0.75}>
                      {modulePermissions.map((permission) => {
                        const disabled = isPermissionLocked(permission);

                        return (
                          <Paper
                            key={permission.id}
                            elevation={0}
                            sx={{
                              px: 1.25,
                              py: 0.75,
                              bgcolor: disabled
                                ? "action.disabledBackground"
                                : "transparent",
                              borderRadius: 2.5,
                            }}
                          >
                            <FormControlLabel
                              sx={{ m: 0, width: "100%" }}
                              control={
                                <Checkbox
                                  checked={selectedCodes.includes(
                                    permission.code,
                                  )}
                                  onChange={() => togglePermission(permission)}
                                  disabled={disabled}
                                />
                              }
                              label={
                                <Box sx={{ py: 0.25 }}>
                                  <Stack
                                    direction="row"
                                    spacing={1}
                                    alignItems="center"
                                  >
                                    <Typography fontWeight={700}>
                                      {permission.name}
                                    </Typography>

                                    {selectedCodes.includes(permission.code) && (
                                      <CheckCircleRoundedIcon
                                        color="success"
                                        sx={{ fontSize: 17 }}
                                      />
                                    )}
                                  </Stack>

                                  <Typography
                                    variant="caption"
                                    color="text.secondary"
                                  >
                                    {permission.code}
                                  </Typography>
                                </Box>
                              }
                            />
                          </Paper>
                        );
                      })}
                    </Stack>
                  </CardContent>
                </Card>
              );
            })}
          </Box>

          <Stack
            direction={{ xs: "column", sm: "row" }}
            justifyContent="flex-end"
            spacing={1.5}
            sx={{ mt: 3 }}
          >
            <Button
              variant="outlined"
              disabled={!hasChanges || saving}
              onClick={() => setSelectedCodes(initialCodes)}
            >
              Cofnij zmiany
            </Button>

            <Button
              variant="contained"
              startIcon={
                saving ? (
                  <CircularProgress size={18} color="inherit" />
                ) : (
                  <SaveRoundedIcon />
                )
              }
              onClick={() => void handleSave()}
              disabled={!hasChanges || saving}
            >
              {saving ? "Zapisywanie..." : "Zapisz uprawnienia"}
            </Button>
          </Stack>
        </>
      )}

      <Snackbar
        open={message.open}
        autoHideDuration={5000}
        onClose={() =>
          setMessage((current) => ({ ...current, open: false }))
        }
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={message.severity}
          variant="filled"
          onClose={() =>
            setMessage((current) => ({ ...current, open: false }))
          }
        >
          {message.text}
        </Alert>
      </Snackbar>
    </Box>
  );
}