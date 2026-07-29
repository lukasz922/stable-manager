import { api } from "./client";

export type ReportPeriod = "today" | "week" | "month";

export type ReportsSummary = {
  period: ReportPeriod;
  total_rides: number;
  planned_rides: number;
  checked_in_rides: number;
  completed_rides: number;
  cancelled_rides: number;
  active_clients: number;
  active_horses: number;
  active_instructors: number;
  active_passes: number;
  expiring_passes: number;
};

export async function getReportsSummary(
  period: ReportPeriod = "month",
): Promise<ReportsSummary> {
  const { data } = await api.get<ReportsSummary>(
    "/reports/summary",
    { params: { period } },
  );

  return data;
}

export type HorseReport = {
  horse_id: number;
  horse_name: string;
  rides: number;
};

export async function getHorsesReport(
  period: ReportPeriod = "month",
): Promise<HorseReport[]> {
  const { data } = await api.get<HorseReport[]>(
    "/reports/horses",
    { params: { period } },
  );

  return data;
}

export type InstructorReport = {
  instructor_id: number;
  instructor_name: string;
  rides: number;
};

export async function getInstructorsReport(
  period: ReportPeriod = "month",
): Promise<InstructorReport[]> {
  const { data } = await api.get<InstructorReport[]>(
    "/reports/instructors",
    { params: { period } },
  );

  return data;
}

export type ClientReport = {
  client_id: number;
  client_name: string;
  rides: number;
};

export async function getClientsReport(
  period: ReportPeriod = "month",
): Promise<ClientReport[]> {
  const { data } = await api.get<ClientReport[]>(
    "/reports/clients",
    { params: { period } },
  );

  return data;
}