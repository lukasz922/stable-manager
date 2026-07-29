import { api } from "./client";

export interface MyInstructorProfile {
  id: number;
  code: string | null;
  user_id: number | null;
  first_name: string;
  last_name: string;
  phone: string | null;
  email: string | null;
  specialization: string | null;
  hourly_rate: number | null;
  status: string;
  notes: string | null;
}

export interface MyScheduleEntry {
  id: number;
  instructor_id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  availability_start_time: string | null;
  availability_end_time: string | null;
  status: "WORK" | "OFF" | "VACATION" | "SICK" | "TRAINING";
  note: string | null;
}

export interface MyRide {
  id: number;
  client_id: number;
  horse_id: number;
  instructor_id: number;
  start_time: string;
  duration_minutes: number;
  ride_type: string;
  status: string;
  notes: string | null;
  client_name: string | null;
  horse_name: string | null;
  instructor_name: string | null;
}

export interface MyAvailabilityRequest {
  id: number;
  instructor_id: number;
  date_from: string;
  date_to: string;
  weekdays: number[] | null;
  availability_start_time: string;
  availability_end_time: string;
  note: string | null;
  status: "PENDING" | "APPROVED" | "REJECTED";
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface MyAvailabilityPayload {
  date_from: string;
  date_to: string;
  weekdays: number[] | null;
  availability_start_time: string;
  availability_end_time: string;
  note: string | null;
}

export async function getMyInstructorProfile() {
  const { data } = await api.get<MyInstructorProfile>("/instructor-me");
  return data;
}

export async function getMySchedule(year: number, month: number) {
  const { data } = await api.get<MyScheduleEntry[]>(
    "/instructor-me/schedule",
    { params: { year, month } }
  );
  return data;
}

export async function getMyRides(
  dateFrom?: string,
  dateTo?: string
) {
  const { data } = await api.get<MyRide[]>("/instructor-me/rides", {
    params: {
      date_from: dateFrom || undefined,
      date_to: dateTo || undefined,
    },
  });

  return data;
}

export async function getMyAvailabilityRequests() {
  const { data } = await api.get<MyAvailabilityRequest[]>(
    "/instructor-me/availability-requests"
  );
  return data;
}

export async function createMyAvailabilityRequest(
  payload: MyAvailabilityPayload
) {
  const { data } = await api.post<MyAvailabilityRequest>(
    "/instructor-me/availability-requests",
    payload
  );

  return data;
}

export async function updateMyAvailabilityRequest(
  requestId: number,
  payload: MyAvailabilityPayload
) {
  const { data } = await api.put<MyAvailabilityRequest>(
    `/instructor-me/availability-requests/${requestId}`,
    payload
  );

  return data;
}

export async function deleteMyAvailabilityRequest(
  requestId: number
) {
  await api.delete(
    `/instructor-me/availability-requests/${requestId}`
  );
}
