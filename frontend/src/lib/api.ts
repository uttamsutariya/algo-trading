const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3001";

export async function checkHealth() {
  const response = await fetch(`${API_URL}/health`);
  return response.json();
}
