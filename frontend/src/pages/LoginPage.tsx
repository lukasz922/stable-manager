import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  SvgIcon,
  TextField,
  Typography,
} from "@mui/material";
import LockRoundedIcon from "@mui/icons-material/LockRounded";
import PersonRoundedIcon from "@mui/icons-material/PersonRounded";
import VisibilityRoundedIcon from "@mui/icons-material/VisibilityRounded";
import VisibilityOffRoundedIcon from "@mui/icons-material/VisibilityOffRounded";

import { api } from "../api/client";

function HorseshoeIcon({ fontSize = 34 }: { fontSize?: number }) {
  return (
    <SvgIcon viewBox="0 0 24 24" sx={{ fontSize }}>
      <path
        d="M6 3v8c0 6 2.7 10 6 10s6-4 6-10V3h-3v8c0 3.8-1.3 6.5-3 6.5S9 14.8 9 11V3H6z"
        fill="currentColor"
      />
      <circle cx="7.5" cy="6" r="0.8" fill="rgba(37,99,235,0.95)" />
      <circle cx="7.5" cy="10" r="0.8" fill="rgba(37,99,235,0.95)" />
      <circle cx="16.5" cy="6" r="0.8" fill="rgba(37,99,235,0.95)" />
      <circle cx="16.5" cy="10" r="0.8" fill="rgba(37,99,235,0.95)" />
    </SvgIcon>
  );
}

