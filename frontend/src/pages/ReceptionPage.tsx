import { useCallback, useEffect, useState, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Divider,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField, 
  Paper,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import DirectionsWalkIcon from "@mui/icons-material/DirectionsWalk";
import EventIcon from "@mui/icons-material/Event";
import AccessTimeIcon from "@mui/icons-material/AccessTime";
import RefreshIcon from "@mui/icons-material/Refresh";
import SensorsIcon from "@mui/icons-material/Sensors";
import { createQuickRide } from "../api/checkin";
import { QuickRideDialog } from "../components/QuickRideDialog";

import { api } from "../api/client";

type Ride = {
  id: number;

  client_name?: string;
  client?: string;

  horse_name?: string;
  horse?: string;

  instructor_name?: string;
  instructor?: string;

  start_time?: string;
  end_time?: string;
  status?: string;
};

type ReceptionDashboard = {
  stats: {
    current: number;
    upcoming: number;
  };
  current_rides: Ride[];
  upcoming_rides: Ride[];
};

const REFRESH_INTERVAL_SECONDS = 30;

function formatTime(value?: string): string {
  if (!value) {
    return "—";
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getClientName(ride: Ride): string {
  return ride.client_name ?? ride.client ?? "Nieznany klient";
}

function getHorseName(ride: Ride): string {
  return ride.horse_name ?? ride.horse ?? "—";
}

function getInstructorName(ride: Ride): string {
  return ride.instructor_name ?? ride.instructor ?? "—";
}

function getMinutesUntil(value?: string): number | null {
  if (!value) {
    return null;
  }

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) {
    return null;
  }

  return Math.ceil((date.getTime() - Date.now()) / 60000);
}

function getRemainingText(endTime?: string): string {
  const minutes = getMinutesUntil(endTime);

  if (minutes === null) {
    return "—";
  }

  if (minutes <= 0) {
    return "Kończy się";
  }

  if (minutes === 1) {
    return "1 minuta";
  }

  return `${minutes} min`;
}

function getUpcomingText(startTime?: string): string {
  const minutes = getMinutesUntil(startTime);

  if (minutes === null) {
    return "—";
  }

  if (minutes < 0) {
    return "Powinna już trwać";
  }

  if (minutes === 0) {
    return "Teraz";
  }

  if (minutes === 1) {
    return "Za 1 minutę";
  }

  return `Za ${minutes} min`;
}

type StatCardProps = {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  background: string;
};

function StatCard({
  title,
  value,
  description,
  icon,
  background,
}: StatCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        borderRadius: 3,
        color: "white",
        background,
      }}
    >
      <CardContent
        sx={{
          p: 3,
          "&:last-child": {
            pb: 3,
          },
        }}
      >
        <Stack
          direction="row"
          alignItems="flex-start"
          justifyContent="space-between"
          spacing={2}
        >
          <Box>
            <Typography
              variant="body2"
              sx={{
                opacity: 0.9,
                fontWeight: 600,
              }}
            >
              {title}
            </Typography>

            <Typography
              variant="h3"
              sx={{
                mt: 1,
                fontWeight: 800,
                lineHeight: 1,
              }}
            >
              {value}
            </Typography>

            <Typography
              variant="body2"
              sx={{
                mt: 1.5,
                opacity: 0.85,
              }}
            >
              {description}
            </Typography>
          </Box>

          <Box
            sx={{
              width: 52,
              height: 52,
              borderRadius: 2.5,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              backgroundColor: "rgba(255, 255, 255, 0.18)",
              flexShrink: 0,
            }}
          >
            {icon}
          </Box>
        </Stack>
      </CardContent>
    </Card>
  );
}

