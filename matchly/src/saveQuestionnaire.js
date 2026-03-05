import { db } from "./firebase";
import { doc, setDoc } from "firebase/firestore";

export async function saveQuestionnaire(uid, data) {
  try {
    await setDoc(doc(db, "questionnaires", uid), data);
    console.log("Questionnaire saved");
  } catch (error) {
    console.error("Error saving questionnaire:", error);
  }
}