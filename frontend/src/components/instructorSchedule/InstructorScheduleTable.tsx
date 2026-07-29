import {
  Avatar,
  Box,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Tooltip,
  Typography,
} from "@mui/material";
import AddRoundedIcon from "@mui/icons-material/AddRounded";

import type { Instructor } from "../../api/instructors";
import type { InstructorSchedule } from "../../api/instructorSchedule";

interface Props {
  instructors: Instructor[];
  schedule: InstructorSchedule[];
  year: number;
  month: number;
  onCellClick: (instructorId: number, date: string) => void;
}

const weekDays = ["Nd", "Pn", "Wt", "Śr", "Czw", "Pt", "Sob"];

const statusInfo: Record<
  string,
  { label: string; background: string; accent: string }
> = {
  WORK: { label: "Praca", background: "#edf7ed", accent: "#2e7d32" },
  OFF: { label: "Wolne", background: "#f5f5f5", accent: "#616161" },
  VACATION: { label: "Urlop", background: "#eaf3ff", accent: "#1976d2" },
  SICK: { label: "Chorobowe", background: "#fff0f0", accent: "#d32f2f" },
  TRAINING: { label: "Szkolenie", background: "#fff6e8", accent: "#ed6c02" },
};

function formatTime(value?: string | null) {
  return value ? value.slice(0, 5) : "—";
}

function initials(instructor: Instructor) {
  return `${instructor.first_name?.[0] ?? ""}${instructor.last_name?.[0] ?? ""}`.toUpperCase();
}

export function InstructorScheduleTable({
  instructors,
  schedule,
  year,
  month,
  onCellClick,
}: Props) {
  const daysInMonth = new Date(year, month, 0).getDate();
  const days = Array.from({ length: daysInMonth }, (_, index) => index + 1);
  const todayKey = new Date().toISOString().slice(0, 10);

  const scheduleMap = new Map<string, InstructorSchedule>();
  schedule.forEach((entry) => {
    scheduleMap.set(`${entry.instructor_id}-${entry.date.slice(0, 10)}`, entry);
  });

  return (
    <Paper
      elevation={0}
      sx={{
        overflow: "auto",
        maxHeight: "calc(100vh - 310px)",
        minHeight: 420,
        border: "1px solid",
        borderColor: "divider",
        borderRadius: 3,
      }}
    >
      <Table
        size="small"
        stickyHeader
        sx={{ minWidth: Math.max(860, 112 + instructors.length * 170) }}
      >
        <TableHead>
          <TableRow>
            <TableCell
              sx={{
                position: "sticky",
                left: 0,
                zIndex: 6,
                width: 112,
                minWidth: 112,
                bgcolor: "background.paper",
                borderRight: 1,
                borderColor: "divider",
              }}
            >
              <Typography fontWeight={800}>Data</Typography>
            </TableCell>

            {instructors.map((instructor) => (
              <TableCell
                key={instructor.id}
                align="center"
                sx={{
                  minWidth: 170,
                  bgcolor: "background.paper",
                  borderBottom: 1,
                  borderColor: "divider",
                }}
              >
                <StackHeader instructor={instructor} />
              </TableCell>
            ))}
          </TableRow>
        </TableHead>

        <TableBody>
          {days.map((day) => {
            const dateObject = new Date(year, month - 1, day);
            const dayOfWeek = dateObject.getDay();
            const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
            const date = `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(2, "0")}`;
            const isToday = date === todayKey;

            return (
              <TableRow key={day}>
                <TableCell
                  sx={{
                    position: "sticky",
                    left: 0,
                    zIndex: 3,
                    height: 92,
                    bgcolor: isToday
                      ? "primary.50"
                      : isWeekend
                        ? "action.hover"
                        : "background.paper",
                    borderRight: 1,
                    borderColor: "divider",
                  }}
                >
                  <Typography fontWeight={800} color={isToday ? "primary.main" : "text.primary"}>
                    {String(day).padStart(2, "0")}.{String(month).padStart(2, "0")}
                  </Typography>
                  <Typography
                    variant="caption"
                    color={isWeekend || isToday ? "primary.main" : "text.secondary"}
                    fontWeight={isWeekend || isToday ? 700 : 400}
                  >
                    {weekDays[dayOfWeek]}
                    {isToday ? " · dziś" : ""}
                  </Typography>
                </TableCell>

                {instructors.map((instructor) => {
                  const entry = scheduleMap.get(`${instructor.id}-${date}`);
                  const info = entry ? statusInfo[entry.status] : null;

                  return (
                    <Tooltip
                      key={instructor.id}
                      title={entry?.note || (entry ? "Kliknij, aby edytować" : "Kliknij, aby dodać wpis")}
                      arrow
                    >
                      <TableCell
                        align="center"
                        onClick={() => onCellClick(instructor.id, date)}
                        sx={{
                          cursor: "pointer",
                          minWidth: 170,
                          height: 92,
                          px: 1,
                          py: 1,
                          bgcolor: info?.background ?? (isWeekend ? "rgba(25,118,210,0.025)" : "background.paper"),
                          borderLeft: entry ? `4px solid ${info?.accent}` : undefined,
                          transition: "transform 120ms ease, box-shadow 120ms ease",
                          "&:hover": {
                            boxShadow: "inset 0 0 0 2px",
                            boxShadowColor: "primary.light",
                          },
                        }}
                      >
                        {entry ? (
                          <Box>
                            <Typography fontWeight={800} fontSize={13} sx={{ color: info?.accent }}>
                              {info?.label ?? entry.status}
                            </Typography>

                            {entry.status === "WORK" && (
                              <>
                                <Typography variant="caption" display="block" sx={{ mt: 0.5 }}>
                                  Praca {formatTime(entry.start_time)}–{formatTime(entry.end_time)}
                                </Typography>
                                <Typography variant="caption" color="text.secondary" display="block">
                                  Dysp. {formatTime(entry.availability_start_time)}–{formatTime(entry.availability_end_time)}
                                </Typography>
                              </>
                            )}

                            {entry.note && (
                              <Typography variant="caption" color="text.secondary" noWrap display="block">
                                {entry.note}
                              </Typography>
                            )}
                          </Box>
                        ) : (
                          <Box sx={{ display: "grid", placeItems: "center", color: "text.disabled" }}>
                            <AddRoundedIcon />
                            <Typography variant="caption">Dodaj</Typography>
                          </Box>
                        )}
                      </TableCell>
                    </Tooltip>
                  );
                })}
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </Paper>
  );
}

function StackHeader({ instructor }: { instructor: Instructor }) {
  return (
    <Box sx={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 1 }}>
      <Avatar sx={{ width: 32, height: 32, fontSize: 12, fontWeight: 800 }}>
        {initials(instructor)}
      </Avatar>
      <Box sx={{ textAlign: "left" }}>
        <Typography fontWeight={800} fontSize={13} lineHeight={1.2}>
          {instructor.first_name}
        </Typography>
        <Typography fontWeight={800} fontSize={13} lineHeight={1.2}>
          {instructor.last_name}
        </Typography>
      </Box>
    </Box>
  );
}