export function ReceptionPage() {
  const [dashboard, setDashboard] = useState<ReceptionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState("");
  const [refreshIn, setRefreshIn] = useState(REFRESH_INTERVAL_SECONDS);
  const [rfidDialogOpen, setRfidDialogOpen] = useState(false);
  const [rfidUid, setRfidUid] = useState("");
  const [rfidStatus, setRfidStatus] = useState("Oczekiwanie na kartę");
  const [lastOperation, setLastOperation] = useState("Brak");
  const rfidInputRef = useRef<HTMLInputElement>(null);
  const [quickRideOpen, setQuickRideOpen] = useState(false);
  const [quickRideData, setQuickRideData] = useState<any>(null);
  
 const simulateRfid = async () => {
  const normalizedUid = rfidUid.trim();

  if (!normalizedUid) {
    setLastOperation("Wpisz UID karty.");
    setRfidStatus("❌ Brak UID");
    return;
  }

  try {
    setRfidStatus("Sprawdzanie...");

  const response = await api.post("/check-in/rfid", {
  rfid_uid: normalizedUid,
});

if (response.data.mode === "planned") {
    setLastOperation(`✔ Zameldowano: ${response.data.client_name}`);
} else {
    setQuickRideData(response.data);
    setQuickRideOpen(true);
    setLastOperation(`ℹ ${response.data.client_name} - szybka jazda`);
}

setRfidStatus("✔ Odczyt zakończony");

setRfidDialogOpen(false);
setRfidUid("");

await loadDashboard(false);
  } catch (err: any) {
    console.error("Błąd RFID:", err.response?.data ?? err);

    const detail = err.response?.data?.detail;

    let errorMessage = "Błąd odczytu karty";

    if (typeof detail === "string") {
      errorMessage = detail;
    } else if (Array.isArray(detail)) {
      errorMessage = detail
        .map((item) => {
          if (typeof item === "string") {
            return item;
          }

          if (typeof item?.msg === "string") {
            const field = Array.isArray(item.loc)
              ? item.loc[item.loc.length - 1]
              : null;

            return field ? `${field}: ${item.msg}` : item.msg;
          }

          return "Nieprawidłowe dane";
        })
        .join(", ");
    }

    setLastOperation(errorMessage);
    setRfidStatus("❌ Błąd");
  }
};
const handleQuickRide = async (data: {
    pass_id: number;
    horse_id: number;
    instructor_id: number;
    duration_minutes: number;
}) => {
    if (!quickRideData) {
        return;
    }

    await createQuickRide({
        client_id: quickRideData.client_id,
        ...data,
    });

    setQuickRideOpen(false);

    setLastOperation(
        `✔ Utworzono szybką jazdę dla ${quickRideData.client_name}`
    );

    await loadDashboard(false);
};
  const loadDashboard = useCallback(async (showMainLoader = false) => {
    try {
      if (showMainLoader) {
        setLoading(true);
      } else {
        setRefreshing(true);
      }

      setError("");

      const response = await api.get<ReceptionDashboard>(
        "/reception/dashboard",
      );

      setDashboard(response.data);
      setRefreshIn(REFRESH_INTERVAL_SECONDS);
    } catch (requestError) {
      console.error("Błąd pobierania panelu recepcji:", requestError);

      setError(
        "Nie udało się pobrać danych panelu recepcji. Sprawdź, czy backend jest uruchomiony.",
      );
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    void loadDashboard(true);

    const refreshTimer = window.setInterval(() => {
      void loadDashboard(false);
    }, REFRESH_INTERVAL_SECONDS * 1000);

    return () => {
      window.clearInterval(refreshTimer);
    };
  }, [loadDashboard]);
  useEffect(() => {
  if (rfidDialogOpen) {
    setTimeout(() => {
      rfidInputRef.current?.focus();
    }, 100);
  }
}, [rfidDialogOpen]);

  useEffect(() => {
    const countdownTimer = window.setInterval(() => {
      setRefreshIn((previousValue) => {
        if (previousValue <= 1) {
          return REFRESH_INTERVAL_SECONDS;
        }

        return previousValue - 1;
      });
    }, 1000);

    return () => {
      window.clearInterval(countdownTimer);
    };
  }, []);

  const currentRides = dashboard?.current_rides ?? [];
  const upcomingRides = dashboard?.upcoming_rides ?? [];

  const currentCount = dashboard?.stats.current ?? 0;
  const upcomingCount = dashboard?.stats.upcoming ?? 0;
  const visibleRidesCount = currentRides.length + upcomingRides.length;

  if (loading && !dashboard) {
    return (
      <Box
        sx={{
          minHeight: 400,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Stack alignItems="center" spacing={2}>
          <CircularProgress />
          <Typography color="text.secondary">
            Ładowanie panelu recepcji...
          </Typography>
        </Stack>
      </Box>
    );
  }

  return (
  <>
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        alignItems={{ xs: "stretch", md: "center" }}
        justifyContent="space-between"
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Typography
            variant="h4"
            component="h1"
            sx={{ fontWeight: 800 }}
          >
            Recepcja
          </Typography>

          <Typography color="text.secondary" sx={{ mt: 0.5 }}>
            Podgląd aktualnych i najbliższych jazd
          </Typography>
        </Box>

        <Button
          variant="outlined"
          startIcon={
            refreshing ? (
              <CircularProgress size={18} />
            ) : (
              <RefreshIcon />
            )
          }
          disabled={refreshing}
          onClick={() => void loadDashboard(false)}
          sx={{
            minWidth: 160,
            alignSelf: { xs: "stretch", md: "center" },
          }}
        >
          {refreshing ? "Odświeżanie..." : "Odśwież"}
        </Button>
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: {
            xs: "1fr",
            sm: "repeat(2, 1fr)",
            xl: "repeat(4, 1fr)",
          },
          gap: 2,
          mb: 4,
        }}
      >
        <StatCard
          title="Aktualnie na jazdach"
          value={currentCount}
          description="Klienci obecni na jazdach"
          icon={<DirectionsWalkIcon fontSize="large" />}
          background="linear-gradient(135deg, #2e7d32 0%, #43a047 100%)"
        />

        <StatCard
          title="Najbliższe 30 minut"
          value={upcomingCount}
          description="Zaplanowane nadchodzące jazdy"
          icon={<EventIcon fontSize="large" />}
          background="linear-gradient(135deg, #ed6c02 0%, #fb8c00 100%)"
        />

        <StatCard
          title="Widoczne na panelu"
          value={visibleRidesCount}
          description="Aktualne i najbliższe łącznie"
          icon={<AccessTimeIcon fontSize="large" />}
          background="linear-gradient(135deg, #1565c0 0%, #1e88e5 100%)"
        />

<Card sx={{ mt: 3 }}>
    <CardContent>

        <Typography variant="h6">
            <SensorsIcon sx={{ mr: 1 }} />
            Czytnik RFID
        </Typography>

        <Typography sx={{ mt: 2 }}>
            Status:
        </Typography>

        <Chip
            color="success"
            label={rfidStatus}
            sx={{ mt: 1 }}
        />

        <Typography sx={{ mt: 3 }}>
            Ostatnia operacja
        </Typography>

        <Typography color="text.secondary">
            {lastOperation}
        </Typography>

        <Button
            sx={{ mt: 3 }}
            variant="contained"
            onClick={() => setRfidDialogOpen(true)}
        >
            Symuluj odbicie
        </Button>

    </CardContent>
</Card>

<Dialog
    open={rfidDialogOpen}
    onClose={() => setRfidDialogOpen(false)}
    TransitionProps={{
        onEntered: () => {
            rfidInputRef.current?.focus();
        },
    }}
>
    <DialogTitle>
        Symulacja RFID
    </DialogTitle>

    <DialogContent>

        <TextField
    inputRef={rfidInputRef}
    autoFocus
    fullWidth
    label="UID karty"
    value={rfidUid}
    onChange={(e) => setRfidUid(e.target.value)}
    onKeyDown={(e) => {
        if (e.key === "Enter" && rfidUid.trim()) {
            void simulateRfid();
        }
    }}
    sx={{ mt: 1 }}
/>

    </DialogContent>

    <DialogActions>

        <Button
            onClick={() => setRfidDialogOpen(false)}
        >
            Anuluj
        </Button>

        <Button
            variant="contained"
            onClick={simulateRfid}
        >
            Odbij
        </Button>

    </DialogActions>
</Dialog>


        <StatCard
          title="Automatyczne odświeżanie"
          value={`${refreshIn} s`}
          description="Dane odświeżają się co 30 sekund"
          icon={<RefreshIcon fontSize="large" />}
          background="linear-gradient(135deg, #ad1457 0%, #d81b60 100%)"
        />
      </Box>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
          mb: 3,
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Aktualnie na jazdach
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Osoby zameldowane i odbywające jazdę
              </Typography>
            </Box>

            <Chip
              label={`${currentCount} aktywnych`}
              color="success"
              variant={currentCount > 0 ? "filled" : "outlined"}
            />
          </Stack>
        </Box>

        <Divider />

        {currentRides.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
            }}
          >
            <DirectionsWalkIcon
              sx={{
                fontSize: 48,
                color: "text.disabled",
                mb: 1,
              }}
            />

            <Typography sx={{ fontWeight: 600 }}>
              Obecnie nie trwa żadna jazda
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Zameldowane osoby pojawią się tutaj automatycznie.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Klient</TableCell>
                  <TableCell>Koń</TableCell>
                  <TableCell>Instruktor</TableCell>
                  <TableCell>Godzina</TableCell>
                  <TableCell>Pozostało</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {currentRides.map((ride) => (
                  <TableRow key={ride.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {getClientName(ride)}
                      </Typography>
                    </TableCell>

                    <TableCell>{getHorseName(ride)}</TableCell>

                    <TableCell>{getInstructorName(ride)}</TableCell>

                    <TableCell>
                      {formatTime(ride.start_time)}–{formatTime(ride.end_time)}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getRemainingText(ride.end_time)}
                        size="small"
                        color="success"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label="Na jeździe"
                        size="small"
                        color="success"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>

      <Paper
        elevation={0}
        sx={{
          border: "1px solid",
          borderColor: "divider",
          borderRadius: 3,
          overflow: "hidden",
        }}
      >
        <Box sx={{ p: 2.5 }}>
          <Stack
            direction="row"
            alignItems="center"
            justifyContent="space-between"
            spacing={2}
          >
            <Box>
              <Typography variant="h6" sx={{ fontWeight: 700 }}>
                Najbliższe jazdy
              </Typography>

              <Typography variant="body2" color="text.secondary">
                Jazdy rozpoczynające się w ciągu 30 minut
              </Typography>
            </Box>

            <Chip
              label={`${upcomingCount} nadchodzących`}
              color="warning"
              variant={upcomingCount > 0 ? "filled" : "outlined"}
            />
          </Stack>
        </Box>

        <Divider />

        {upcomingRides.length === 0 ? (
          <Box
            sx={{
              py: 6,
              px: 2,
              textAlign: "center",
            }}
          >
            <EventIcon
              sx={{
                fontSize: 48,
                color: "text.disabled",
                mb: 1,
              }}
            />

            <Typography sx={{ fontWeight: 600 }}>
              Brak jazd w najbliższych 30 minutach
            </Typography>

            <Typography variant="body2" color="text.secondary">
              Najbliższe rezerwacje pojawią się tutaj automatycznie.
            </Typography>
          </Box>
        ) : (
          <TableContainer>
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>Klient</TableCell>
                  <TableCell>Koń</TableCell>
                  <TableCell>Instruktor</TableCell>
                  <TableCell>Rozpoczęcie</TableCell>
                  <TableCell>Do rozpoczęcia</TableCell>
                  <TableCell>Status</TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {upcomingRides.map((ride) => (
                  <TableRow key={ride.id} hover>
                    <TableCell>
                      <Typography sx={{ fontWeight: 600 }}>
                        {getClientName(ride)}
                      </Typography>
                    </TableCell>

                    <TableCell>{getHorseName(ride)}</TableCell>

                    <TableCell>{getInstructorName(ride)}</TableCell>

                    <TableCell>
                      {formatTime(ride.start_time)}
                    </TableCell>

                    <TableCell>
                      <Chip
                        label={getUpcomingText(ride.start_time)}
                        size="small"
                        color="warning"
                        variant="outlined"
                      />
                    </TableCell>

                    <TableCell>
                      <Chip
                        label="Zaplanowana"
                        size="small"
                        color="warning"
                      />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
        )}
      </Paper>
        </Box>

    <QuickRideDialog
  open={quickRideOpen}
  clientName={quickRideData?.client_name ?? ""}
  passes={quickRideData?.passes ?? []}
  onClose={() => setQuickRideOpen(false)}
  onSubmit={handleQuickRide}
/>
  </>
);
} 