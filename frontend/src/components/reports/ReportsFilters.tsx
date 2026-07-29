import {
  Paper,
  ToggleButton,
  ToggleButtonGroup,
} from "@mui/material";
import CalendarTodayRoundedIcon from "@mui/icons-material/CalendarTodayRounded";
import DateRangeRoundedIcon from "@mui/icons-material/DateRangeRounded";
import CalendarMonthRoundedIcon from "@mui/icons-material/CalendarMonthRounded";

import type { ReportPeriod } from "../../api/reports";

type ReportsFiltersProps = {
  period: ReportPeriod;
  onChange: (value: ReportPeriod) => void;
};

export function ReportsFilters({
  period,
  onChange,
}: ReportsFiltersProps) {
  return (
    <Paper
      elevation={0}
      sx={{
        p: 0.5,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <ToggleButtonGroup
        exclusive
        value={period}
        onChange={(_, value: ReportPeriod | null) => {
          if (value) onChange(value);
        }}
        size="small"
        sx={{
          width: { xs: "100%", sm: "auto" },
          "& .MuiToggleButton-root": {
            flex: { xs: 1, sm: "initial" },
            px: 2,
            textTransform: "none",
            fontWeight: 800,
            border: 0,
            borderRadius: "10px !important",
          },
        }}
      >
        <ToggleButton value="today">
          <CalendarTodayRoundedIcon fontSize="small" sx={{ mr: 0.75 }} />
          Dzisiaj
        </ToggleButton>
        <ToggleButton value="week">
          <DateRangeRoundedIcon fontSize="small" sx={{ mr: 0.75 }} />
          Tydzień
        </ToggleButton>
        <ToggleButton value="month">
          <CalendarMonthRoundedIcon fontSize="small" sx={{ mr: 0.75 }} />
          Miesiąc
        </ToggleButton>
      </ToggleButtonGroup>
    </Paper>
  );
}