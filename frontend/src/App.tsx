import { useState, type ReactNode } from "react";
import {
  Navigate,
  NavLink,
  Route,
  Routes,
} from "react-router-dom";
import {
  AppBar,
  Avatar,
  Box,
  Button,
  Divider,
  Drawer,
  IconButton,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Tooltip,
  Typography,
  useMediaQuery,
  useTheme,
} from "@mui/material";

import MenuRoundedIcon from "@mui/icons-material/MenuRounded";
import DashboardRoundedIcon from "@mui/icons-material/DashboardRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import PaymentsRoundedIcon from "@mui/icons-material/PaymentsRounded";
import BarChartRoundedIcon from "@mui/icons-material/BarChartRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";
import MeetingRoomRoundedIcon from "@mui/icons-material/MeetingRoomRounded";
import ManageAccountsRoundedIcon from "@mui/icons-material/ManageAccountsRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import SettingsSuggestRoundedIcon from "@mui/icons-material/SettingsSuggestRounded";
import LogoutRoundedIcon from "@mui/icons-material/LogoutRounded";

import { LoginPage } from "./pages/LoginPage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HorsesPage } from "./pages/HorsesPage";
import { ScannerPage } from "./pages/ScannerPage";
import { InstructorsPage } from "./pages/InstructorsPage";
import { InstructorSchedulePage } from "./pages/InstructorSchedulePage";
import { CalendarPage } from "./pages/CalendarPage";
import { PassesPage } from "./pages/PassesPage";
import { ReceptionPage } from "./pages/ReceptionPage";
import ReportsPage from "./pages/ReportsPage";
import UsersPage from "./pages/UsersPage";
import { InstructorAvailabilityRequestsPage } from "./pages/InstructorAvailabilityRequestsPage";
import { InstructorPanelPage } from "./pages/InstructorPanelPage";
import { RolesPermissionsPage } from "./pages/RolesPermissionsPage";

import { useAuth } from "./auth/AuthContext";

const drawerWidth = 280;

type MenuSection =
  | "Główne"
  | "Organizacja"
  | "Obsługa"
  | "Administracja"
  | "Instruktor";

interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
  permission: string;
  section: MenuSection;
}

const menu: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardRoundedIcon />,
    permission: "dashboard.view",
    section: "Główne",
  },
  {
    label: "Recepcja",
    path: "/reception",
    icon: <MeetingRoomRoundedIcon />,
    permission: "reception.view",
    section: "Główne",
  },
  {
    label: "Kalendarz",
    path: "/calendar",
    icon: <CalendarMonthRoundedIcon />,
    permission: "calendar.view",
    section: "Główne",
  },
  {
    label: "Klienci",
    path: "/clients",
    icon: <PeopleRoundedIcon />,
    permission: "clients.view",
    section: "Organizacja",
  },
  {
    label: "Konie",
    path: "/horses",
    icon: <PetsRoundedIcon />,
    permission: "horses.view",
    section: "Organizacja",
  },
  {
    label: "Instruktorzy",
    path: "/instructors",
    icon: <SchoolRoundedIcon />,
    permission: "instructors.view",
    section: "Organizacja",
  },
  {
    label: "Grafik instruktorów",
    path: "/instructor-schedule",
    icon: <CalendarMonthRoundedIcon />,
    permission: "schedule.view",
    section: "Organizacja",
  },
  {
    label: "Dyspozycyjność",
    path: "/instructor-availability",
    icon: <EventAvailableRoundedIcon />,
    permission: "availability.manage",
    section: "Organizacja",
  },
  {
    label: "Karnety",
    path: "/passes",
    icon: <ConfirmationNumberRoundedIcon />,
    permission: "passes.view",
    section: "Obsługa",
  },
  {
    label: "Skaner RFID",
    path: "/scanner",
    icon: <QrCodeScannerRoundedIcon />,
    permission: "scanner.use",
    section: "Obsługa",
  },
  {
    label: "Płatności",
    path: "/payments",
    icon: <PaymentsRoundedIcon />,
    permission: "payments.view",
    section: "Obsługa",
  },
  {
    label: "Raporty",
    path: "/reports",
    icon: <BarChartRoundedIcon />,
    permission: "reports.view",
    section: "Obsługa",
  },
  {
    label: "Użytkownicy",
    path: "/users",
    icon: <ManageAccountsRoundedIcon />,
    permission: "users.manage",
    section: "Administracja",
  },
  {
    label: "Role i uprawnienia",
    path: "/roles-permissions",
    icon: <SettingsSuggestRoundedIcon />,
    permission: "roles.manage",
    section: "Administracja",
  },
  {
    label: "Mój panel",
    path: "/instructor-panel",
    icon: <SchoolRoundedIcon />,
    permission: "instructor.panel",
    section: "Instruktor",
  },
];

