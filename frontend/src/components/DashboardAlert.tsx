import { Card, CardContent, Typography } from "@mui/material";

type DashboardAlertProps = {
  title: string;
  children: React.ReactNode;
};

export default function DashboardAlert({
  title,
  children,
}: DashboardAlertProps) {
  return (
    <Card
      elevation={0}
      sx={{
        mt: 4,
        border: "1px solid #e5e7eb",
        borderRadius: 3,
      }}
    >
      <CardContent>
        <Typography
          variant="h5"
          fontWeight={700}
          gutterBottom
        >
          ⚠️ {title}
        </Typography>

        {children}
      </CardContent>
    </Card>
  );
}