const API = "http://localhost:8000";

export type ReportPeriod = "today" | "week" | "month";

export type ReportsSummary = {
  rides_today: number;
  rides_week: number;
  rides_month: number;
  active_clients: number;
  active_horses: number;
  active_instructors: number;
  active_passes: number;
  expiring_passes: number;
};

export async function getReportsSummary(): Promise<ReportsSummary> {
  const response = await fetch(`${API}/reports/summary`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać raportów.");
  }

  return response.json();
}

export type HorseReport = {
  horse_id: number;
  horse_name: string;
  rides: number;
};

export async function getHorsesReport(
  period: ReportPeriod = "month"
): Promise<HorseReport[]> {
  const response = await fetch(
    `${API}/reports/horses?period=${period}`
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać raportu koni.");
  }

  return response.json();
}

export type InstructorReport = {
  instructor_id: number;
  instructor_name: string;
  rides: number;
};

export async function getInstructorsReport(
  period: ReportPeriod = "month"
): Promise<InstructorReport[]> {
  const response = await fetch(
    `${API}/reports/instructors?period=${period}`
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać raportu instruktorów.");
  }

  return response.json();
}

export type ClientReport = {
  client_id: number;
  client_name: string;
  rides: number;
};

export async function getClientsReport(
  period: ReportPeriod = "month"
): Promise<ClientReport[]> {
  const response = await fetch(
    `${API}/reports/clients?period=${period}`
  );

  if (!response.ok) {
    throw new Error("Nie udało się pobrać raportu klientów.");
  }

  return response.json();
}