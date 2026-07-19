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
  getInstructorsReport,
  type InstructorReport,
} from "../../api/reports";

import type { ReportPeriod } from "../../api/reports";

type Props = {
  period: ReportPeriod;
};

export function InstructorsTable({ period }: Props) {
  const [instructors, setInstructors] = useState<InstructorReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        setError("");

        const data = await getInstructorsReport(period);
        setInstructors(data);
      } catch (err) {
        console.error(err);
        setError("Nie udało się pobrać raportu instruktorów.");
      } finally {
        setLoading(false);
      }
    };

    void load();
 }, [period]);

  return (
    <Box mt={5}>
      <Typography variant="h5" mb={2}>
        Najbardziej aktywni instruktorzy
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
                <TableCell>Instruktor</TableCell>
                <TableCell align="right">Liczba jazd</TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {instructors.map((instructor, index) => (
                <TableRow key={instructor.instructor_id}>
                  <TableCell>{index + 1}</TableCell>
                  <TableCell>{instructor.instructor_name}</TableCell>
                  <TableCell align="right">
                    {instructor.rides}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}
    </Box>
  );
}