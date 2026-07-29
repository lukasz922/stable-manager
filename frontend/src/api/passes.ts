import { api } from "./client";

export type ClientPass = {
  id: number;
  client_id: number;
  client_name?: string | null;
  name: string;
  total_entries: number;
  remaining_entries: number;
  valid_from: string;
  valid_until: string;
  active: boolean;
};

export type ClientPassCreate = {
  client_id: number;
  name: string;
  total_entries: number;
  remaining_entries: number;
  valid_from: string;
  valid_until: string;
  active: boolean;
};

export async function getPasses(): Promise<ClientPass[]> {
  const { data } = await api.get<ClientPass[]>("/passes");
  return data;
}

export async function getPass(
  passId: number
): Promise<ClientPass> {
  const { data } = await api.get<ClientPass>(
    `/passes/${passId}`
  );

  return data;
}

export async function createPass(
  payload: ClientPassCreate
): Promise<ClientPass> {
  const { data } = await api.post<ClientPass>(
    "/passes",
    payload
  );

  return data;
}

export async function updatePass(
  passId: number,
  payload: Partial<ClientPassCreate>
): Promise<ClientPass> {
  const { data } = await api.put<ClientPass>(
    `/passes/${passId}`,
    payload
  );

  return data;
}

export async function deletePass(
  passId: number
): Promise<void> {
  await api.delete(`/passes/${passId}`);
}