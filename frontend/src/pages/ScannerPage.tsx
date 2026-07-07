import { Card, CardContent, TextField, Typography } from "@mui/material";

export function ScannerPage() {
  return (
    <>
      <Typography variant="h4" fontWeight={800} gutterBottom>
        Skaner
      </Typography>

      <Card elevation={0} sx={{ maxWidth: 600, border: "1px solid #e5e7eb" }}>
        <CardContent>
          <Typography sx={{ mb: 2 }}>
            Zeskanuj kartę klienta, kod QR lub RFID.
          </Typography>

          <TextField
            autoFocus
            fullWidth
            label="Czekam na skan..."
            placeholder="np. 100001"
          />
        </CardContent>
      </Card>
    </>
  );
}