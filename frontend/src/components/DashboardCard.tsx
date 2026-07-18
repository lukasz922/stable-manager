import { Card, CardContent, Typography } from "@mui/material";

type DashboardCardProps = {
  icon: string;
  title: string;
  value: number | string;
  color: string;
};

export default function DashboardCard({
  icon,
  title,
  value,
  color,
}: DashboardCardProps) {
  return (
    <Card
      elevation={0}
      sx={{
        border: "1px solid #e5e7eb",
        borderRadius: 3,
        height: "100%",
        transition: "0.25s",
        cursor: "default",

        "&:hover": {
          transform: "translateY(-4px)",
          boxShadow: "0 8px 20px rgba(0,0,0,.08)",
        },
      }}
    >
      <CardContent>
       <Typography
  sx={{
    fontSize: 40,
    mb: 1,
    color,
  }}
>
          {icon}
        </Typography>

        <Typography
          color="text.secondary"
          fontWeight={600}
        >
          {title}
        </Typography>

        <Typography
  variant="h3"
  fontWeight={800}
  sx={{
    mt: 1,
    color,
  }}
>
          {value}
        </Typography>
      </CardContent>
    </Card>
  );
}