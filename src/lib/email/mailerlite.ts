
interface CrisisAlertParams {
    to: string;
    studentName: string;
    excerpt: string;
    timestamp: string;
}

export async function sendCrisisAlertEmail(to: string, studentName: string, excerpt: string, timestamp: string) {
    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
        console.error("MailerLite API key missing. Crisis email not sent.");
        return { success: false, error: "Configuration missing" };
    }

    // Use MailerLite's transactional HTTP API (POST `https://connect.mailerlite.com/api/send`)
    // If unavailable, we can use the subscriber trigger method or SMTP. 
    // However, for critical alerts, direct send is preferred. 
    // Since `teacher-invite.ts` uses subscriber endpoints, we will attempt consistent logic 
    // OR standard transactional if available. 
    // Documentation for ML v2 implies `api/send` exists.

    const endpoint = "https://connect.mailerlite.com/api/send";

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<style>
  body { font-family: sans-serif; background: #f8f9fa; padding: 20px; }
  .alert-box { background: #fff; border: 1px solid #e2e8f0; border-radius: 8px; padding: 24px; max-width: 600px; margin: 0 auto; border-top: 4px solid #ef4444; }
  h1 { color: #b91c1c; font-size: 20px; margin-top: 0; }
  p { line-height: 1.5; color: #374151; }
  .excerpt { background: #fee2e2; color: #991b1b; padding: 12px; border-radius: 4px; font-style: italic; margin: 16px 0; }
  .footer { font-size: 12px; color: #6b7280; margin-top: 24px; text-align: center; }
</style>
</head>
<body>
<div class="alert-box">
  <h1>🚨 CRITICAL: Safety Alert Detected</h1>
  <p><strong>Student:</strong> ${studentName}</p>
  <p><strong>Time:</strong> ${timestamp}</p>
  <p>The system has detected potential crisis language in a recent submission. Please review immediately.</p>
  
  <div class="excerpt">
    "${excerpt}"
  </div>

  <p>Log in to the DSL Dashboard for full context.</p>
</div>
<div class="footer">
  SayVeritas Automated Safety System
</div>
</body>
</html>
  `.trim();

    try {
        const response = await fetch(endpoint, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                "Authorization": `Bearer ${apiKey}`,
            },
            body: JSON.stringify({
                subject: `⚠️ URGENT: Safety Alert - ${studentName}`,
                from: {
                    email: "system@sayveritas.com", // Adjust sender if needed
                    name: "SayVeritas Safety"
                },
                to: [
                    { email: to, name: "DSL" }
                ],
                html: emailHtml,
            }),
        });

        if (!response.ok) {
            const err = await response.text();
            console.error("MailerLite Send Error:", err);
            return { success: false, error: err };
        }

        return { success: true };
    } catch (error) {
        console.error("Crisis alert email exception:", error);
        return { success: false, error: String(error) };
    }
}
