import { api } from "./client";

export type Client = {
  id: number;
  first_name: string;
  last_name: string;
  phone?: string | null;
  email?: string | null;
  riding_level?: string | null;
  barcode?: string | null;
  qr_code?: string | null;
  rfid_uid?: string | null;
  notes?: string | null;
  is_active: boolean;
};

export type ClientCreate = {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  riding_level?: string;
  barcode?: string;
  qr_code?: string;
  rfid_uid?: string;
  notes?: string;
  is_active?: boolean;
};

export type ClientFilter = "active" | "inactive" | "all";

export async function getClients(
  filter: ClientFilter = "all",
): Promise<Client[]> {
  const { data } = await api.get<Client[]>("/clients", {
    params: { status: filter },
  });
  return data;
}

export async function createClient(
  payload: ClientCreate,
): Promise<Client> {
  const { data } = await api.post<Client>("/clients", payload);
  return data;
}

export async function updateClient(
  clientId: number,
  payload: Partial<ClientCreate>,
): Promise<Client> {
  const { data } = await api.patch<Client>(
    `/clients/${clientId}`,
    payload,
  );
  return data;
}

export async function deactivateClient(
  clientId: number,
): Promise<Client> {
  const { data } = await api.post<Client>(
    `/clients/${clientId}/deactivate`,
  );
  return data;
}

export async function activateClient(
  clientId: number,
): Promise<Client> {
  const { data } = await api.post<Client>(
    `/clients/${clientId}/activate`,
  );
  return data;
}

export async function deleteClient(
  clientId: number,
): Promise<void> {
  await api.delete(`/clients/${clientId}`);
}