/**
 * Teacher Invite Email Utility
 * Sends branded invite emails to teachers via MailerLite
 */

const MAILERLITE_ENDPOINT = "https://connect.mailerlite.com/api/campaigns";

interface TeacherInviteParams {
    email: string;
    firstName: string;
    lastName: string;
    schoolName: string;
    inviteLink: string;
}

/**
 * Send a branded teacher invite email via MailerLite
 * Uses the transactional email approach with inline HTML
 */
export async function sendTeacherInviteEmail(params: TeacherInviteParams): Promise<{ success: boolean; error?: string }> {
    const { email, firstName, lastName, schoolName, inviteLink } = params;

    const apiKey = process.env.MAILERLITE_API_KEY;
    if (!apiKey) {
        console.warn("MailerLite API key missing. Email not sent.");
        return { success: false, error: "Email service not configured" };
    }

    const fullName = `${firstName} ${lastName}`.trim();

    // Build email HTML
    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to SayVeritas</title>
</head>
<body style="margin: 0; padding: 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; background-color: #0f172a; color: #e2e8f0;">
  <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="max-width: 600px; margin: 0 auto; padding: 40px 20px;">
    <tr>
      <td>
        <!-- Header -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-bottom: 32px; text-align: center;">
              <h1 style="margin: 0; font-size: 28px; font-weight: 600; color: #14b8a6;">SayVeritas</h1>
            </td>
          </tr>
        </table>

        <!-- Main Content -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" style="background: linear-gradient(135deg, #1e293b 0%, #0f172a 100%); border-radius: 16px; border: 1px solid rgba(148, 163, 184, 0.2);">
          <tr>
            <td style="padding: 40px 32px;">
              <h2 style="margin: 0 0 16px 0; font-size: 24px; font-weight: 600; color: #f1f5f9;">
                You're Invited! 🎉
              </h2>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                Hi ${firstName || "there"},
              </p>
              
              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                <strong style="color: #f1f5f9;">${schoolName}</strong> has invited you to join SayVeritas, a voice-based learning platform that transforms how students demonstrate understanding.
              </p>

              <p style="margin: 0 0 24px 0; font-size: 16px; line-height: 1.6; color: #94a3b8;">
                With SayVeritas, you can:
              </p>

              <ul style="margin: 0 0 32px 0; padding-left: 24px; color: #94a3b8; line-height: 1.8;">
                <li>Create oral assessments students complete by speaking</li>
                <li>Get AI-assisted scoring with you as the final authority</li>
                <li>Run StudyLab sessions for formative check-ins</li>
                <li>See actual thinking, not just copied answers</li>
              </ul>

              <!-- CTA Button -->
              <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
                <tr>
                  <td style="text-align: center; padding: 8px 0 32px 0;">
                    <a href="${inviteLink}" style="display: inline-block; padding: 16px 40px; background: linear-gradient(135deg, #14b8a6 0%, #0d9488 100%); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 16px; border-radius: 8px; box-shadow: 0 4px 12px rgba(20, 184, 166, 0.3);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin: 0; font-size: 14px; color: #64748b; text-align: center;">
                This link expires in 24 hours. If you didn't expect this invitation, you can ignore this email.
              </p>
            </td>
          </tr>
        </table>

        <!-- Footer -->
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0">
          <tr>
            <td style="padding-top: 32px; text-align: center;">
              <p style="margin: 0 0 8px 0; font-size: 14px; color: #64748b;">
                SayVeritas • Voice-based learning platform
              </p>
              <p style="margin: 0; font-size: 12px; color: #475569;">
                <a href="https://sayveritas.com" style="color: #14b8a6; text-decoration: none;">sayveritas.com</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
  `.trim();

    try {
        // Use MailerLite's transactional email API
        // Note: MailerLite's standard API is for campaigns/subscribers
        // For transactional emails, we need to use their SMTP or a different approach
        // 
        // Alternative: Add to a subscriber group and trigger an automation
        // For now, we'll add them as a subscriber with custom fields

        const subscriberEndpoint = "https://connect.mailerlite.com/api/subscribers";

        const response = await fetch(subscriberEndpoint, {
            method: "POST",
            headers: {
                Authorization: `Bearer ${apiKey}`,
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                email,
                fields: {
                    name: fullName,
                    last_name: lastName,
                    school_name: schoolName,
                    invite_link: inviteLink,
                    invite_type: "teacher",
                },
                groups: [process.env.MAILERLITE_TEACHER_INVITE_GROUP_ID].filter(Boolean),
                status: "active",
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            console.error("MailerLite error:", errorText);
            return { success: false, error: "Failed to send invite email" };
        }

        return { success: true };
    } catch (error) {
        console.error("Teacher invite email error:", error);
        return { success: false, error: "Email service error" };
    }
}

/**
 * Alternative: Direct email send using MailerLite's SMTP relay
 * This requires configuring SMTP settings
 */
export async function sendTeacherInviteEmailDirect(params: TeacherInviteParams): Promise<{ success: boolean; error?: string }> {
    // For direct transactional emails, MailerLite recommends using their
    // automation feature triggered by adding a subscriber to a group
    // 
    // Workflow:
    // 1. Create a group "Teacher Invites" in MailerLite
    // 2. Create an automation triggered by "subscriber joins group"
    // 3. Design the email in MailerLite with merge tags:
    //    - {$name} for teacher name
    //    - Custom field {$school_name} for school
    //    - Custom field {$invite_link} for magic link
    // 4. This function just adds the subscriber to trigger the automation

    return sendTeacherInviteEmail(params);
}
