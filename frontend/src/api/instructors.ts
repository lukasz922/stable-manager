const API = "http://localhost:8000";

export type Instructor = {
  id: number;
  code: string | null;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  specialization?: string | null;
  hourly_rate?: number | null;
  status: string;
  notes?: string | null;
};

export type InstructorCreate = {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  specialization?: string;
  hourly_rate?: number;
  status: string;
  notes?: string;
};

export async function getInstructors(): Promise<Instructor[]> {
  const response = await fetch(`${API}/instructors`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać instruktorów.");
  }

  return response.json();
}


export async function createInstructor(
  data: InstructorCreate
): Promise<Instructor> {
  const response = await fetch(`${API}/instructors`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się dodać instruktora.");
  }

  return response.json();
}