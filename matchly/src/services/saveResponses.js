import { db } from "./firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { fetchSubmissions } from "./jotform";

function getUidFromAnswers(answers) {
  if (!answers) return null;

  const allAnswers = Object.values(answers);
  const uidField = allAnswers.find((item) => item?.name === "uid");

  return uidField?.answer || null;
}

export async function syncResponsesToFirestore() {
  const submissions = await fetchSubmissions(50);

  let written = 0;

  for (const sub of submissions) {
    const answers = sub.answers || {};
    const uid = getUidFromAnswers(answers);

    if (!uid) continue;

    await setDoc(
      doc(db, "questionnaires", String(uid)),
      {
        uid: String(uid),
        jotformSubmissionId: String(sub.id || ""),
        createdAt: sub.created_at || null,
        updatedAt: serverTimestamp(),
        answersJson: JSON.stringify(answers),
      },
      { merge: true }
    );

    written++;
  }

  return { totalFetched: submissions.length, written };
}