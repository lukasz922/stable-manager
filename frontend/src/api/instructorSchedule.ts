import { api } from "./client";

export type InstructorSchedule = {
  id: number;
  instructor_id: number;
  date: string;
  start_time: string | null;
  end_time: string | null;
  availability_start_time: string | null;
  availability_end_time: string | null;
  status: string;
  note?: string | null;
};

export type InstructorScheduleCreate = {
  instructor_id: number;
  date: string;
  start_time: string;
  end_time: string;
  availability_start_time: string;
  availability_end_time: string;
  status: string;
  note?: string;
};

export type InstructorScheduleRangeCreate = {
  instructor_id: number;
  date_from: string;
  date_to: string;
  start_time: string;
  end_time: string;
  availability_start_time: string;
  availability_end_time: string;
  status: string;
  note?: string;
  weekdays?: number[];
  skip_weekends: boolean;
  overwrite_existing: boolean;
};

export type InstructorScheduleRangeResult = {
  created: number;
  updated: number;
  skipped: number;
};

export type InstructorScheduleRangeUpdate = {
  instructor_id: number;
  date_from: string;
  date_to: string;
  start_time: string;
  end_time: string;
  availability_start_time: string;
  availability_end_time: string;
  status: string;
  note?: string;
  weekdays?: number[];
};

export type InstructorScheduleRangeDelete = {
  instructor_id: number;
  date_from: string;
  date_to: string;
  weekdays?: number[];
};

export type InstructorScheduleRangeUpdateResult = {
  updated: number;
  skipped: number;
};

export type InstructorScheduleRangeDeleteResult = {
  deleted: number;
  skipped: number;
};

export type InstructorScheduleCopyResult = {
  copied: number;
};

export async function getInstructorSchedule(
  year: number,
  month: number
): Promise<InstructorSchedule[]> {
  const { data } = await api.get<InstructorSchedule[]>(
    "/instructor-schedule",
    { params: { year, month } }
  );

  return data;
}

export async function saveInstructorSchedule(
  payload: InstructorScheduleCreate
): Promise<InstructorSchedule> {
  const { data } = await api.post<InstructorSchedule>(
    "/instructor-schedule/save",
    payload
  );

  return data;
}

export async function saveInstructorScheduleRange(
  payload: InstructorScheduleRangeCreate
): Promise<InstructorScheduleRangeResult> {
  const { data } = await api.post<InstructorScheduleRangeResult>(
    "/instructor-schedule/range",
    payload
  );

  return data;
}

export async function updateInstructorScheduleRange(
  payload: InstructorScheduleRangeUpdate
): Promise<InstructorScheduleRangeUpdateResult> {
  const { data } = await api.put<InstructorScheduleRangeUpdateResult>(
    "/instructor-schedule/range",
    payload
  );

  return data;
}

export async function deleteInstructorScheduleRange(
  payload: InstructorScheduleRangeDelete
): Promise<InstructorScheduleRangeDeleteResult> {
  const { data } = await api.delete<InstructorScheduleRangeDeleteResult>(
    "/instructor-schedule/range",
    { data: payload }
  );

  return data;
}

export async function updateInstructorSchedule(
  scheduleId: number,
  payload: InstructorScheduleCreate
): Promise<InstructorSchedule> {
  const { data } = await api.put<InstructorSchedule>(
    `/instructor-schedule/${scheduleId}`,
    payload
  );

  return data;
}

export async function deleteInstructorSchedule(
  scheduleId: number
): Promise<void> {
  await api.delete(`/instructor-schedule/${scheduleId}`);
}

export async function copyInstructorSchedule(
  sourceYear: number,
  sourceMonth: number,
  targetYear: number,
  targetMonth: number
): Promise<InstructorScheduleCopyResult> {
  const { data } = await api.post<InstructorScheduleCopyResult>(
    "/instructor-schedule/copy",
    {
      source_year: sourceYear,
      source_month: sourceMonth,
      target_year: targetYear,
      target_month: targetMonth,
    }
  );

  return data;
}
