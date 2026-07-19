import { useEffect, useState } from "react";

import {
  Alert,
  Box,
  CircularProgress,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Typography,
} from "@mui/material";

import {
  getHorsesReport,
  type HorseReport,
} from "../../api/reports";

import type { ReportPeriod } from "../../api/reports";

type Props = {
  period: ReportPeriod;
};

export function HorsesTable({ period }: Props) {
  const [horses, setHorses] = useState<HorseReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getHorsesReport(period);
        setHorses(data);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać raportu koni.");
      } finally {
        setLoading(false);
      }
    };

    void load();
  }, [period]);

  return (
    <Box mt={5}>
      <Typography variant="h5" mb={2}>
        Najczęściej jeżdżące konie
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {loading ? (
        <CircularProgress />
      ) : (
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>Miejsce</TableCell>
                <TableCell>Koń</TableCell>
                <TableCell align="right">Liczba jazd</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {horses.map((horse, index) => (
                <TableRow key={horse.horse_id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{horse.horse_name}</TableCell>
                  <TableCell align="right">{horse.rides}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}