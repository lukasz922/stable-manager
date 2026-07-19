import { useEffect, useState } from "react";
import {
  Alert,
  Box,
  CircularProgress,
  Typography,
} from "@mui/material";

import {
  getReportsSummary,
  type ReportsSummary,
} from "../api/reports";
import { SummaryCards } from "../components/reports/SummaryCards";
import { HorsesTable } from "../components/reports/HorsesTable";
import { InstructorsTable } from "../components/reports/InstructorsTable";
import { ClientsTable } from "../components/reports/ClientsTable";
import { ReportsFilters } from "../components/reports/ReportsFilters";

export default function ReportsPage() {
  const [summary, setSummary] = useState<ReportsSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
const [period, setPeriod] = useState<
  "today" | "week" | "month" | "custom"
>("month");

  useEffect(() => {
    const loadSummary = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getReportsSummary();
        setSummary(data);
      } catch (err) {
        console.error("Nie udało się pobrać raportów:", err);
        setError("Nie udało się pobrać danych raportu.");
      } finally {
        setLoading(false);
      }
    };

    void loadSummary();
  }, []);

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} mb={1}>
        Raporty
      </Typography>

      <Typography color="text.secondary" mb={3}>
        Podsumowanie najważniejszych danych stajni
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {loading ? (
  <Box
    sx={{
      display: "flex",
      justifyContent: "center",
      py: 8,
    }}
  >
    <CircularProgress />
  </Box>
) : (
  <>
 <ReportsFilters
  period={period}
  onChange={setPeriod}
/>
  <SummaryCards summary={summary} />

<HorsesTable period={period} />

<InstructorsTable period={period} />

<ClientsTable period={period} />
</>
)}
    </Box>
  );
}