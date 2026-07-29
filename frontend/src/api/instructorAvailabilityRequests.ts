import { api } from "./client";

export type AvailabilityRequestStatus =
  | "PENDING"
  | "APPROVED"
  | "REJECTED";

export interface InstructorAvailabilityRequest {
  id: number;
  instructor_id: number;
  date_from: string;
  date_to: string;
  weekdays: number[] | null;
  availability_start_time: string;
  availability_end_time: string;
  note: string | null;
  status: AvailabilityRequestStatus;
  admin_note: string | null;
  created_at: string;
  updated_at: string;
}

export interface InstructorAvailabilityRequestPayload {
  instructor_id: number;
  date_from: string;
  date_to: string;
  weekdays: number[] | null;
  availability_start_time: string;
  availability_end_time: string;
  note: string | null;
}

export interface ApprovalResult {
  request_id: number;
  status: AvailabilityRequestStatus;
  created: number;
  updated: number;
  skipped: number;
}

const baseUrl = "/instructor-availability-requests";

export async function getAvailabilityRequests() {
  const response = await api.get<InstructorAvailabilityRequest[]>(
    baseUrl
  );
  return response.data;
}

export async function createAvailabilityRequest(
  payload: InstructorAvailabilityRequestPayload
) {
  const response = await api.post<InstructorAvailabilityRequest>(
    baseUrl,
    payload
  );
  return response.data;
}

export async function approveAvailabilityRequest(
  requestId: number,
  adminNote: string | null
) {
  const response = await api.post<ApprovalResult>(
    `${baseUrl}/${requestId}/approve`,
    { admin_note: adminNote }
  );
  return response.data;
}

export async function rejectAvailabilityRequest(
  requestId: number,
  adminNote: string | null
) {
  const response = await api.post<InstructorAvailabilityRequest>(
    `${baseUrl}/${requestId}/reject`,
    { admin_note: adminNote }
  );
  return response.data;
}

export async function deleteAvailabilityRequest(
  requestId: number
) {
  await api.delete(`${baseUrl}/${requestId}`);
}