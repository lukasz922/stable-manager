const API = "http://localhost:8000";

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

export async function getHorses(): Promise<Horse[]> {
  const response = await fetch(`${API}/horses`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać koni.");
  }

  return response.json();
}

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

export async function createHorse(data: HorseCreate): Promise<Horse> {
  const response = await fetch(`${API}/horses`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się dodać konia.");
  }

  return response.json();
}

export async function deleteHorse(id: number): Promise<void> {
  const response = await fetch(`${API}/horses/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Nie udało się usunąć konia.");
  }
}

export async function updateHorse(id: number, data: HorseCreate): Promise<Horse> {
  const response = await fetch(`${API}/horses/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować konia.");
  }

  return response.json();
}