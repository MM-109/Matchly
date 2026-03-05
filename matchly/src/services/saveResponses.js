import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";
import { fetchSubmissions } from "./jotform";

export async function syncResponses() {
  const submissions = await fetchSubmissions();

  for (const sub of submissions) {
    const answers = sub.answers;

    const uid = answers?.uid?.answer;

    if (!uid) continue;

    await setDoc(
      doc(db, "questionnaires", uid),
      {
        uid: uid,
        answers: answers,
        submittedAt: new Date()
      },
      { merge: true }
    );
  }

  console.log("Responses synced");
}