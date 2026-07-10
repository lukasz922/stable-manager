const API = "http://localhost:8000";

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
};

export async function getClients(): Promise<Client[]> {
  const response = await fetch(`${API}/clients`);

  if (!response.ok) {
    throw new Error("Nie udało się pobrać klientów.");
  }

  return response.json();
}

export async function createClient(
  data: ClientCreate
): Promise<Client> {
  const response = await fetch(`${API}/clients`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się dodać klienta.");
  }

  return response.json();
}

export async function updateClient(
  id: number,
  data: ClientCreate
): Promise<Client> {
  const response = await fetch(`${API}/clients/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error("Nie udało się zaktualizować klienta.");
  }

  return response.json();
}

export async function deleteClient(id: number): Promise<void> {
  const response = await fetch(`${API}/clients/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error("Nie udało się usunąć klienta.");
  }
}