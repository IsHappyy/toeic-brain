import { getUserId } from "./user";

const BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

function uid() {
  return getUserId();
}

export interface StudyWord {
  user_word_id: number | null;
  word_id: number;
  word: string;
  pronunciation: string;
  part_of_speech: string;
  definition_en: string;
  definition_th: string;
  example_sentence: string;
  example_sentence_th: string;
  category: string;
  repetitions: number;
  is_new: boolean;
}

export interface DashboardStats {
  due_today: number;
  new_available: number;
  total_learned: number;
  total_words: number;
  streak: number;
  today_reviews: number;
  accuracy_overall: number;
  goal: number;
}

export interface WordEntry {
  word_id: number;
  word: string;
  category: string;
  definition_th: string;
  repetitions: number;
  is_learned: boolean;
  is_due: boolean;
  accuracy: number | null;
  next_review_date: string | null;
  interval: number;
}

export async function fetchStats(): Promise<DashboardStats> {
  const res = await fetch(`${BASE}/stats?user_id=${uid()}`);
  return res.json();
}

export async function fetchDueWords(limit = 20): Promise<StudyWord[]> {
  const res = await fetch(`${BASE}/words/due?user_id=${uid()}&limit=${limit}`);
  return res.json();
}

export async function fetchNewWords(limit = 10): Promise<StudyWord[]> {
  const res = await fetch(`${BASE}/words/new?user_id=${uid()}&limit=${limit}`);
  return res.json();
}

export async function submitReview(wordId: number, quality: number) {
  const res = await fetch(`${BASE}/review/${wordId}?user_id=${uid()}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ quality }),
  });
  return res.json();
}

export async function fetchAllWords(): Promise<WordEntry[]> {
  const res = await fetch(`${BASE}/words/all?user_id=${uid()}`);
  return res.json();
}
