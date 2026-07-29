import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Snackbar,
  Stack,
  Typography,
} from "@mui/material";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import GroupsRoundedIcon from "@mui/icons-material/GroupsRounded";
import LoginRoundedIcon from "@mui/icons-material/LoginRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";

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
  instructor: string;
};

type DashboardStats = {
  clients_count: number;
  horses_count: number;
  rides_today: number;
  checked_in_today: number;
  completed_today: number;
  planned_today: number;
  cancelled_today: number;
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
  cancelled_today: 0,
  expiring_passes: 0,
  rides_next_hour: 0,
  today_rides: [],
};

const statusMap = {
  planned: {
    label: "Zaplanowana",
    color: "primary" as const,
  },
  checked_in: {
    label: "Klient obecny",
    color: "warning" as const,
  },
  completed: {
    label: "Zakończona",
    color: "success" as const,
  },
  cancelled: {
    label: "Anulowana",
    color: "error" as const,
  },
};

export function DashboardPage() {
  const [stats, setStats] =
    useState<DashboardStats>(initialStats);
  const [loading, setLoading] = useState(true);
  const [snackbar, setSnackbar] =
    useState<SnackbarState>({
      open: false,
      message: "",
      severity: "success",
    });

  async function loadStats(showLoader = false) {
    try {
      if (showLoader) {
        setLoading(true);
      }

      const response = await api.get<DashboardStats>(
        "/dashboard/stats",
      );
      setStats(response.data);
    } catch (error) {
      console.error(
        "Nie udało się pobrać statystyk dashboardu:",
        error,
      );

      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się pobrać danych dashboardu.",
        severity: "error",
      });
    } finally {
      if (showLoader) {
        setLoading(false);
      }
    }
  }

  async function updateRideStatus(
    rideId: number,
    newStatus: string,
  ) {
    try {
      await api.patch(`/rides/${rideId}/status`, {
        status: newStatus,
      });

      await loadStats();

      setSnackbar({
        open: true,
        message:
          newStatus === "checked_in"
            ? "Klient został oznaczony jako obecny."
            : "Jazda została zakończona.",
        severity: "success",
      });
    } catch (error) {
      console.error(
        "Nie udało się zmienić statusu jazdy:",
        error,
      );

      setSnackbar({
        open: true,
        message:
          error instanceof Error
            ? error.message
            : "Nie udało się zmienić statusu jazdy.",
        severity: "error",
      });
    }
  }

  useEffect(() => {
    void loadStats(true);

    const interval = window.setInterval(
      () => void loadStats(),
      30_000,
    );

    return () => window.clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <Box
        sx={{
          minHeight: 320,
          display: "grid",
          placeItems: "center",
        }}
      >
        <CircularProgress />
      </Box>
    );
  }

  const cards = [
    {
      title: "Klienci",
      value: stats.clients_count,
      accent: "#5b21b6",
      icon: <GroupsRoundedIcon />,
    },
    {
      title: "Aktywne konie",
      value: stats.horses_count,
      accent: "#15803d",
      icon: <PetsRoundedIcon />,
    },
    {
      title: "Jazdy dzisiaj",
      value: stats.rides_today,
      accent: "#c2410c",
      icon: <CalendarMonthRoundedIcon />,
    },
    {
      title: "Klient obecny",
      value: stats.checked_in_today,
      accent: "#a21caf",
      icon: <LoginRoundedIcon />,
    },
    {
      title: "Zakończone",
      value: stats.completed_today,
      accent: "#15803d",
      icon: <CheckCircleRoundedIcon />,
    },
    {
      title: "Zaplanowane",
      value: stats.planned_today,
      accent: "#0369a1",
      icon: <ScheduleRoundedIcon />,
    },
  ];

  return (
    <>
      <Box sx={{ mb: 3 }}>
        <Typography variant="h4" fontWeight={800}>
          Dashboard
        </Typography>

        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Podsumowanie pracy stajni na dziś.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, minmax(0, 1fr))",
            md: "repeat(3, minmax(0, 1fr))",
            xl: "repeat(6, minmax(0, 1fr))",
          },
          gap: 2,
        }}
      >
        {cards.map((card) => (
          <DashboardCard
            key={card.title}
            icon={card.icon}
            title={card.title}
            value={card.value}
            accent={card.accent}
          />
        ))}
      </Box>

      <DashboardAlert title="Wymaga uwagi">
        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              md: "repeat(3, minmax(0, 1fr))",
            },
            gap: 2,
          }}
        >
          {[
            {
              label: "Karnety kończące się",
              value: stats.expiring_passes,
            },
            {
              label: "Jazdy w ciągu godziny",
              value: stats.rides_next_hour,
            },
            {
              label: "Anulowane dzisiaj",
              value: stats.cancelled_today,
            },
          ].map((item) => (
            <Box
              key={item.label}
              sx={{
                p: 2,
                borderRadius: 3,
                bgcolor: "rgba(255,255,255,0.72)",
                border: "1px solid",
                borderColor: "divider",
              }}
            >
              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
              >
                {item.label}
              </Typography>

              <Typography
                variant="h5"
                fontWeight={800}
                sx={{ mt: 0.5 }}
              >
                {item.value}
              </Typography>
            </Box>
          ))}
        </Box>
      </DashboardAlert>

      <Card
        elevation={0}
        sx={{
          mt: 3,
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 4,
        }}
      >
        <CardContent sx={{ p: 0 }}>
          <Box sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight={800}>
              Dzisiejsze jazdy
            </Typography>

            <Typography
              variant="body2"
              color="text.secondary"
              sx={{ mt: 0.5 }}
            >
              Lista aktualizuje się automatycznie co 30 sekund.
            </Typography>
          </Box>

          <Divider />

          {stats.today_rides.length === 0 ? (
            <Box sx={{ p: 4, textAlign: "center" }}>
              <Typography color="text.secondary">
                Brak jazd na dzisiaj.
              </Typography>
            </Box>
          ) : (
            <Stack divider={<Divider />}>
              {stats.today_rides.map((ride) => {
                const status =
                  statusMap[
                    ride.status as keyof typeof statusMap
                  ];

                return (
                  <Box
                    key={ride.id}
                    sx={{
                      px: 3,
                      py: 2,
                      display: "grid",
                      gridTemplateColumns: {
                        xs: "1fr",
                        md: "90px minmax(180px, 1fr) minmax(160px, 1fr) auto",
                      },
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    <Typography
                      variant="h6"
                      fontWeight={800}
                    >
                      {new Date(
                        ride.start_time,
                      ).toLocaleTimeString("pl-PL", {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        alignItems: "center",
                        gap: 1.5,
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 38,
                          height: 38,
                          fontSize: 15,
                          fontWeight: 800,
                        }}
                      >
                        {ride.client
                          .split(" ")
                          .map((part) => part[0])
                          .join("")
                          .slice(0, 2)}
                      </Avatar>

                      <Box>
                        <Typography fontWeight={800}>
                          {ride.client}
                        </Typography>
                        <Typography
                          variant="body2"
                          color="text.secondary"
                        >
                          Instruktor: {ride.instructor}
                        </Typography>
                      </Box>
                    </Box>

                    <Typography fontWeight={700}>
                      Koń: {ride.horse}
                    </Typography>

                    <Box
                      sx={{
                        display: "flex",
                        flexWrap: "wrap",
                        alignItems: "center",
                        justifyContent: {
                          xs: "flex-start",
                          md: "flex-end",
                        },
                        gap: 1,
                      }}
                    >
                      <Chip
                        label={status?.label ?? ride.status}
                        color={status?.color ?? "default"}
                        size="small"
                      />

                      {ride.status === "planned" && (
                        <Button
                          variant="contained"
                          size="small"
                          startIcon={<LoginRoundedIcon />}
                          onClick={() =>
                            updateRideStatus(
                              ride.id,
                              "checked_in",
                            )
                          }
                        >
                          Odbij
                        </Button>
                      )}

                      {ride.status === "checked_in" && (
                        <Button
                          variant="contained"
                          color="success"
                          size="small"
                          startIcon={
                            <CheckCircleRoundedIcon />
                          }
                          onClick={() =>
                            updateRideStatus(
                              ride.id,
                              "completed",
                            )
                          }
                        >
                          Zakończ
                        </Button>
                      )}
                    </Box>
                  </Box>
                );
              })}
            </Stack>
          )}
        </CardContent>
      </Card>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3500}
        onClose={() =>
          setSnackbar((previous) => ({
            ...previous,
            open: false,
          }))
        }
        anchorOrigin={{
          vertical: "bottom",
          horizontal: "right",
        }}
      >
        <Alert
          severity={snackbar.severity}
          variant="filled"
          onClose={() =>
            setSnackbar((previous) => ({
              ...previous,
              open: false,
            }))
          }
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </>
  );
}