import { useCallback, useEffect, useRef, useState } from "react";
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
  Paper,
  Snackbar,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import AccessTimeRoundedIcon from "@mui/icons-material/AccessTimeRounded";
import DirectionsWalkRoundedIcon from "@mui/icons-material/DirectionsWalkRounded";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import RefreshRoundedIcon from "@mui/icons-material/RefreshRounded";
import SensorsRoundedIcon from "@mui/icons-material/SensorsRounded";

import { api } from "../api/client";
import { createQuickRide } from "../api/checkin";
import { QuickRideDialog } from "../components/QuickRideDialog";

type Ride = {
  id: number;
  client?: string;
  client_name?: string;
  horse?: string;
  horse_name?: string;
  instructor?: string;
  instructor_name?: string;
  start_time?: string;
  end_time?: string;
  status?: string;
};

type ReceptionDashboard = {
  stats: { current: number; upcoming: number };
  current_rides: Ride[];
  upcoming_rides: Ride[];
};

type QuickRideData = {
  client_id: number;
  client_name: string;
  passes: Array<{
    id: number;
    name: string;
    remaining_entries: number;
    valid_until: string;
  }>;
};

const REFRESH_INTERVAL_SECONDS = 30;

function formatTime(value?: string) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("pl-PL", {
    hour: "2-digit",
    minute: "2-digit",
  });
}

function minutesUntil(value?: string) {
  if (!value) return null;
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return null;
  return Math.ceil((date.getTime() - Date.now()) / 60000);
}

function clientName(ride: Ride) {
  return ride.client_name ?? ride.client ?? "Nieznany klient";
}

function horseName(ride: Ride) {
  return ride.horse_name ?? ride.horse ?? "—";
}

function instructorName(ride: Ride) {
  return ride.instructor_name ?? ride.instructor ?? "—";
}

function initials(name: string) {
  return name
    .split(" ")
    .filter(Boolean)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();
}

function timingLabel(ride: Ride, mode: "current" | "upcoming") {
  const minutes = minutesUntil(
    mode === "current" ? ride.end_time : ride.start_time,
  );

  if (minutes === null) return "—";
  if (minutes <= 0) return mode === "current" ? "Kończy się" : "Teraz";
  if (minutes === 1) return mode === "current" ? "1 minuta" : "Za 1 minutę";
  return mode === "current" ? `${minutes} min` : `Za ${minutes} min`;
}

function StatCard({
  title,
  value,
  description,
  icon,
  accent,
}: {
  title: string;
  value: string | number;
  description: string;
  icon: React.ReactNode;
  accent: string;
}) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        background: "linear-gradient(145deg, #fff, #fbfcff)",
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            color: accent,
            bgcolor: `${accent}14`,
            mb: 2,
          }}
        >
          {icon}
        </Box>
        <Typography variant="body2" color="text.secondary" fontWeight={700}>
          {title}
        </Typography>
        <Typography variant="h3" fontWeight={800} sx={{ mt: 0.5 }}>
          {value}
        </Typography>
        <Typography variant="caption" color="text.secondary">
          {description}
        </Typography>
      </CardContent>
    </Card>
  );
}

