import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  Grid,
  Snackbar,
  Typography,
} from "@mui/material";

import { api } from "../api/client";
import DashboardAlert from "../components/DashboardAlert";
import DashboardCard from "../components/DashboardCard";

type SnackbarState = {
  open: boolean;
  message: string;
  severity: "success" | "error";
};

type TodayRide = {
  id: number;
  start_time: string;
  status: string;
  client: string;
  horse: string;
};

type DashboardStats = {
  clients_count: number;
  horses_count: number;
  rides_today: number;
  checked_in_today: number;
  completed_today: number;
  planned_today: number;
  expiring_passes: number;
  rides_next_hour: number;
  today_rides: TodayRide[];
};

const initialStats: DashboardStats = {
  clients_count: 0,
  horses_count: 0,
  rides_today: 0,
  checked_in_today: 0,
  completed_today: 0,
  planned_today: 0,
  expiring_passes: 0,
  rides_next_hour: 0,
  today_rides: [],
};

const statusMap = {
  planned: { label: "Zaplanowana", color: "primary" as const },
  checked_in: { label: "Odbity", color: "warning" as const },
  completed: { label: "Odbyta", color: "success" as const },
  cancelled: { label: "Anulowana", color: "error" as const },
};

export function DashboardPage() {
  const [stats, setStats] = useState<DashboardStats>(initialStats);
  const [snackbar, setSnackbar] = useState<SnackbarState>({
    open: false,
    message: "",
    severity: "success",
  });

  async function loadStats() {
    try {
      const response = await api.get<DashboardStats>("/dashboard/stats");
      setStats(response.data);
    } catch (error) {
      console.error("Nie udało się pobrać statystyk dashboardu:", error);
    }
  }

  async function updateRideStatus(rideId: number, newStatus: string) {
    try {
      await api.patch(`/rides/${rideId}/status`, { status: newStatus });
      await loadStats();

      setSnackbar({
        open: true,
        message:
          newStatus === "checked_in"
            ? "Jazda została odbita."
            : "Jazda została zakończona.",
        severity: "success",
      });
    } catch (error) {
      console.error("Nie udało się zmienić statusu jazdy:", error);
      setSnackbar({
        open: true,
        message: "Nie udało się zmienić statusu jazdy.",
        severity: "error",
      });
    }
  }

  useEffect(() => {
    loadStats();
    const interval = window.setInterval(loadStats, 30_000);
    return () => window.clearInterval(interval);
  }, []);

  return (
    <>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Dashboard
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Podsumowanie pracy stajni na dziś.
      </Typography>

      <Grid container spacing={3}>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard icon="👥" title="Klienci" value={stats.clients_count} color="#1976d2" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard icon="🐴" title="Konie" value={stats.horses_count} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard icon="📅" title="Jazdy dzisiaj" value={stats.rides_today} color="#ed6c02" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard icon="📡" title="Odbicia RFID" value={stats.checked_in_today} color="#9c27b0" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard icon="🟢" title="Odbyte" value={stats.completed_today} color="#2e7d32" />
        </Grid>
        <Grid item xs={12} sm={6} md={4}>
          <DashboardCard icon="🔵" title="Zaplanowane" value={stats.planned_today} color="#0288d1" />
        </Grid>
      </Grid>

      <DashboardAlert title="Wymaga uwagi">
        <Typography sx={{ mt: 2 }}>
          🎫 Karnety kończące się: <b>{stats.expiring_passes}</b>
        </Typography>
        <Typography sx={{ mt: 1 }}>
          📅 Jazdy rozpoczynające się w ciągu godziny: <b>{stats.rides_next_hour}</b>
        </Typography>
        <Typography sx={{ mt: 1 }}>
          📡 Odbicia RFID dzisiaj: <b>{stats.checked_in_today}</b>
        </Typography>
      </DashboardAlert>

      <Card sx={{ mt: 3, borderRadius: 3 }}>
        <CardContent>
          <Typography variant="h6" fontWeight={700} sx={{ mb: 2 }}>
            Dzisiejsze jazdy
          </Typography>

          {stats.today_rides.length === 0 ? (
            <Typography color="text.secondary">
              Brak zaplanowanych jazd na dzisiaj.
            </Typography>
          ) : (
            stats.today_rides.map((ride) => (
              <Box
                key={ride.id}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  py: 1.5,
                  borderBottom: "1px solid",
                  borderColor: "divider",
                }}
              >
                <Box>
                  <Typography fontWeight={700}>
                    {new Date(ride.start_time).toLocaleTimeString("pl-PL", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </Typography>
                  <Typography>{ride.client}</Typography>
                </Box>

                <Box sx={{ textAlign: "right" }}>
                  <Typography fontWeight={600}>🐴 {ride.horse}</Typography>

                  <Box
                    sx={{
                      mt: 0.75,
                      display: "flex",
                      justifyContent: "flex-end",
                      alignItems: "center",
                      gap: 1,
                    }}
                  >
                    <Chip
                      label={statusMap[ride.status as keyof typeof statusMap]?.label ?? ride.status}
                      color={statusMap[ride.status as keyof typeof statusMap]?.color ?? "default"}
                      size="small"
                    />

                    {ride.status === "planned" && (
                      <Button
                        variant="contained"
                        size="small"
                        onClick={() => updateRideStatus(ride.id, "checked_in")}
                      >
                        📡 Odbij
                      </Button>
                    )}

                    {ride.status === "checked_in" && (
                      <Button
                        variant="contained"
                        color="success"
                        size="small"
                        onClick={() => updateRideStatus(ride.id, "completed")}
                      >
                        ✔ Zakończ
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            ))
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() => setSnackbar((prev) => ({ ...prev, open: false }))}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}
