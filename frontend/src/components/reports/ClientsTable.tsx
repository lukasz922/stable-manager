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
  getClientsReport,
  type ClientReport,
} from "../../api/reports";

import type { ReportPeriod } from "../../api/reports";

type Props = {
  period: ReportPeriod;
};

export function ClientsTable({ period }: Props) {
  const [clients, setClients] = useState<ClientReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

const data = await getClientsReport(period);
        setClients(data);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać raportu klientów.");
      } finally {
        setLoading(false);
      }
    };

    void load();
 }, [period]);

  return (
    <Box mt={5}>
      <Typography variant="h5" mb={2}>
        Najbardziej aktywni klienci
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
                <TableCell>Klient</TableCell>
                <TableCell align="right">Liczba jazd</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {clients.map((client, index) => (
                <TableRow key={client.client_id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{client.client_name}</TableCell>
                  <TableCell align="right">{client.rides}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}