import {
  Box,
  Button,
  Stack,
} from "@mui/material";

type ReportsFiltersProps = {
  period: "today" | "week" | "month" | "custom";
  onChange: (
    value: "today" | "week" | "month" | "custom"
  ) => void;
};

export function ReportsFilters({
  period,
  onChange,
}: ReportsFiltersProps) {
  return (
    <Box mb={4}>
      <Stack direction="row" spacing={2}>
     <Button
  variant={period === "today" ? "contained" : "outlined"}
  onClick={() => onChange("today")}
>
  Dzisiaj
</Button>

        <Button
  variant={period === "week" ? "contained" : "outlined"}
  onClick={() => onChange("week")}
  >
          Tydzień
        </Button>

      <Button
  variant={period === "month" ? "contained" : "outlined"}
  onClick={() => onChange("month")}
>
  Miesiąc
</Button>

        <Button
  variant={period === "custom" ? "contained" : "outlined"}
  onClick={() => onChange("custom")}
>
  Zakres
</Button>
      </Stack>
    </Box>
  );
}