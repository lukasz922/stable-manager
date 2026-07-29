import { useEffect, useState } from "react";

import {
  getInstructorSchedule,
  saveInstructorSchedule,
  saveInstructorScheduleRange,
  updateInstructorScheduleRange,
  deleteInstructorScheduleRange,
  updateInstructorSchedule,
  deleteInstructorSchedule,
  copyInstructorSchedule,
} from "../api/instructorSchedule";

import type {
  InstructorSchedule,
  InstructorScheduleCreate,
  InstructorScheduleRangeCreate,
  InstructorScheduleRangeDelete,
  InstructorScheduleRangeDeleteResult,
  InstructorScheduleRangeResult,
  InstructorScheduleRangeUpdate,
  InstructorScheduleRangeUpdateResult,
} from "../api/instructorSchedule";

export function useInstructorSchedule(year: number, month: number) {
  const [schedule, setSchedule] = useState<InstructorSchedule[]>([]);
  const [loading, setLoading] = useState(false);

  const load = async () => {
    setLoading(true);

    try {
      const data = await getInstructorSchedule(year, month);
      setSchedule(data);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    void load();
  }, [year, month]);

  const save = async (
    payload: InstructorScheduleCreate
  ): Promise<void> => {
    await saveInstructorSchedule(payload);
    await load();
  };

  const saveRange = async (
    payload: InstructorScheduleRangeCreate
  ): Promise<InstructorScheduleRangeResult> => {
    const result = await saveInstructorScheduleRange(payload);
    await load();

    return result;
  };

  const updateRange = async (
    payload: InstructorScheduleRangeUpdate
  ): Promise<InstructorScheduleRangeUpdateResult> => {
    const result = await updateInstructorScheduleRange(payload);
    await load();

    return result;
  };

  const deleteRange = async (
    payload: InstructorScheduleRangeDelete
  ): Promise<InstructorScheduleRangeDeleteResult> => {
    const result = await deleteInstructorScheduleRange(payload);
    await load();

    return result;
  };

  const update = async (
    id: number,
    payload: InstructorScheduleCreate
  ): Promise<void> => {
    await updateInstructorSchedule(id, payload);
    await load();
  };

  const remove = async (id: number): Promise<void> => {
    await deleteInstructorSchedule(id);
    await load();
  };

  const copy = async (
    sourceYear: number,
    sourceMonth: number,
    targetYear: number,
    targetMonth: number
  ): Promise<void> => {
    await copyInstructorSchedule(
      sourceYear,
      sourceMonth,
      targetYear,
      targetMonth
    );

    await load();
  };

  return {
    schedule,
    loading,
    load,
    save,
    saveRange,
    updateRange,
    deleteRange,
    update,
    remove,
    copy,
  };
}