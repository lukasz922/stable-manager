const API = "http://localhost:8000";

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

async function getErrorMessage(
  response: Response,
  fallback: string
): Promise<string> {
  try {
    const data = await response.json();

    if (typeof data?.detail === "string") {
      return data.detail;
    }
  } catch {
    // Odpowiedź nie była JSON-em.
  }

  return fallback;
}

export async function getPasses(): Promise<ClientPass[]> {
  const response = await fetch(`${API}/passes`);

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Nie udało się pobrać karnetów.")
    );
  }

  return response.json();
}

export async function getPass(id: number): Promise<ClientPass> {
  const response = await fetch(`${API}/passes/${id}`);

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Nie udało się pobrać karnetu.")
    );
  }

  return response.json();
}

export async function createPass(
  data: ClientPassCreate
): Promise<ClientPass> {
  const response = await fetch(`${API}/passes`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Nie udało się dodać karnetu.")
    );
  }

  return response.json();
}

export async function updatePass(
  id: number,
  data: Partial<ClientPassCreate>
): Promise<ClientPass> {
  const response = await fetch(`${API}/passes/${id}`, {
    method: "PUT",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(data),
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Nie udało się zaktualizować karnetu.")
    );
  }

  return response.json();
}

export async function deletePass(id: number): Promise<void> {
  const response = await fetch(`${API}/passes/${id}`, {
    method: "DELETE",
  });

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(response, "Nie udało się usunąć karnetu.")
    );
  }
}