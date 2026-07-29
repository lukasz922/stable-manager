import type { ReactNode } from "react";
import { Navigate, NavLink, Route, Routes } from "react-router-dom";
import {
  AppBar,
  Box,
  Button,
  Divider,
  Drawer,
  List,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Toolbar,
  Typography,
} from "@mui/material";

import DashboardIcon from "@mui/icons-material/Dashboard";
import CalendarMonthIcon from "@mui/icons-material/CalendarMonth";
import PeopleIcon from "@mui/icons-material/People";
import PetsIcon from "@mui/icons-material/Pets";
import SchoolIcon from "@mui/icons-material/School";
import ConfirmationNumberIcon from "@mui/icons-material/ConfirmationNumber";
import PaymentsIcon from "@mui/icons-material/Payments";
import BarChartIcon from "@mui/icons-material/BarChart";
import QrCodeScannerIcon from "@mui/icons-material/QrCodeScanner";
import MeetingRoomIcon from "@mui/icons-material/MeetingRoom";
import ManageAccountsIcon from "@mui/icons-material/ManageAccounts";
import EventAvailableIcon from "@mui/icons-material/EventAvailable";
import SettingsSuggestIcon from "@mui/icons-material/SettingsSuggest";

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

const drawerWidth = 260;

interface MenuItem {
  label: string;
  path: string;
  icon: ReactNode;
  permission: string;
}

const menu: MenuItem[] = [
  {
    label: "Dashboard",
    path: "/dashboard",
    icon: <DashboardIcon />,
    permission: "dashboard.view",
  },
  {
    label: "Recepcja",
    path: "/reception",
    icon: <MeetingRoomIcon />,
    permission: "reception.view",
  },
  {
    label: "Kalendarz",
    path: "/calendar",
    icon: <CalendarMonthIcon />,
    permission: "calendar.view",
  },
  {
    label: "Klienci",
    path: "/clients",
    icon: <PeopleIcon />,
    permission: "clients.view",
  },
  {
    label: "Konie",
    path: "/horses",
    icon: <PetsIcon />,
    permission: "horses.view",
  },
  {
    label: "Instruktorzy",
    path: "/instructors",
    icon: <SchoolIcon />,
    permission: "instructors.view",
  },
  {
    label: "Grafik instruktorów",
    path: "/instructor-schedule",
    icon: <CalendarMonthIcon />,
    permission: "schedule.view",
  },
  {
    label: "Dyspozycyjność",
    path: "/instructor-availability",
    icon: <EventAvailableIcon />,
    permission: "availability.manage",
  },
  {
    label: "Karnety",
    path: "/passes",
    icon: <ConfirmationNumberIcon />,
    permission: "passes.view",
  },
  {
    label: "Skaner",
    path: "/scanner",
    icon: <QrCodeScannerIcon />,
    permission: "scanner.use",
  },
  {
    label: "Użytkownicy",
    path: "/users",
    icon: <ManageAccountsIcon />,
    permission: "users.manage",
  },
  {
    label: "Role i uprawnienia",
    path: "/roles-permissions",
    icon: <SettingsSuggestIcon />,
    permission: "roles.manage",
  },
  {
    label: "Płatności",
    path: "/payments",
    icon: <PaymentsIcon />,
    permission: "payments.view",
  },
  {
    label: "Raporty",
    path: "/reports",
    icon: <BarChartIcon />,
    permission: "reports.view",
  },
  {
    label: "Mój panel",
    path: "/instructor-panel",
    icon: <SchoolIcon />,
    permission: "instructor.panel",
  },
];

function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <Typography variant="h4" fontWeight={800}>
        {title}
      </Typography>

      <Typography color="text.secondary">
        Ten moduł dodamy w kolejnym sprincie.
      </Typography>
    </>
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
    permissions.includes(permission)
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
    permissions.includes(item.permission)
  );
  const homePath = getHomePath(permissions);

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: 1300,
          background: "#fff",
          color: "#1f2937",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Toolbar>
          <Typography
            variant="h6"
            fontWeight={800}
            sx={{ flexGrow: 1 }}
          >
            🐴 StableManager
          </Typography>

          <Box sx={{ textAlign: "right", mr: 2 }}>
            <Typography variant="body2" fontWeight={700}>
              {user?.full_name || user?.username}
            </Typography>

            <Typography variant="caption" color="text.secondary">
              {getRoleLabel(user?.role)}
            </Typography>
          </Box>

          <Button
            variant="outlined"
            size="small"
            onClick={logout}
          >
            Wyloguj
          </Button>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          "& .MuiDrawer-paper": {
            width: drawerWidth,
            boxSizing: "border-box",
          },
        }}
      >
        <Toolbar />

        <Box sx={{ p: 2 }}>
          <Typography
            variant="caption"
            color="text.secondary"
          >
            PANEL STAJNI
          </Typography>
        </Box>

        <Divider />

        <List sx={{ px: 1 }}>
          {visibleMenu.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{
                borderRadius: 2,
                mb: 0.5,
                "&.active": {
                  backgroundColor: "action.selected",
                  color: "primary.main",
                },
              }}
            >
              <ListItemIcon>
                {item.icon}
              </ListItemIcon>

              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: 4,
        }}
      >
        <Toolbar />

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
  );
}

export default App;