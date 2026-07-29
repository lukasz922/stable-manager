import { useEffect, useState } from "react";
import {
  Alert,
  Avatar,
  Box,
  CircularProgress,
  LinearProgress,
  Paper,
  Stack,
  Typography,
} from "@mui/material";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";

import {
  getHorsesReport,
  type HorseReport,
  type ReportPeriod,
} from "../../api/reports";

type Props = {
  period: ReportPeriod;
};

export function HorsesTable({ period }: Props) {
  const [items, setItems] = useState<HorseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      try {
        setLoading(true);
        setError("");
        setItems(await getHorsesReport(period));
      } catch (err) {
        setError(
          err instanceof Error
            ? err.message
            : "Nie udało się pobrać danych raportu.",
        );
      } finally {
        setLoading(false);
      }
    }

    void load();
  }, [period]);

  const maxRides = Math.max(...items.map((item) => item.rides), 1);

  return (
    <Paper
      elevation={0}
      sx={{
        p: 2.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        minWidth: 0,
      }}
    >
      <Stack direction="row" spacing={1.25} alignItems="center" sx={{ mb: 2 }}>
        <PetsRoundedIcon color="primary" />
        <Typography variant="h6" fontWeight={900}>
          Najczęściej jeżdżące konie
        </Typography>
      </Stack>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      {loading ? (
        <Box sx={{ py: 6, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : items.length === 0 ? (
        <Box sx={{ py: 5, textAlign: "center" }}>
          <Typography color="text.secondary">Brak jazd koni w tym okresie.</Typography>
        </Box>
      ) : (
        <Stack spacing={1.5}>
          {items.map((item, index) => (
            <Box key={item.horse_id}>
              <Stack direction="row" spacing={1.25} alignItems="center">
                <Avatar
                  sx={{
                    width: 34,
                    height: 34,
                    fontSize: 13,
                    fontWeight: 900,
                    bgcolor: index < 3 ? "primary.main" : "action.selected",
                    color: index < 3 ? "primary.contrastText" : "text.primary",
                  }}
                >
                  {index + 1}
                </Avatar>

                <Box sx={{ minWidth: 0, flex: 1 }}>
                  <Stack direction="row" justifyContent="space-between" spacing={1}>
                    <Typography fontWeight={800} noWrap>
                      {item.horse_name}
                    </Typography>
                    <Typography fontWeight={900}>
                      {item.rides}
                    </Typography>
                  </Stack>

                  <LinearProgress
                    variant="determinate"
                    value={(item.rides / maxRides) * 100}
                    sx={{
                      mt: 0.75,
                      height: 7,
                      borderRadius: 99,
                      bgcolor: "action.hover",
                    }}
                  />
                </Box>
              </Stack>
            </Box>
          ))}
        </Stack>
      )}
    </Paper>
  );
}