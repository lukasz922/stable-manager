import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  Divider,
  InputAdornment,
  Paper,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import CreditCardRoundedIcon from "@mui/icons-material/CreditCardRounded";
import CheckCircleRoundedIcon from "@mui/icons-material/CheckCircleRounded";
import ErrorRoundedIcon from "@mui/icons-material/ErrorRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ScheduleRoundedIcon from "@mui/icons-material/ScheduleRounded";
import QrCodeScannerRoundedIcon from "@mui/icons-material/QrCodeScannerRounded";

import {
  checkInRFID,
  createQuickRide,
  type PassSummary,
} from "../api/checkin";
import { QuickRideDialog } from "../components/QuickRideDialog";

type LastScan = {
  client: string;
  horse: string;
  instructor: string;
  rideTime: string;
  status: string;
  type: "idle" | "success" | "error";
};

const initialLastScan: LastScan = {
  client: "Brak odczytu",
  horse: "—",
  instructor: "—",
  rideTime: "—",
  status: "Czekam na kartę RFID lub kod QR",
  type: "idle",
};

function playBeep(frequency: number, duration: number, delay = 0) {
  window.setTimeout(() => {
    try {
      const audioContext = new AudioContext();
      const oscillator = audioContext.createOscillator();
      const gain = audioContext.createGain();

      oscillator.connect(gain);
      gain.connect(audioContext.destination);
      oscillator.frequency.value = frequency;
      gain.gain.value = 0.12;
      oscillator.start();
      oscillator.stop(audioContext.currentTime + duration / 1000);
      oscillator.onended = () => void audioContext.close();
    } catch {
      // Dźwięk może być zablokowany przez przeglądarkę.
    }
  }, delay);
}

function playSuccessSound() {
  playBeep(880, 150);
}

function playErrorSound() {
  playBeep(440, 140);
  playBeep(440, 140, 220);
}

function formatRideTime(value: string | null) {
  if (!value) return "—";

  return new Date(value.endsWith("Z") ? value : `${value}Z`).toLocaleString(
    "pl-PL",
    {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    },
  );
}

