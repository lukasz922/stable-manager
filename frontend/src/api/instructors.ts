import { api } from "./client";

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
  user_id?: number | null;
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
  const { data } = await api.get<Instructor[]>("/instructors");
  return data;
}

export async function createInstructor(
  payload: InstructorCreate
): Promise<Instructor> {
  const { data } = await api.post<Instructor>(
    "/instructors",
    payload
  );

  return data;
}

export async function updateInstructor(
  instructorId: number,
  payload: InstructorCreate
): Promise<Instructor> {
  const { data } = await api.put<Instructor>(
    `/instructors/${instructorId}`,
    payload
  );

  return data;
}

export async function deleteInstructor(
  instructorId: number
): Promise<void> {
  await api.delete(`/instructors/${instructorId}`);
}

export async function linkInstructorUser(
  instructorId: number,
  userId: number
): Promise<Instructor> {
  const { data } = await api.put<Instructor>(
    `/instructors/${instructorId}/user`,
    { user_id: userId }
  );

  return data;
}

export async function unlinkInstructorUser(
  instructorId: number
): Promise<Instructor> {
  const { data } = await api.delete<Instructor>(
    `/instructors/${instructorId}/user`
  );

  return data;
}