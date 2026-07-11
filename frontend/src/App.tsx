import { useState } from "react";
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

import { LoginPage } from "./pages/LoginPage";
import { ClientsPage } from "./pages/ClientsPage";
import { DashboardPage } from "./pages/DashboardPage";
import { HorsesPage } from "./pages/HorsesPage";
import { ScannerPage } from "./pages/ScannerPage";
import { InstructorsPage } from "./pages/InstructorsPage";
import { CalendarPage } from "./pages/CalendarPage";
import { PassesPage } from "./pages/PassesPage";

const drawerWidth = 260;

const menu = [
  { label: "Dashboard", path: "/dashboard", icon: <DashboardIcon /> },
  { label: "Kalendarz", path: "/calendar", icon: <CalendarMonthIcon /> },
  { label: "Klienci", path: "/clients", icon: <PeopleIcon /> },
  { label: "Konie", path: "/horses", icon: <PetsIcon /> },
  { label: "Instruktorzy", path: "/instructors", icon: <SchoolIcon /> },
  { label: "Karnety", path: "/passes", icon: <ConfirmationNumberIcon /> },
  { label: "Skaner", path: "/scanner", icon: <QrCodeScannerIcon /> },
  { label: "Płatności", path: "/payments", icon: <PaymentsIcon /> },
  { label: "Raporty", path: "/reports", icon: <BarChartIcon /> },
];

function PlaceholderPage({ title }: { title: string }) {
  return (
    <>
      <Typography variant="h4" fontWeight={800}>
        {title}
      </Typography>
      <Typography color="text.secondary">Ten moduł dodamy w kolejnym sprincie.</Typography>
    </>
  );
}

function App() {
  const [isLoggedIn, setIsLoggedIn] = useState(
    Boolean(localStorage.getItem("stable_token"))
  );

  function logout() {
    localStorage.removeItem("stable_token");
    setIsLoggedIn(false);
  }

  if (!isLoggedIn) {
    return <LoginPage onLogin={() => setIsLoggedIn(true)} />;
  }

  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar position="fixed" elevation={0} sx={{ zIndex: 1300, background: "#fff", color: "#1f2937", borderBottom: "1px solid #e5e7eb" }}>
        <Toolbar>
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
            🐴 StableManager
          </Typography>
          <Typography variant="body2" sx={{ mr: 2 }}>Administrator</Typography>
          <Button variant="outlined" size="small" onClick={logout}>Wyloguj</Button>
        </Toolbar>
      </AppBar>

      <Drawer variant="permanent" sx={{ width: drawerWidth, flexShrink: 0, [`& .MuiDrawer-paper`]: { width: drawerWidth, boxSizing: "border-box" } }}>
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">PANEL STAJNI</Typography>
        </Box>
        <Divider />
        <List sx={{ px: 1 }}>
          {menu.map((item) => (
            <ListItemButton
              key={item.path}
              component={NavLink}
              to={item.path}
              sx={{ borderRadius: 2, mb: 0.5 }}
            >
              <ListItemIcon>{item.icon}</ListItemIcon>
              <ListItemText primary={item.label} />
            </ListItemButton>
          ))}
        </List>
      </Drawer>

      <Box component="main" sx={{ flexGrow: 1, p: 4 }}>
        <Toolbar />
        <Routes>
          <Route path="/" element={<Navigate to="/dashboard" replace />} />
          <Route path="/dashboard" element={<DashboardPage />} />
          <Route path="/clients" element={<ClientsPage />} />
          <Route path="/horses" element={<HorsesPage />} />
          <Route path="/scanner" element={<ScannerPage />} />
          <Route path="/instructors" element={<InstructorsPage />} />
          <Route path="/passes" element={<PassesPage />} />
          <Route path="/payments" element={<PlaceholderPage title="Płatności" />} />
          <Route path="/reports" element={<PlaceholderPage title="Raporty" />} />
	  <Route path="/calendar" element={<CalendarPage />} />
        </Routes>
      </Box>
    </Box>
  );
}

export default App;