export function ScannerPage() {
  const [rfid, setRfid] = useState("");
  const [lastScan, setLastScan] = useState<LastScan>(initialLastScan);
  const [scanning, setScanning] = useState(false);
  const [error, setError] = useState("");

  const [quickRideOpen, setQuickRideOpen] = useState(false);
  const [quickRideClientId, setQuickRideClientId] = useState(0);
  const [quickRideClientName, setQuickRideClientName] = useState("");
  const [quickRidePasses, setQuickRidePasses] = useState<PassSummary[]>([]);

  const rfidInputRef = useRef<HTMLInputElement | null>(null);
  const resetTimerRef = useRef<number | null>(null);

  useEffect(() => {
    rfidInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!scanning && !quickRideOpen) {
      rfidInputRef.current?.focus();
    }
  }, [scanning, quickRideOpen]);

  useEffect(() => {
    return () => {
      if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    };
  }, []);

  function scheduleReset() {
    if (resetTimerRef.current) window.clearTimeout(resetTimerRef.current);
    resetTimerRef.current = window.setTimeout(() => {
      setLastScan(initialLastScan);
      setError("");
    }, 4500);
  }

  async function handleScan() {
    const code = rfid.trim();
    if (!code || scanning) return;

    try {
      setScanning(true);
      setError("");

      const data = await checkInRFID(code);

      if (data.mode === "quick_ride") {
        setQuickRideClientId(data.client_id);
        setQuickRideClientName(data.client_name);
        setQuickRidePasses(data.passes);
        setQuickRideOpen(true);
        setLastScan({
          client: data.client_name,
          horse: "—",
          instructor: "—",
          rideTime: "—",
          status: "Wybierz dane szybkiej jazdy",
          type: "success",
        });
        setRfid("");
        return;
      }

      setLastScan({
        client: data.client_name,
        horse: data.horse_name || "—",
        instructor: data.instructor_name || "—",
        rideTime: formatRideTime(data.ride_time),
        status: "Jazda została odbita",
        type: "success",
      });

      playSuccessSound();
      setRfid("");
      scheduleReset();
    } catch (err) {
      const message =
        err instanceof Error ? err.message : "Nie udało się obsłużyć skanu.";

      setError(message);
      setLastScan({
        ...initialLastScan,
        status: message,
        type: "error",
      });

      playErrorSound();
      setRfid("");
      scheduleReset();
    } finally {
      setScanning(false);
    }
  }

  async function handleQuickRideSubmit(data: {
    pass_id: number;
    horse_id: number;
    instructor_id: number;
    duration_minutes: number;
  }) {
    const result = await createQuickRide({
      client_id: quickRideClientId,
      ...data,
    });

    setQuickRideOpen(false);
    setQuickRidePasses([]);
    setLastScan({
      client: quickRideClientName,
      horse: "Wybrano w formularzu",
      instructor: "Wybrano w formularzu",
      rideTime: new Date().toLocaleString("pl-PL"),
      status: `Szybka jazda rozpoczęta · ID ${result.ride_id}`,
      type: "success",
    });

    playSuccessSound();
    scheduleReset();
  }

  function handleQuickRideClose() {
    setQuickRideOpen(false);
    setQuickRideClientId(0);
    setQuickRideClientName("");
    setQuickRidePasses([]);
    setLastScan(initialLastScan);
    setError("");
  }

  const stateStyle =
    lastScan.type === "success"
      ? { bgcolor: "success.50", borderColor: "success.light" }
      : lastScan.type === "error"
        ? { bgcolor: "error.50", borderColor: "error.light" }
        : { bgcolor: "background.paper", borderColor: "divider" };

  return (
    <Box sx={{ maxWidth: 1050, mx: "auto", pb: 4 }}>
      <Box sx={{ textAlign: "center", mb: 3 }}>
        <Typography variant="h4" fontWeight={900}>
          Stanowisko odbić
        </Typography>
        <Typography color="text.secondary" sx={{ mt: 0.75 }}>
          Przyłóż kartę RFID albo zeskanuj kod QR, aby zarejestrować jazdę.
        </Typography>
      </Box>

      <Box
        sx={{
          display: "grid",
          gridTemplateColumns: { xs: "1fr", md: "minmax(0, 1.1fr) minmax(320px, .9fr)" },
          gap: 2.5,
        }}
      >
        <Card
          elevation={0}
          sx={{
            border: "1px solid",
            borderColor: "divider",
            borderRadius: 4,
          }}
        >
          <CardContent sx={{ p: { xs: 2.5, sm: 4 } }}>
            <Stack alignItems="center" spacing={2.5}>
              <Box
                sx={{
                  width: 86,
                  height: 86,
                  display: "grid",
                  placeItems: "center",
                  borderRadius: "50%",
                  bgcolor: "primary.50",
                  color: "primary.main",
                }}
              >
                <QrCodeScannerRoundedIcon sx={{ fontSize: 48 }} />
              </Box>

              <Box textAlign="center">
                <Typography variant="h5" fontWeight={800}>
                  Gotowe do skanowania
                </Typography>
                <Typography color="text.secondary">
                  Pole pozostaje aktywne dla czytnika USB.
                </Typography>
              </Box>

              {error && (
                <Alert severity="error" sx={{ width: "100%" }}>
                  {error}
                </Alert>
              )}

              <TextField
                inputRef={rfidInputRef}
                autoFocus
                fullWidth
                value={rfid}
                onChange={(event) => setRfid(event.target.value)}
                onKeyDown={(event) => {
                  if (event.key === "Enter") {
                    event.preventDefault();
                    void handleScan();
                  }
                }}
                label="Kod RFID / QR"
                placeholder="Przyłóż kartę..."
                disabled={scanning || quickRideOpen}
                inputProps={{ autoComplete: "off" }}
                InputProps={{
                  startAdornment: (
                    <InputAdornment position="start">
                      <CreditCardRoundedIcon color="primary" />
                    </InputAdornment>
                  ),
                  endAdornment: scanning ? (
                    <CircularProgress size={26} />
                  ) : undefined,
                  sx: {
                    height: 76,
                    fontSize: 24,
                    fontWeight: 700,
                  },
                }}
              />

              <Typography variant="caption" color="text.secondary">
                Po odczycie naciśnięcie Enter następuje automatycznie w większości czytników.
              </Typography>
            </Stack>
          </CardContent>
        </Card>

        <Paper
          elevation={0}
          sx={{
            p: 2.5,
            border: "1px solid",
            borderRadius: 4,
            transition: "background-color 180ms ease",
            ...stateStyle,
          }}
        >
          <Stack spacing={2}>
            <Stack direction="row" spacing={1.25} alignItems="center">
              {lastScan.type === "success" ? (
                <CheckCircleRoundedIcon color="success" />
              ) : lastScan.type === "error" ? (
                <ErrorRoundedIcon color="error" />
              ) : (
                <ScheduleRoundedIcon color="action" />
              )}

              <Box>
                <Typography variant="overline" color="text.secondary">
                  Ostatni odczyt
                </Typography>
                <Typography variant="h6" fontWeight={900}>
                  {lastScan.status}
                </Typography>
              </Box>
            </Stack>

            <Divider />

            <InfoRow icon={<PersonRoundedIcon />} label="Klient" value={lastScan.client} />
            <InfoRow icon={<PetsRoundedIcon />} label="Koń" value={lastScan.horse} />
            <InfoRow icon={<SchoolRoundedIcon />} label="Instruktor" value={lastScan.instructor} />
            <InfoRow icon={<ScheduleRoundedIcon />} label="Termin" value={lastScan.rideTime} />
          </Stack>
        </Paper>
      </Box>

      <QuickRideDialog
        open={quickRideOpen}
        clientName={quickRideClientName}
        passes={quickRidePasses}
        onClose={handleQuickRideClose}
        onSubmit={handleQuickRideSubmit}
      />
    </Box>
  );
}

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
}) {
  return (
    <Stack direction="row" spacing={1.5} alignItems="center">
      <Box sx={{ color: "text.secondary", display: "grid", placeItems: "center" }}>
        {icon}
      </Box>
      <Box sx={{ minWidth: 0 }}>
        <Typography variant="caption" color="text.secondary">
          {label}
        </Typography>
        <Typography fontWeight={700} noWrap>
          {value}
        </Typography>
      </Box>
    </Stack>
  );
}