import { Card, CardContent, Grid, Typography } from "@mui/material";

const stats = [
  { label: "Dzisiejsze jazdy", value: "12" },
  { label: "Aktywni klienci", value: "43" },
  { label: "Konie", value: "18" },
  { label: "Dzisiejszy obrót", value: "1780 zł" },
];

export function DashboardPage() {
  return (
    <>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Dashboard
      </Typography>

      <Typography color="text.secondary" sx={{ mb: 3 }}>
        Podsumowanie pracy stajni na dziś.
      </Typography>

      <Grid container spacing={3}>
        {stats.map((stat) => (
          <Grid item xs={12} sm={6} md={3} key={stat.label}>
            <Card elevation={0} sx={{ border: "1px solid #e5e7eb" }}>
              <CardContent>
                <Typography color="text.secondary">{stat.label}</Typography>
                <Typography variant="h4" fontWeight={800}>
                  {stat.value}
                </Typography>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>
    </>
  );
}