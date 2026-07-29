import { api } from "./client";

export type PassSummary = {
  id: number;
  name: string;
  remaining_entries: number;
  valid_until: string;
};

export type CheckInResponse = {
  mode: "planned" | "quick_ride";
  client_id: number;
  client_name: string;
  ride_id: number | null;
  ride_time: string | null;
  ride_status: string | null;
  horse_name?: string | null;
  instructor_name?: string | null;
  passes: PassSummary[];
};

export async function checkInRFID(
  rfidUid: string
): Promise<CheckInResponse> {
  const { data } = await api.post<CheckInResponse>(
    "/check-in/rfid",
    {
      rfid_uid: rfidUid,
    }
  );

  return data;
}

export type QuickRideRequest = {
  client_id: number;
  pass_id: number;
  horse_id: number;
  instructor_id: number;
  duration_minutes: number;
};

export type QuickRideResponse = {
  ride_id: number;
  status: string;
};

export async function createQuickRide(
  payload: QuickRideRequest
): Promise<QuickRideResponse> {
  const { data } = await api.post<QuickRideResponse>(
    "/check-in/quick-ride",
    payload
  );

  return data;
}