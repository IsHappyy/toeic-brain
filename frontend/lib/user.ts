const KEY = "toeic_uid";

export function getUserId(): string {
  if (typeof window === "undefined") return "";
  let uid = localStorage.getItem(KEY);
  if (!uid) {
    uid = crypto.randomUUID();
    localStorage.setItem(KEY, uid);
  }
  return uid;
}
