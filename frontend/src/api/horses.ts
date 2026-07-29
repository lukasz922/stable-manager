import { api } from "./client";

export type Horse = {
  id: number;
  code: string | null;
  name: string;
  breed?: string | null;
  gender?: string | null;
  color?: string | null;
  height_cm?: number | null;
  max_rider_weight?: number | null;
  max_lessons_per_day: number;
  status: string;
  notes?: string | null;
};

export interface HorseCreate {
  name: string;
  breed?: string;
  gender?: string;
  color?: string;
  height_cm?: number;
  max_rider_weight?: number;
  max_lessons_per_day: number;
  status: string;
  notes?: string;
}

export async function getHorses(): Promise<Horse[]> {
  const { data } = await api.get<Horse[]>("/horses");
  return data;
}

export async function createHorse(
  payload: HorseCreate
): Promise<Horse> {
  const { data } = await api.post<Horse>("/horses", payload);
  return data;
}

export async function updateHorse(
  horseId: number,
  payload: HorseCreate
): Promise<Horse> {
  const { data } = await api.put<Horse>(
    `/horses/${horseId}`,
    payload
  );

  return data;
}

export async function deleteHorse(
  horseId: number
): Promise<void> {
  await api.delete(`/horses/${horseId}`);
}