import { api } from "./client";

export type PassHistoryItem = {
  id: number;
  pass_id: number;
  ride_id?: number | null;
  operation: "DEDUCT" | "RESTORE";
  entries: number;
  note?: string | null;
  created_at: string;
  ride_date?: string | null;
  ride_start_time?: string | null;
  horse_name?: string | null;
  client_name?: string | null;
  instructor_name?: string | null;
};

export async function getPassHistory(
  passId: number
): Promise<PassHistoryItem[]> {
  const { data } = await api.get<PassHistoryItem[]>(
    `/pass-history/${passId}`
  );

  return data;
}