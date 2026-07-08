const API = "http://localhost:8000";

export type Ride = {
  id: number;
  client_id: number;
  horse_id: number;
  instructor_id: number;
  start_time: string;
  duration_minutes: number;
  ride_type: string;
  status: string;
  notes?: string | null;
};

export type RideCreate = {
  client_id: number;
  horse_id: number;
  instructor_id: number;

  client_name?: string | null;
  horse_name?: string | null;
  instructor_name?: string | null;

  start_time: string;
  duration_minutes: number;
  ride_type: string;
  status: string;
  notes?: string;
};

export async function getRides(): Promise<Ride[]> {
  const response = await fetch(`${API}/rides`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać jazd.");
  }

  return response.json();
}

export async function createRide(data: RideCreate): Promise<Ride> {
  const response = await fetch(`${API}/rides`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się dodać jazdy.");
  }

  return response.json();
}

export async function updateRide(
  id: number,
  data: RideCreate
): Promise<Ride> {
  const response = await fetch(`${API}/rides/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować jazdy.");
  }

  return response.json();
}

export async function deleteRide(id: number): Promise<void> {
  const response = await fetch(`${API}/rides/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Nie udało się usunąć jazdy.");
  }
}