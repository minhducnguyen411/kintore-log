// "2026-10-27" → "2026年10月27日"
export function formatJapaneseDate(dateString) {
  const [year, month, day] = dateString.split("-");
  return `${year}年${month}月${day}日`;
}
