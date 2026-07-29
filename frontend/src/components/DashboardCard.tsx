import type { ReactNode } from "react";
import {
  Box,
  Card,
  CardContent,
  Typography,
} from "@mui/material";

type DashboardCardProps = {
  icon: ReactNode;
  title: string;
  value: number | string;
  accent: string;
  subtitle?: string;
};

export default function DashboardCard({
  icon,
  title,
  value,
  accent,
  subtitle,
}: DashboardCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        height: "100%",
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 4,
        background:
          "linear-gradient(145deg, #ffffff 0%, #fbfcff 100%)",
        transition:
          "transform 180ms ease, box-shadow 180ms ease",
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 14px 30px rgba(15, 23, 42, 0.08)",
        },
      }}
    >
      <CardContent sx={{ p: 2.5, "&:last-child": { pb: 2.5 } }}>
        <Box
          sx={{
            width: 46,
            height: 46,
            borderRadius: 3,
            display: "grid",
            placeItems: "center",
            color: accent,
            backgroundColor: `${accent}14`,
            mb: 2,
          }}
        >
          {icon}
        </Box>

        <Typography
          variant="body2"
          color="text.secondary"
          fontWeight={700}
        >
          {title}
        </Typography>

        <Typography
          variant="h3"
          fontWeight={800}
          sx={{ mt: 0.5, color: "text.primary" }}
        >
          {value}
        </Typography>

        {subtitle && (
          <Typography
            variant="caption"
            color="text.secondary"
            sx={{ display: "block", mt: 0.5 }}
          >
            {subtitle}
          </Typography>
        )}
      </CardContent>
    </Card>
  );
}