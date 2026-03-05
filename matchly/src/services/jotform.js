export async function fetchSubmissions() {
  const API_KEY = "YOUR_JOTFORM_API_KEY";
  const FORM_ID = "260515132181143";

  const res = await fetch(
    `https://api.jotform.com/form/${FORM_ID}/submissions?apiKey=${API_KEY}`
  );

  const data = await res.json();

  return data.content;
}