import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Stack,
  Typography,
} from "@mui/material";
import AssessmentRoundedIcon from "@mui/icons-material/AssessmentRounded";

import {
  getReportsSummary,
  type ReportPeriod,
  type ReportsSummary,
} from "../api/reports";
import { ClientsTable } from "../components/reports/ClientsTable";
import { HorsesTable } from "../components/reports/HorsesTable";
import { InstructorsTable } from "../components/reports/InstructorsTable";
import { ReportsFilters } from "../components/reports/ReportsFilters";
import { SummaryCards } from "../components/reports/SummaryCards";

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [period, setPeriod] = useState<ReportPeriod>("month");

  useEffect(() => {
    async function loadSummary() {
      try {
        setLoading(true);
        setError("");
        setSummary(await getReportsSummary(period));
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

    void loadSummary();
  }, [period]);

  return (
    <Box sx={{ pb: 4 }}>
      <Stack
        direction={{ xs: "column", md: "row" }}
        justifyContent="space-between"
        alignItems={{ xs: "stretch", md: "center" }}
        spacing={2}
        sx={{ mb: 3 }}
      >
        <Box>
          <Stack direction="row" spacing={1.25} alignItems="center">
            <AssessmentRoundedIcon color="primary" sx={{ fontSize: 34 }} />
            <Typography variant="h4" fontWeight={900}>
              Raporty
            </Typography>
          </Stack>

          <Typography color="text.secondary" sx={{ mt: 0.75 }}>
            Podsumowanie aktywności stajni, jazd, klientów, koni i instruktorów.
          </Typography>
        </Box>

        <ReportsFilters period={period} onChange={setPeriod} />
      </Stack>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <Box sx={{ minHeight: 360, display: "grid", placeItems: "center" }}>
          <CircularProgress />
        </Box>
      ) : (
        <Stack spacing={3}>
          <SummaryCards summary={summary} />

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: {
                xs: "1fr",
                xl: "repeat(3, minmax(0, 1fr))",
              },
              gap: 3,
            }}
          >
            <HorsesTable period={period} />
            <InstructorsTable period={period} />
            <ClientsTable period={period} />
          </Box>
        </Stack>
      )}
    </Box>
  );
}