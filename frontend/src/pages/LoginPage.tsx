import { useState } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  TextField,
  Typography,
} from "@mui/material";
import { api } from "../api/client";

type Props = {
  onLogin: () => void;
};

export function LoginPage({ onLogin }: Props) {
  const [email, setEmail] = useState("admin@stablemanager.pl");
  const [password, setPassword] = useState("Admin123!");
  const [error, setError] = useState("");

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setError("");

    try {
      const response = await api.post("/auth/login", {
        email,
        password,
      });

      localStorage.setItem("stable_token", response.data.access_token);
      onLogin();
    } catch {
      setError("Nieprawidłowy e-mail lub hasło.");
    }
  }

  return (
    <Box
      sx={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        background: "linear-gradient(135deg, #1f3b57, #0f172a)",
        p: 2,
      }}
    >
      <Card sx={{ width: "100%", maxWidth: 420 }}>
        <CardContent sx={{ p: 4 }}>
          <Typography variant="h4" fontWeight={800} textAlign="center">
            🐴 StableManager
          </Typography>

          <Typography color="text.secondary" textAlign="center" sx={{ mt: 1, mb: 3 }}>
            Logowanie do panelu stajni
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 2 }}>
              {error}
            </Alert>
          )}

          <Box component="form" onSubmit={handleSubmit}>
            <TextField
              label="E-mail"
              fullWidth
              sx={{ mb: 2 }}
              value={email}
              onChange={(e) => setEmail(e.target.value)}
            />

            <TextField
              label="Hasło"
              type="password"
              fullWidth
              sx={{ mb: 3 }}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

            <Button type="submit" variant="contained" fullWidth size="large">
              Zaloguj
            </Button>
          </Box>
        </CardContent>
      </Card>
    </Box>
  );
}