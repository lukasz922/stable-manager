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
        borderColor: "rgba(148, 163, 184, 0.22)",
        borderRadius: 3.5,
        background: "#ffffff",
        boxShadow: "0 10px 28px rgba(15, 23, 42, 0.05)",
        overflow: "hidden",
        position: "relative",
        transition:
          "transform 180ms ease, box-shadow 180ms ease, border-color 180ms ease",
        "&::before": {
          content: '""',
          position: "absolute",
          inset: "0 0 auto 0",
          height: 3,
          bgcolor: accent,
        },
        "&:hover": {
          transform: "translateY(-3px)",
          boxShadow: "0 16px 34px rgba(15, 23, 42, 0.08)",
          borderColor: `${accent}55`,
        },
      }}
    >
      <CardContent
        sx={{
          p: 2.25,
          "&:last-child": { pb: 2.25 },
          display: "flex",
          alignItems: "center",
          gap: 1.75,
          minHeight: 116,
        }}
      >
        <Box
          sx={{
            width: 48,
            height: 48,
            flexShrink: 0,
            borderRadius: "50%",
            display: "grid",
            placeItems: "center",
            color: accent,
            backgroundColor: `${accent}14`,
          }}
        >
          {icon}
        </Box>

        <Box sx={{ minWidth: 0 }}>
          <Typography
            variant="body2"
            color="text.secondary"
            fontWeight={700}
            noWrap
          >
            {title}
          </Typography>

          <Typography
            variant="h4"
            fontWeight={900}
            sx={{ mt: 0.25, color: "text.primary", lineHeight: 1.1 }}
          >
            {value}
          </Typography>

          {subtitle && (
            <Typography
              variant="caption"
              sx={{ display: "block", mt: 0.5, color: accent, fontWeight: 700 }}
            >
              {subtitle}
            </Typography>
          )}
        </Box>
      </CardContent>
    </Card>
  );
}