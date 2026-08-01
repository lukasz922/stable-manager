import { api } from "./client";

export type Ride = {
  id: number;
  client_id: number;
  horse_id: number | null;
  instructor_id: number;
  client_name?: string | null;
  horse_name?: string | null;
  instructor_name?: string | null;
  start_time: string;
  duration_minutes: number;
  ride_type: string;
  status: string;
  notes?: string | null;
};

export type RideCreate = {
  client_id: number;
  horse_id: number | null;
  instructor_id: number;
  start_time: string;
  duration_minutes: number;
  ride_type: string;
  status: string;
  notes?: string;
};

export async function getRides(): Promise<Ride[]> {
  const { data } = await api.get<Ride[]>("/rides");
  return data;
}

export async function createRide(
  payload: RideCreate
): Promise<Ride> {
  const { data } = await api.post<Ride>("/rides", payload);
  return data;
}

export async function updateRide(
  rideId: number,
  payload: RideCreate
): Promise<Ride> {
  const { data } = await api.put<Ride>(
    `/rides/${rideId}`,
    payload
  );

  return data;
}

export async function deleteRide(
  rideId: number
): Promise<void> {
  await api.delete(`/rides/${rideId}`);
}

export async function getRide(
  rideId: number
): Promise<Ride> {
  const { data } = await api.get<Ride>(`/rides/${rideId}`);
  return data;
}