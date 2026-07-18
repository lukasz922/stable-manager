import { useEffect, useRef, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  CircularProgress,
  TextField,
  Typography,
} from "@mui/material";

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
  client: "-",
  horse: "-",
  instructor: "-",
  rideTime: "-",
  status: "⚪ Czekam na kartę...",
  type: "idle",
};

function playBeep(frequency: number, duration: number, delay = 0) {
  window.setTimeout(() => {
    const audioContext = new AudioContext();
    const oscillator = audioContext.createOscillator();
    const gain = audioContext.createGain();

    oscillator.connect(gain);
    gain.connect(audioContext.destination);

    oscillator.frequency.value = frequency;
    gain.gain.value = 0.15;

    oscillator.start();
    oscillator.stop(audioContext.currentTime + duration / 1000);

    oscillator.onended = () => {
      audioContext.close();
    };
  }, delay);
}

function playSuccessSound() {
  playBeep(880, 150);
}

function playErrorSound() {
  playBeep(440, 140);
  playBeep(440, 140, 220);
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

  useEffect(() => {
    rfidInputRef.current?.focus();
  }, []);

  useEffect(() => {
    if (!scanning && !quickRideOpen) {
      rfidInputRef.current?.focus();
    }
  }, [scanning, quickRideOpen]);

  async function handleScan() {
    const code = rfid.trim();

    if (!code || scanning) {
      return;
    }

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
          horse: "-",
          instructor: "-",
          rideTime: "-",
          status: "🟠 Wybierz dane szybkiej jazdy",
          type: "success",
        });

        setRfid("");
        return;
      }

      const rideTime = data.ride_time
        ? new Date(
            data.ride_time.endsWith("Z")
              ? data.ride_time
              : `${data.ride_time}Z`
          ).toLocaleString("pl-PL", {
            day: "2-digit",
            month: "2-digit",
            year: "numeric",
            hour: "2-digit",
            minute: "2-digit",
          })
        : "-";

      setLastScan({
        client: data.client_name,
        horse: data.horse_name || "-",
        instructor: data.instructor_name || "-",
        rideTime,
        status: "🟢 ODBITO",
        type: "success",
      });

      playSuccessSound();
      setRfid("");

      window.setTimeout(() => {
        setLastScan(initialLastScan);
      }, 3000);
    } catch (err) {
      console.error(err);

      const message =
        err instanceof Error
          ? err.message
          : "Nie udało się obsłużyć skanu.";

      setError(message);

      setLastScan({
        ...initialLastScan,
        status: `🔴 ${message}`,
        type: "error",
      });

      playErrorSound();
      setRfid("");

      window.setTimeout(() => {
        setLastScan(initialLastScan);
      }, 3000);
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
      pass_id: data.pass_id,
      horse_id: data.horse_id,
      instructor_id: data.instructor_id,
      duration_minutes: data.duration_minutes,
    });

    setQuickRideOpen(false);
    setQuickRidePasses([]);

    setLastScan({
      client: quickRideClientName,
      horse: "-",
      instructor: "-",
      rideTime: new Date().toLocaleString("pl-PL", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      status: `🟢 Jazda rozpoczęta, ID: ${result.ride_id}`,
      type: "success",
    });

    playSuccessSound();

    window.setTimeout(() => {
      setLastScan(initialLastScan);
    }, 3000);
  }

  function handleQuickRideClose() {
    setQuickRideOpen(false);
    setQuickRideClientId(0);
    setQuickRideClientName("");
    setQuickRidePasses([]);
    setLastScan(initialLastScan);
  }

  return (
    <Box sx={{ maxWidth: 900, mx: "auto" }}>
      <Typography
        variant="h3"
        fontWeight={800}
        textAlign="center"
        gutterBottom
      >
        🐴 STABLE MANAGER
      </Typography>

      <Typography
        variant="h5"
        textAlign="center"
        color="text.secondary"
        sx={{ mb: 4 }}
      >
        Stanowisko odbić jazd
      </Typography>

      <Card
        elevation={3}
        sx={{
          maxWidth: 700,
          mx: "auto",
          borderRadius: 4,
          border: "1px solid #e5e7eb",
        }}
      >
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h6" textAlign="center" sx={{ mb: 4 }}>
            Przyłóż kartę RFID
            <br />
            lub zeskanuj kod QR
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
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
                handleScan();
              }
            }}
            label="Czekam na skan..."
            placeholder="Przyłóż kartę..."
            inputProps={{ autoComplete: "off" }}
            InputProps={{
              sx: {
                fontSize: 28,
                height: 80,
              },
              endAdornment: scanning ? (
                <CircularProgress size={28} />
              ) : undefined,
            }}
          />
        </CardContent>

        <Box
          sx={{
            p: 4,
            borderTop: "1px solid #e5e7eb",
            backgroundColor:
              lastScan.type === "success"
                ? "#e8f5e9"
                : lastScan.type === "error"
                  ? "#ffebee"
                  : "#fafafa",
          }}
        >
          <Typography variant="h6" gutterBottom>
            Ostatni odczyt
          </Typography>

          <Typography>👤 {lastScan.client}</Typography>
          <Typography>🐴 {lastScan.horse}</Typography>
          <Typography>👨‍🏫 {lastScan.instructor}</Typography>
          <Typography>🕒 {lastScan.rideTime}</Typography>

          <Typography
            sx={{
              mt: 2,
              fontWeight: 700,
              fontSize: 20,
            }}
          >
            {lastScan.status}
          </Typography>
        </Box>
      </Card>

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
