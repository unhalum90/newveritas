export const DEFAULT_PLEDGE_TEXT = [
  "I have studied the material and am ready to demonstrate my understanding.",
  "I will not use notes, websites, AI tools, or other people during this assessment.",
  "I understand this assessment measures what I know, not what I can look up.",
  "My responses will be in my own words based on my learning.",
].join("\n");

export function getClientIpFromHeaders(headers: Headers): string | null {
  const forwardedFor = headers.get("x-forwarded-for");
  if (forwardedFor) {
    const first = forwardedFor.split(",")[0]?.trim();
    if (first) return first;
  }
  const realIp = headers.get("x-real-ip");
  if (realIp && realIp.trim()) return realIp.trim();
  return null;
}

