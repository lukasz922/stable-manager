import type { ReactNode } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";
import WarningAmberRoundedIcon from "@mui/icons-material/WarningAmberRounded";

type DashboardAlertProps = {
  title: string;
  children: ReactNode;
};

export default function DashboardAlert({
  title,
  children,
}: DashboardAlertProps) {
  return (
    <Card
      elevation={0}
      sx={{
        mt: 3,
        border: "1px solid",
        borderColor: "warning.light",
        borderRadius: 4,
        background:
          "linear-gradient(135deg, rgba(255, 248, 230, 0.96), #ffffff)",
      }}
    >
      <CardContent sx={{ p: 3, "&:last-child": { pb: 3 } }}>
        <Box
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.25,
            mb: 2,
          }}
        >
          <Box
            sx={{
              width: 40,
              height: 40,
              borderRadius: 2.5,
              display: "grid",
              placeItems: "center",
              color: "warning.dark",
              bgcolor: "warning.light",
            }}
          >
            <WarningAmberRoundedIcon />
          </Box>

          <Typography variant="h6" fontWeight={800}>
            {title}
          </Typography>
        </Box>

        {children}
      </CardContent>
    </Card>
  );
}