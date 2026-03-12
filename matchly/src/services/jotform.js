const FORM_ID = "260515132181143";
const API_KEY = import.meta.env.VITE_JOTFORM_API_KEY;

export async function fetchSubmissions(limit = 50) {
  if (!API_KEY) {
    throw new Error("Missing VITE_JOTFORM_API_KEY in .env");
  }

  // Use USER submissions endpoint and filter by form_id
  const filter = encodeURIComponent(JSON.stringify({ form_id: FORM_ID }));

  const url =
    `https://api.jotform.com/user/submissions` +
    `?apiKey=${encodeURIComponent(API_KEY)}` +
    `&limit=${limit}` +
    `&filter=${filter}`;

  const res = await fetch(url);
  const data = await res.json();

  console.log("Jotform API raw response:", data);

  if (!res.ok || data?.responseCode !== 200) {
    throw new Error(data?.message || "Failed to fetch Jotform submissions");
  }

  return data.content || [];
}