function RideList({
  title,
  subtitle,
  rides,
  mode,
}: {
  title: string;
  subtitle: string;
  rides: Ride[];
  mode: "current" | "upcoming";
}) {
  const color = mode === "current" ? "success" : "warning";

  return (
    <Paper
      elevation={0}
      sx={{
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2.5,
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h6" fontWeight={800}>{title}</Typography>
          <Typography variant="body2" color="text.secondary">{subtitle}</Typography>
        </Box>
        <Chip label={rides.length} color={color} variant={rides.length ? "filled" : "outlined"} />
      </Box>

      <Divider />

      {rides.length === 0 ? (
        <Box sx={{ py: 6, textAlign: "center" }}>
          <Typography color="text.secondary">
            {mode === "current"
              ? "Obecnie nie trwa żadna jazda"
              : "Brak jazd w najbliższych 30 minutach"}
          </Typography>
        </Box>
      ) : (
        <Stack divider={<Divider />}>
          {rides.map((ride) => {
            const name = clientName(ride);

            return (
              <Box
                key={ride.id}
                sx={{
                  px: 2.5,
                  py: 2,
                  display: "grid",
                  gridTemplateColumns: {
                    xs: "1fr",
                    md: "80px minmax(190px,1.2fr) minmax(140px,.8fr) minmax(160px,1fr) auto",
                  },
                  alignItems: "center",
                  gap: 2,
                }}
              >
                <Typography variant="h6" fontWeight={800}>
                  {formatTime(ride.start_time)}
                </Typography>

                <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                  <Avatar sx={{ width: 38, height: 38, fontSize: 14, fontWeight: 800 }}>
                    {initials(name)}
                  </Avatar>
                  <Box>
                    <Typography fontWeight={800}>{name}</Typography>
                    <Typography variant="body2" color="text.secondary">
                      {instructorName(ride)}
                    </Typography>
                  </Box>
                </Box>

                <Typography fontWeight={700}>Koń: {horseName(ride)}</Typography>

                <Typography color="text.secondary">
                  {formatTime(ride.start_time)}
                  {ride.end_time ? `–${formatTime(ride.end_time)}` : ""}
                </Typography>

                <Chip
                  label={timingLabel(ride, mode)}
                  size="small"
                  color={color}
                  variant="outlined"
                />
              </Box>
            );
          })}
        </Stack>
      )}
    </Paper>
  );
}

export function ReceptionPage() {
  const [dashboard, setDashboard] = useState<ReceptionDashboard | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [refreshIn, setRefreshIn] = useState(REFRESH_INTERVAL_SECONDS);
  const [rfidDialogOpen, setRfidDialogOpen] = useState(false);
  const [rfidUid, setRfidUid] = useState("");
  const [rfidStatus, setRfidStatus] = useState("Oczekiwanie na kartę");
  const [lastOperation, setLastOperation] = useState("Brak operacji");
  const [quickRideOpen, setQuickRideOpen] = useState(false);
  const [quickRideData, setQuickRideData] = useState<QuickRideData | null>(null);
  const [message, setMessage] = useState<{
    open: boolean;
    text: string;
    severity: "success" | "error";
  }>({ open: false, text: "", severity: "success" });

  const rfidInputRef = useRef<HTMLInputElement>(null);

  const loadDashboard = useCallback(async (showLoader = false) => {
    try {
      if (showLoader) setLoading(true);
      else setRefreshing(true);

      const response = await api.get<ReceptionDashboard>("/reception/dashboard");
      setDashboard(response.data);
      setRefreshIn(REFRESH_INTERVAL_SECONDS);
    } catch (error) {
      setMessage({
        open: true,
        text: error instanceof Error ? error.message : "Nie udało się pobrać panelu recepcji.",
        severity: "error",
      });
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  async function scanRfid() {
    const uid = rfidUid.trim();

    if (!uid) {
      setLastOperation("Wpisz UID karty.");
      return;
    }

    try {
      setRfidStatus("Sprawdzanie...");

      const response = await api.post("/check-in/rfid", { rfid_uid: uid });

      if (response.data.mode === "planned") {
        const text = `Zameldowano: ${response.data.client_name}`;
        setLastOperation(text);
        setMessage({ open: true, text, severity: "success" });
      } else {
        setQuickRideData(response.data);
        setQuickRideOpen(true);
        setLastOperation(`${response.data.client_name} — szybka jazda`);
      }

      setRfidStatus("Odczyt zakończony");
      setRfidDialogOpen(false);
      setRfidUid("");
      await loadDashboard();
    } catch (error) {
      const text = error instanceof Error ? error.message : "Błąd odczytu karty.";
      setRfidStatus("Błąd odczytu");
      setLastOperation(text);
      setMessage({ open: true, text, severity: "error" });
    }
  }

  async function handleQuickRide(data: {
    pass_id: number;
    horse_id: number;
    instructor_id: number;
    duration_minutes: number;
  }) {
    if (!quickRideData) return;

    try {
      await createQuickRide({ client_id: quickRideData.client_id, ...data });
      const text = `Utworzono szybką jazdę dla ${quickRideData.client_name}`;
      setQuickRideOpen(false);
      setQuickRideData(null);
      setLastOperation(text);
      setMessage({ open: true, text, severity: "success" });
      await loadDashboard();
    } catch (error) {
      setMessage({
        open: true,
        text: error instanceof Error ? error.message : "Nie udało się utworzyć szybkiej jazdy.",
        severity: "error",
      });
    }
  }

  useEffect(() => {
    void loadDashboard(true);
    const timer = window.setInterval(
      () => void loadDashboard(),
      REFRESH_INTERVAL_SECONDS * 1000,
    );
    return () => window.clearInterval(timer);
  }, [loadDashboard]);

  useEffect(() => {
    const timer = window.setInterval(() => {
      setRefreshIn((value) =>
        value <= 1 ? REFRESH_INTERVAL_SECONDS : value - 1,
      );
    }, 1000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!rfidDialogOpen) return;
    const timer = window.setTimeout(() => rfidInputRef.current?.focus(), 100);
    return () => window.clearTimeout(timer);
  }, [rfidDialogOpen]);

  if (loading && !dashboard) {
    return (
      <Box sx={{ minHeight: 400, display: "grid", placeItems: "center" }}>
        <CircularProgress />
      </Box>
    );
  }

  const currentRides = dashboard?.current_rides ?? [];
  const upcomingRides = dashboard?.upcoming_rides ?? [];

  return (
    <>
      <Box sx={{ pb: 4 }}>
        <Stack
          direction={{ xs: "column", md: "row" }}
          justifyContent="space-between"
          alignItems={{ xs: "stretch", md: "center" }}
          spacing={2}
          sx={{ mb: 3 }}
        >
          <Box>
            <Typography variant="h4" fontWeight={800}>Recepcja</Typography>
            <Typography color="text.secondary" sx={{ mt: 0.75 }}>
              Aktualne jazdy, najbliższe wejścia i obsługa RFID.
            </Typography>
          </Box>

          <Button
            variant="outlined"
            startIcon={refreshing ? <CircularProgress size={18} /> : <RefreshRoundedIcon />}
            disabled={refreshing}
            onClick={() => void loadDashboard()}
            sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
          >
            {refreshing ? "Odświeżanie..." : "Odśwież"}
          </Button>
        </Stack>

        <Box
          sx={{
            display: "grid",
            gridTemplateColumns: {
              xs: "1fr",
              sm: "repeat(2, minmax(0, 1fr))",
              xl: "repeat(4, minmax(0, 1fr))",
            },
            gap: 2,
            mb: 3,
          }}
        >
          <StatCard
            title="Aktualnie na jazdach"
            value={dashboard?.stats.current ?? 0}
            description="Klienci ze statusem obecny"
            icon={<DirectionsWalkRoundedIcon />}
            accent="#15803d"
          />
          <StatCard
            title="Najbliższe 30 minut"
            value={dashboard?.stats.upcoming ?? 0}
            description="Zaplanowane wejścia"
            icon={<EventRoundedIcon />}
            accent="#c2410c"
          />
          <StatCard
            title="Widoczne jazdy"
            value={currentRides.length + upcomingRides.length}
            description="Aktualne i nadchodzące"
            icon={<AccessTimeRoundedIcon />}
            accent="#0369a1"
          />
          <StatCard
            title="Odświeżenie"
            value={`${refreshIn} s`}
            description="Automatycznie co 30 sekund"
            icon={<RefreshRoundedIcon />}
            accent="#7e22ce"
          />
        </Box>

        <Card
          elevation={0}
          sx={{ mb: 3, border: "1px solid", borderColor: "divider", borderRadius: 4 }}
        >
          <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
            <Stack
              direction={{ xs: "column", md: "row" }}
              justifyContent="space-between"
              alignItems={{ xs: "stretch", md: "center" }}
              spacing={2}
            >
              <Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
                <Box
                  sx={{
                    width: 46,
                    height: 46,
                    borderRadius: 3,
                    display: "grid",
                    placeItems: "center",
                    color: "primary.main",
                    bgcolor: "rgba(37,99,235,0.10)",
                  }}
                >
                  <SensorsRoundedIcon />
                </Box>
                <Box>
                  <Typography fontWeight={800}>Czytnik RFID</Typography>
                  <Typography variant="body2" color="text.secondary">
                    {lastOperation}
                  </Typography>
                </Box>
              </Box>

              <Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
                <Chip
                  label={rfidStatus}
                  color={rfidStatus.includes("Błąd") ? "error" : "success"}
                  variant="outlined"
                />
                <Button
                  variant="contained"
                  startIcon={<SensorsRoundedIcon />}
                  onClick={() => setRfidDialogOpen(true)}
                  sx={{ borderRadius: 2.5, textTransform: "none", fontWeight: 700 }}
                >
                  Odbij kartę
                </Button>
              </Stack>
            </Stack>
          </CardContent>
        </Card>

        <Stack spacing={3}>
          <RideList
            title="Aktualnie na jazdach"
            subtitle="Osoby zameldowane i odbywające jazdę"
            rides={currentRides}
            mode="current"
          />
          <RideList
            title="Najbliższe jazdy"
            subtitle="Jazdy rozpoczynające się w ciągu 30 minut"
            rides={upcomingRides}
            mode="upcoming"
          />
        </Stack>
      </Box>

      <Dialog
        open={rfidDialogOpen}
        onClose={() => setRfidDialogOpen(false)}
        fullWidth
        maxWidth="xs"
      >
        <DialogTitle>Odbicie karty RFID</DialogTitle>
        <DialogContent>
          <TextField
            inputRef={rfidInputRef}
            autoFocus
            fullWidth
            label="UID karty"
            value={rfidUid}
            onChange={(event) => setRfidUid(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter" && rfidUid.trim()) {
                void scanRfid();
              }
            }}
            sx={{ mt: 1 }}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRfidDialogOpen(false)}>Anuluj</Button>
          <Button
            variant="contained"
            disabled={!rfidUid.trim()}
            onClick={() => void scanRfid()}
          >
            Odbij
          </Button>
        </DialogActions>
      </Dialog>

      <QuickRideDialog
        open={quickRideOpen}
        clientName={quickRideData?.client_name ?? ""}
        passes={quickRideData?.passes ?? []}
        onClose={() => {
          setQuickRideOpen(false);
          setQuickRideData(null);
        }}
        onSubmit={handleQuickRide}
      />

      <Snackbar
        open={message.open}
        autoHideDuration={4000}
        onClose={() => setMessage((value) => ({ ...value, open: false }))}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
      >
        <Alert
          severity={message.severity}
          variant="filled"
          onClose={() => setMessage((value) => ({ ...value, open: false }))}
        >
          {message.text}
        </Alert>
      </Snackbar>
    </>
  );
}