const API = "http://localhost:8000";

export type PassHistoryItem = {
  id: number;
  pass_id: number;
  ride_id?: number | null;
  operation: "DEDUCT" | "RESTORE";
  entries: number;
  note?: string | null;
  created_at: string;
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

export async function getPassHistory(
  passId: number
): Promise<PassHistoryItem[]> {
  const response = await fetch(`${API}/pass-history/${passId}`);

  if (!response.ok) {
    throw new Error(
      await getErrorMessage(
        response,
        "Nie udało się pobrać historii karnetu."
      )
    );
  }

  return response.json();
}