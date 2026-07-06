import {
  AppBar,
  Box,
  Card,
  CardContent,
  Divider,
  Drawer,
  Grid,
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

const drawerWidth = 260;

const menu = [
  { label: "Dashboard", icon: <DashboardIcon /> },
  { label: "Kalendarz", icon: <CalendarMonthIcon /> },
  { label: "Klienci", icon: <PeopleIcon /> },
  { label: "Konie", icon: <PetsIcon /> },
  { label: "Instruktorzy", icon: <SchoolIcon /> },
  { label: "Karnety", icon: <ConfirmationNumberIcon /> },
  { label: "Płatności", icon: <PaymentsIcon /> },
  { label: "Raporty", icon: <BarChartIcon /> },
];

const stats = [
  { label: "Dzisiejsze jazdy", value: "12" },
  { label: "Aktywni klienci", value: "43" },
  { label: "Konie", value: "18" },
  { label: "Dzisiejszy obrót", value: "1780 zł" },
];

function App() {
  return (
    <Box sx={{ display: "flex", minHeight: "100vh" }}>
      <AppBar
        position="fixed"
        elevation={0}
        sx={{
          zIndex: (theme) => theme.zIndex.drawer + 1,
          background: "#ffffff",
          color: "#1f2937",
          borderBottom: "1px solid #e5e7eb",
        }}
      >
        <Toolbar>
          <Typography variant="h6" fontWeight={800} sx={{ flexGrow: 1 }}>
            🐴 StableManager
          </Typography>
          <Typography variant="body2">Administrator</Typography>
        </Toolbar>
      </AppBar>

      <Drawer
        variant="permanent"
        sx={{
          width: drawerWidth,
          flexShrink: 0,
          [`& .MuiDrawer-paper`]: {
            width: drawerWidth,
            boxSizing: "border-box",
            borderRight: "1px solid #e5e7eb",
          },
        }}
      >
        <Toolbar />
        <Box sx={{ p: 2 }}>
          <Typography variant="caption" color="text.secondary">
            PANEL STAJNI
          </Typography>
        </Box>
        <Divider />
        <List sx={{ px: 1 }}>
          {menu.map((item, index) => (
            <ListItemButton
              key={item.label}
              selected={index === 0}
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

        <Typography variant="h4" fontWeight={800} gutterBottom>
          Dashboard
        </Typography>

        <Typography color="text.secondary" sx={{ mb: 3 }}>
          Podsumowanie pracy stajni na dziś.
        </Typography>

        <Grid container spacing={3}>
          {stats.map((stat) => (
            <Grid item xs={12} sm={6} md={3} key={stat.label}>
              <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
                <CardContent>
                  <Typography color="text.secondary" variant="body2">
                    {stat.label}
                  </Typography>
                  <Typography variant="h4" fontWeight={800} sx={{ mt: 1 }}>
                    {stat.value}
                  </Typography>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>

        <Card elevation={0} sx={{ mt: 3, border: "1px solid #e5e7eb" }}>
          <CardContent>
            <Typography variant="h6" fontWeight={700}>
              Najbliższa jazda
            </Typography>
            <Typography sx={{ mt: 2 }}>
              18:00 — Anna Kowalska / Koń: Aramis / Instruktor: Adam
            </Typography>
          </CardContent>
        </Card>
      </Box>
    </Box>
  );
}

export default App;