const sectionOrder: MenuSection[] = [
  "Główne",
  "Organizacja",
  "Obsługa",
  "Administracja",
  "Instruktor",
];

function PlaceholderPage({ title }: { title: string }) {
  return (
    <Box>
      <Typography variant="h4" fontWeight={800}>
        {title}
      </Typography>

      <Typography color="text.secondary" sx={{ mt: 1 }}>
        Ten moduł dodamy w kolejnym etapie.
      </Typography>
    </Box>
  );
}

function AccessDeniedPage() {
  return (
    <Box>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Brak dostępu
      </Typography>

      <Typography color="text.secondary">
        Twoje konto nie ma uprawnień do żadnego modułu.
        Skontaktuj się z administratorem.
      </Typography>
    </Box>
  );
}

function getRoleLabel(role?: string) {
  switch (role) {
    case "admin":
      return "Administrator";
    case "reception":
      return "Recepcja";
    case "instructor":
      return "Instruktor";
    case "viewer":
      return "Podgląd";
    default:
      return role || "";
  }
}

function getInitials(value?: string) {
  if (!value) {
    return "SM";
  }

  return value
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function getHomePath(permissions: string[]) {
  const preferredRoutes: Array<[string, string]> = [
    ["instructor.panel", "/instructor-panel"],
    ["dashboard.view", "/dashboard"],
    ["reception.view", "/reception"],
    ["calendar.view", "/calendar"],
    ["clients.view", "/clients"],
    ["horses.view", "/horses"],
    ["instructors.view", "/instructors"],
    ["schedule.view", "/instructor-schedule"],
    ["passes.view", "/passes"],
    ["scanner.use", "/scanner"],
    ["availability.manage", "/instructor-availability"],
    ["users.manage", "/users"],
    ["roles.manage", "/roles-permissions"],
    ["payments.view", "/payments"],
    ["reports.view", "/reports"],
  ];

  const match = preferredRoutes.find(([permission]) =>
    permissions.includes(permission),
  );

  return match?.[1] ?? "/no-access";
}

function PermissionRoute({
  permission,
  permissions,
  children,
}: {
  permission: string;
  permissions: string[];
  children: ReactNode;
}) {
  if (!permissions.includes(permission)) {
    return (
      <Navigate
        to={getHomePath(permissions)}
        replace
      />
    );
  }

  return <>{children}</>;
}

function App() {
  const theme = useTheme();
  const isDesktop = useMediaQuery(theme.breakpoints.up("lg"));
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const {
    user,
    isAuthenticated,
    login,
    logout,
  } = useAuth();

  if (!isAuthenticated) {
    return <LoginPage onLogin={login} />;
  }

  const permissions = user?.permissions ?? [];
  const visibleMenu = menu.filter((item) =>
    permissions.includes(item.permission),
  );
  const homePath = getHomePath(permissions);
  const displayName = user?.full_name || user?.username || "Użytkownik";

  const drawerContent = (
    <Box
      sx={{
        height: "100%",
        display: "flex",
        flexDirection: "column",
        bgcolor: "#fff",
      }}
    >
      <Toolbar
        sx={{
          minHeight: "72px !important",
          px: 2.5,
          gap: 1.5,
        }}
      >
        <Box
          sx={{
            width: 42,
            height: 42,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            color: "primary.main",
            bgcolor: "primary.main",
            background:
              "linear-gradient(135deg, rgba(37,99,235,1), rgba(124,58,237,1))",
            boxShadow: "0 10px 24px rgba(79, 70, 229, 0.24)",
          }}
        >
          <PetsRoundedIcon sx={{ color: "#fff" }} />
        </Box>

        <Box>
          <Typography fontWeight={900} lineHeight={1.1}>
            StableManager
          </Typography>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            Zarządzanie stajnią
          </Typography>
        </Box>
      </Toolbar>

      <Divider />

      <Box
        sx={{
          flex: 1,
          overflowY: "auto",
          px: 1.5,
          py: 2,
        }}
      >
        {sectionOrder.map((section) => {
          const sectionItems = visibleMenu.filter(
            (item) => item.section === section,
          );

          if (sectionItems.length === 0) {
            return null;
          }

          return (
            <Box key={section} sx={{ mb: 2 }}>
              <Typography
                variant="caption"
                fontWeight={800}
                color="text.secondary"
                sx={{
                  display: "block",
                  px: 1.5,
                  mb: 0.75,
                  letterSpacing: "0.08em",
                  textTransform: "uppercase",
                }}
              >
                {section}
              </Typography>

              <List disablePadding>
                {sectionItems.map((item) => (
                  <ListItemButton
                    key={item.path}
                    component={NavLink}
                    to={item.path}
                    onClick={() => setMobileMenuOpen(false)}
                    sx={{
                      minHeight: 46,
                      borderRadius: 3,
                      mb: 0.5,
                      px: 1.5,
                      color: "text.secondary",
                      transition:
                        "background-color 160ms ease, color 160ms ease, transform 160ms ease",
                      "& .MuiListItemIcon-root": {
                        minWidth: 40,
                        color: "inherit",
                      },
                      "&:hover": {
                        bgcolor: "action.hover",
                        color: "text.primary",
                        transform: "translateX(2px)",
                      },
                      "&.active": {
                        color: "primary.main",
                        bgcolor: "rgba(37, 99, 235, 0.09)",
                        fontWeight: 800,
                        "&::before": {
                          content: '""',
                          position: "absolute",
                          left: 0,
                          top: 8,
                          bottom: 8,
                          width: 4,
                          borderRadius: "0 8px 8px 0",
                          bgcolor: "primary.main",
                        },
                      },
                    }}
                  >
                    <ListItemIcon>
                      {item.icon}
                    </ListItemIcon>

                    <ListItemText
                      primary={item.label}
                      primaryTypographyProps={{
                        fontSize: 14,
                        fontWeight: 700,
                      }}
                    />
                  </ListItemButton>
                ))}
              </List>
            </Box>
          );
        })}
      </Box>

      <Box sx={{ p: 2 }}>
        <Box
          sx={{
            p: 1.5,
            borderRadius: 3,
            bgcolor: "grey.50",
            border: "1px solid",
            borderColor: "divider",
            display: "flex",
            alignItems: "center",
            gap: 1.25,
          }}
        >
          <Avatar
            sx={{
              width: 38,
              height: 38,
              fontSize: 14,
              fontWeight: 800,
            }}
          >
            {getInitials(displayName)}
          </Avatar>

          <Box sx={{ minWidth: 0, flex: 1 }}>
            <Typography
              variant="body2"
              fontWeight={800}
              noWrap
            >
              {displayName}
            </Typography>
            <Typography
              variant="caption"
              color="text.secondary"
              noWrap
            >
              {getRoleLabel(user?.role)}
            </Typography>
          </Box>

          <Tooltip title="Wyloguj">
            <IconButton
              size="small"
              onClick={logout}
              aria-label="Wyloguj"
            >
              <LogoutRoundedIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>
    </Box>
  );

  return (
    <Box
      sx={{
        display: "flex",
        minHeight: "100vh",
        bgcolor: "#f5f7fb",
      }}
    >
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (muiTheme) =>
            muiTheme.zIndex.drawer + 1,
          bgcolor: "rgba(255,255,255,0.92)",
          color: "text.primary",
          borderBottom: "1px solid",
          borderColor: "divider",
          backdropFilter: "blur(14px)",
          ml: isDesktop ? `${drawerWidth}px` : 0,
          width: isDesktop
            ? `calc(100% - ${drawerWidth}px)`
            : "100%",
        }}
      >
        <Toolbar
          sx={{
            minHeight: "72px !important",
            px: { xs: 2, sm: 3 },
          }}
        >
          {!isDesktop && (
            <IconButton
              edge="start"
              onClick={() => setMobileMenuOpen(true)}
              sx={{ mr: 1 }}
              aria-label="Otwórz menu"
            >
              <MenuRoundedIcon />
            </IconButton>
          )}

          <Box sx={{ flexGrow: 1 }}>
            <Typography
              variant="body2"
              color="text.secondary"
            >
              Panel stajni
            </Typography>
            <Typography
              variant="subtitle1"
              fontWeight={800}
            >
              Witaj, {displayName}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            startIcon={<LogoutRoundedIcon />}
            onClick={logout}
            sx={{
              display: { xs: "none", sm: "inline-flex" },
              borderRadius: 2.5,
              textTransform: "none",
              fontWeight: 700,
            }}
          >
            Wyloguj
          </Button>
        </Toolbar>
      </AppBar>

      <Box
        component="nav"
        sx={{
          width: { lg: drawerWidth },
          flexShrink: { lg: 0 },
        }}
      >
        <Drawer
          variant={isDesktop ? "permanent" : "temporary"}
          open={isDesktop || mobileMenuOpen}
          onClose={() => setMobileMenuOpen(false)}
          ModalProps={{ keepMounted: true }}
          sx={{
            "& .MuiDrawer-paper": {
              width: drawerWidth,
              boxSizing: "border-box",
              borderRight: "1px solid",
              borderColor: "divider",
            },
          }}
        >
          {drawerContent}
        </Drawer>
      </Box>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          minWidth: 0,
          px: { xs: 2, sm: 3, xl: 4 },
          pb: 4,
        }}
      >
        <Toolbar sx={{ minHeight: "72px !important" }} />

        <Box
          sx={{
            width: "100%",
            maxWidth: 1800,
            mx: "auto",
            pt: { xs: 2, sm: 3 },
          }}
        >
          <Routes>
            <Route
              path="/"
              element={<Navigate to={homePath} replace />}
            />

            <Route
              path="/dashboard"
              element={
                <PermissionRoute
                  permission="dashboard.view"
                  permissions={permissions}
                >
                  <DashboardPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/reception"
              element={
                <PermissionRoute
                  permission="reception.view"
                  permissions={permissions}
                >
                  <ReceptionPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/calendar"
              element={
                <PermissionRoute
                  permission="calendar.view"
                  permissions={permissions}
                >
                  <CalendarPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/clients"
              element={
                <PermissionRoute
                  permission="clients.view"
                  permissions={permissions}
                >
                  <ClientsPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/horses"
              element={
                <PermissionRoute
                  permission="horses.view"
                  permissions={permissions}
                >
                  <HorsesPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/instructors"
              element={
                <PermissionRoute
                  permission="instructors.view"
                  permissions={permissions}
                >
                  <InstructorsPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/instructor-schedule"
              element={
                <PermissionRoute
                  permission="schedule.view"
                  permissions={permissions}
                >
                  <InstructorSchedulePage />
                </PermissionRoute>
              }
            />

            <Route
              path="/passes"
              element={
                <PermissionRoute
                  permission="passes.view"
                  permissions={permissions}
                >
                  <PassesPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/scanner"
              element={
                <PermissionRoute
                  permission="scanner.use"
                  permissions={permissions}
                >
                  <ScannerPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/instructor-availability"
              element={
                <PermissionRoute
                  permission="availability.manage"
                  permissions={permissions}
                >
                  <InstructorAvailabilityRequestsPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/users"
              element={
                <PermissionRoute
                  permission="users.manage"
                  permissions={permissions}
                >
                  <UsersPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/roles-permissions"
              element={
                <PermissionRoute
                  permission="roles.manage"
                  permissions={permissions}
                >
                  <RolesPermissionsPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/payments"
              element={
                <PermissionRoute
                  permission="payments.view"
                  permissions={permissions}
                >
                  <PlaceholderPage title="Płatności" />
                </PermissionRoute>
              }
            />

            <Route
              path="/reports"
              element={
                <PermissionRoute
                  permission="reports.view"
                  permissions={permissions}
                >
                  <ReportsPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/instructor-panel"
              element={
                <PermissionRoute
                  permission="instructor.panel"
                  permissions={permissions}
                >
                  <InstructorPanelPage />
                </PermissionRoute>
              }
            />

            <Route
              path="/no-access"
              element={<AccessDeniedPage />}
            />

            <Route
              path="*"
              element={<Navigate to={homePath} replace />}
            />
          </Routes>
        </Box>
      </Box>
    </Box>
  );
}

export default App;