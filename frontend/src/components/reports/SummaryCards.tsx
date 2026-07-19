import {
  Card,
  CardContent,
  Grid,
  Typography,
} from "@mui/material";

import type { ReportsSummary } from "../../api/reports";

type SummaryCardsProps = {
  summary: ReportsSummary | null;
};

const reportCards: Array<{
  key: keyof ReportsSummary;
  label: string;
}> = [
  { key: "rides_today", label: "Jazdy dzisiaj" },
  { key: "rides_week", label: "Jazdy w tym tygodniu" },
  { key: "rides_month", label: "Jazdy w tym miesiącu" },
  { key: "active_clients", label: "Klienci" },
  { key: "active_horses", label: "Dostępne konie" },
  { key: "active_instructors", label: "Aktywni instruktorzy" },
  { key: "active_passes", label: "Aktywne karnety" },
  { key: "expiring_passes", label: "Kończące się karnety" },
];

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <Grid container spacing={3}>
      {reportCards.map((card) => (
        <Grid key={card.key} size={{ xs: 12, sm: 6, md: 3 }}>
          <Card sx={{ height: "100%" }}>
            <CardContent>
              <Typography
                variant="body2"
                color="text.secondary"
                gutterBottom
              >
                {card.label}
              </Typography>

              <Typography variant="h3" fontWeight={700}>
                {summary?.[card.key] ?? 0}
              </Typography>
            </CardContent>
          </Card>
        </Grid>
      ))}
    </Grid>
  );
}