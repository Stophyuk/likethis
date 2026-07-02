import "server-only";

// Post plain text to a Slack Incoming Webhook. Returns success.
export async function sendSlack(
  webhookUrl: string,
  text: string,
): Promise<boolean> {
  if (!webhookUrl) return false;
  try {
    const res = await fetch(webhookUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ text }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