type Props = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: Props) {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    const normalizedUsername = username.trim();

    if (!normalizedUsername || !password) {
      setError("Wpisz login i hasło.");
      return;
    }

    try {
      setSubmitting(true);

      const response = await api.post("/auth/login", {
        username: normalizedUsername,
        password,
      });

      const token = response.data.access_token;

      localStorage.setItem("stable_token", token);
      api.defaults.headers.common.Authorization = `Bearer ${token}`;

      const me = await api.get("/auth/me");

      localStorage.setItem(
        "stable_user",
        JSON.stringify(me.data),
      );

      onLogin();
    } catch (err) {
      localStorage.removeItem("stable_token");
      localStorage.removeItem("stable_user");
      delete api.defaults.headers.common.Authorization;

      const message =
        err instanceof Error && err.message === "Network Error"
          ? "Nie można połączyć się z serwerem. Sprawdź, czy backend jest uruchomiony."
          : err instanceof Error
            ? err.message
            : "Nie udało się zalogować.";

      setError(message);
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        gridTemplateColumns: {
          xs: "1fr",
          lg: "minmax(0, 1.1fr) minmax(420px, 0.9fr)",
        },
        background:
          "radial-gradient(circle at top right, rgba(191, 219, 254, 0.45), transparent 32%), linear-gradient(135deg, #eff6ff 0%, #f8fafc 48%, #ffffff 100%)",
      }}
    >
      <Box
        sx={{
          display: { xs: "none", lg: "flex" },
          position: "relative",
          overflow: "hidden",
          p: 8,
          alignItems: "flex-end",
          background:
            "linear-gradient(145deg, #0f4fd8 0%, #2563eb 58%, #60a5fa 100%)",
          color: "#fff",
        }}
      >
        <Box
          sx={{
            position: "absolute",
            width: 420,
            height: 420,
            borderRadius: "50%",
            top: -120,
            right: -80,
            bgcolor: "rgba(255,255,255,0.10)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            width: 260,
            height: 260,
            borderRadius: "50%",
            bottom: 90,
            left: -80,
            bgcolor: "rgba(255,255,255,0.08)",
          }}
        />

        <Box
          sx={{
            position: "absolute",
            top: 76,
            left: 72,
            color: "rgba(255,255,255,0.07)",
            transform: "rotate(-12deg)",
          }}
        >
          <HorseshoeIcon fontSize={220} />
        </Box>

        <Box sx={{ position: "relative", zIndex: 1, maxWidth: 560 }}>
          <Box
            sx={{
              width: 62,
              height: 62,
              borderRadius: 4,
              display: "grid",
              placeItems: "center",
              bgcolor: "rgba(255,255,255,0.16)",
              backdropFilter: "blur(12px)",
              mb: 3,
            }}
          >
            <HorseshoeIcon fontSize={36} />
          </Box>

          <Typography
            variant="h2"
            fontWeight={900}
            sx={{ lineHeight: 1.05, mb: 2 }}
          >
            StableManager
          </Typography>

          <Typography
            variant="h6"
            sx={{
              color: "rgba(255,255,255,0.82)",
              fontWeight: 500,
              lineHeight: 1.6,
            }}
          >
            Jedno miejsce do obsługi klientów, jazd, karnetów,
            instruktorów i codziennej pracy stajni.
          </Typography>

          <Stack spacing={1.25} sx={{ mt: 4 }}>
            {[
              "Kalendarz jazd i grafik instruktorów",
              "Obsługa klientów, koni i karnetów",
              "Rejestracja wejść RFID",
            ].map((item) => (
              <Box
                key={item}
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 1.25,
                  color: "rgba(255,255,255,0.92)",
                  fontWeight: 700,
                }}
              >
                <Box
                  sx={{
                    width: 24,
                    height: 24,
                    borderRadius: "50%",
                    display: "grid",
                    placeItems: "center",
                    bgcolor: "rgba(255,255,255,0.16)",
                    fontSize: 14,
                  }}
                >
                  ✓
                </Box>
                <Typography fontWeight={700}>{item}</Typography>
              </Box>
            ))}
          </Stack>
        </Box>
      </Box>

      <Box
        sx={{
          display: "grid",
          placeItems: "center",
          p: { xs: 2, sm: 4, lg: 6 },
        }}
      >
        <Box sx={{ width: "100%", maxWidth: 460 }}>
          <Box
            sx={{
              display: { xs: "flex", lg: "none" },
              alignItems: "center",
              gap: 1.25,
              mb: 3,
            }}
          >
            <Box
              sx={{
                width: 44,
                height: 44,
                borderRadius: 3,
                display: "grid",
                placeItems: "center",
                background:
                  "linear-gradient(135deg, #0f4fd8, #2563eb 58%, #60a5fa)",
                color: "#fff",
              }}
            >
              <HorseshoeIcon fontSize={26} />
            </Box>

            <Box>
              <Typography fontWeight={900}>
                StableManager
              </Typography>
              <Typography variant="caption" color="text.secondary">
                Panel stajni
              </Typography>
            </Box>
          </Box>

          <Card
            elevation={0}
            sx={{
              borderRadius: 5,
              border: "1px solid",
              borderColor: "divider",
              boxShadow:
                "0 24px 70px rgba(15, 23, 42, 0.12)",
              backgroundColor: "rgba(255,255,255,0.96)",
            }}
          >
            <CardContent
              sx={{
                p: { xs: 3, sm: 4.5 },
                "&:last-child": {
                  pb: { xs: 3, sm: 4.5 },
                },
              }}
            >
              <Typography variant="h4" fontWeight={900}>
                Zaloguj się
              </Typography>

              <Typography
                color="text.secondary"
                sx={{ mt: 1, mb: 3.5 }}
              >
                Wprowadź dane dostępowe do panelu stajni.
              </Typography>

              {error && (
                <Alert
                  severity="error"
                  sx={{
                    mb: 2.5,
                    borderRadius: 3,
                  }}
                >
                  {error}
                </Alert>
              )}

              <Box component="form" onSubmit={handleSubmit}>
                <TextField
                  label="Login"
                  value={username}
                  onChange={(event) =>
                    setUsername(event.target.value)
                  }
                  fullWidth
                  autoFocus
                  autoComplete="username"
                  disabled={submitting}
                  sx={{ mb: 2 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <PersonRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                  }}
                />

                <TextField
                  label="Hasło"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(event) =>
                    setPassword(event.target.value)
                  }
                  fullWidth
                  autoComplete="current-password"
                  disabled={submitting}
                  sx={{ mb: 3 }}
                  InputProps={{
                    startAdornment: (
                      <InputAdornment position="start">
                        <LockRoundedIcon color="action" />
                      </InputAdornment>
                    ),
                    endAdornment: (
                      <InputAdornment position="end">
                        <IconButton
                          onClick={() =>
                            setShowPassword((current) => !current)
                          }
                          edge="end"
                          aria-label={
                            showPassword
                              ? "Ukryj hasło"
                              : "Pokaż hasło"
                          }
                        >
                          {showPassword ? (
                            <VisibilityOffRoundedIcon />
                          ) : (
                            <VisibilityRoundedIcon />
                          )}
                        </IconButton>
                      </InputAdornment>
                    ),
                  }}
                />

                <Button
                  type="submit"
                  variant="contained"
                  size="large"
                  fullWidth
                  disabled={submitting}
                  sx={{
                    minHeight: 50,
                    borderRadius: 3,
                    textTransform: "none",
                    fontSize: 16,
                    fontWeight: 800,
                    bgcolor: "#2563eb",
                    boxShadow:
                      "0 12px 28px rgba(37, 99, 235, 0.24)",
                    "&:hover": {
                      bgcolor: "#1d4ed8",
                    },
                  }}
                >
                  {submitting ? (
                    <CircularProgress size={24} color="inherit" />
                  ) : (
                    "Zaloguj"
                  )}
                </Button>
              </Box>
            </CardContent>
          </Card>

          <Typography
            variant="caption"
            color="text.secondary"
            sx={{
              display: "block",
              textAlign: "center",
              mt: 2.5,
            }}
          >
            StableManager · Bezpieczny panel zarządzania stajnią
          </Typography>
        </Box>
      </Box>
    </Box>
  );
}