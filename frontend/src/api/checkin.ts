const API = "http://localhost:8000";

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
  rfid_uid: string
): Promise<CheckInResponse> {
  const response = await fetch(`${API}/check-in/rfid`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      rfid_uid,
    }),
  });

  if (!response.ok) {
    const data = await response.json();
    throw new Error(data.detail);
  }

  return response.json();
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
  data: QuickRideRequest
): Promise<QuickRideResponse> {
  const response = await fetch(`${API}/check-in/quick-ride`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.detail ?? "Nie udało się utworzyć jazdy.");
  }

  return response.json();
}