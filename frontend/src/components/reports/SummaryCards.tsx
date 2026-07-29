import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import EventRoundedIcon from "@mui/icons-material/EventRounded";
import EventAvailableRoundedIcon from "@mui/icons-material/EventAvailableRounded";
import HowToRegRoundedIcon from "@mui/icons-material/HowToRegRounded";
import TaskAltRoundedIcon from "@mui/icons-material/TaskAltRounded";
import EventBusyRoundedIcon from "@mui/icons-material/EventBusyRounded";
import PeopleRoundedIcon from "@mui/icons-material/PeopleRounded";
import PetsRoundedIcon from "@mui/icons-material/PetsRounded";
import SchoolRoundedIcon from "@mui/icons-material/SchoolRounded";
import ConfirmationNumberRoundedIcon from "@mui/icons-material/ConfirmationNumberRounded";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

import type { ReportsSummary } from "../../api/reports";

type SummaryCardsProps = {
  summary: ReportsSummary | null;
};

const cards = [
  { key: "total_rides", label: "Wszystkie jazdy", icon: EventRoundedIcon },
  { key: "planned_rides", label: "Zaplanowane", icon: EventAvailableRoundedIcon },
  { key: "checked_in_rides", label: "Klient obecny", icon: HowToRegRoundedIcon },
  { key: "completed_rides", label: "Zakończone", icon: TaskAltRoundedIcon },
  { key: "cancelled_rides", label: "Anulowane", icon: EventBusyRoundedIcon },
  { key: "active_clients", label: "Aktywni klienci", icon: PeopleRoundedIcon },
  { key: "active_horses", label: "Dostępne konie", icon: PetsRoundedIcon },
  { key: "active_instructors", label: "Aktywni instruktorzy", icon: SchoolRoundedIcon },
  { key: "active_passes", label: "Aktywne karnety", icon: ConfirmationNumberRoundedIcon },
  { key: "expiring_passes", label: "Wygasają w 7 dni", icon: WarningAmberRoundedIcon },
] as const;

export function SummaryCards({ summary }: SummaryCardsProps) {
  return (
    <Box
      sx={{
        display: "grid",
        gridTemplateColumns: {
          xs: "repeat(2, minmax(0, 1fr))",
          md: "repeat(5, minmax(0, 1fr))",
        },
        gap: 2,
      }}
    >
      {cards.map((card) => {
        const Icon = card.icon;
        const value = summary?.[card.key] ?? 0;

        return (
          <Card
            key={card.key}
            elevation={0}
            sx={{
              border: "1px solid",
              borderColor: "divider",
              borderRadius: 4,
              minWidth: 0,
            }}
          >
            <CardContent sx={{ p: 2.25, "&:last-child": { pb: 2.25 } }}>
              <Box
                sx={{
                  width: 38,
                  height: 38,
                  borderRadius: 2.5,
                  bgcolor: card.key === "expiring_passes" ? "warning.50" : "primary.50",
                  color: card.key === "expiring_passes" ? "warning.main" : "primary.main",
                  display: "grid",
                  placeItems: "center",
                  mb: 1.5,
                }}
              >
                <Icon fontSize="small" />
              </Box>

              <Typography
                variant="body2"
                color="text.secondary"
                fontWeight={700}
                noWrap
              >
                {card.label}
              </Typography>

              <Typography variant="h4" fontWeight={900}>
                {value}
              </Typography>
            </CardContent>
          </Card>
        );
      })}
    </Box>
  );
}