// Ported from the existing Supabase auth "Confirm Your HFSE Online Admission Account" email
// template — same logo, button color (#004aad), footer contact block, and overall HTML
// structure — with the confirmation-specific copy swapped for the recovery-link message.
// Pure string builder: no Deno/network dependency, so it's cheap to eyeball-verify by hand.

const LOGO_URL = "https://vnhklhppftebbcuupfjw.supabase.co/storage/v1/object/public/parent-portal//hfse-logo.png";

export function buildRecoveryEmailHtml(url: string): string {
  return `<html dir="ltr" lang="en">
  <head>
    <meta http-equiv="Content-Type" content="text/html; charset=UTF-8" />
    <meta name="x-apple-disable-message-reformatting" />
    <title>Action Required: Complete Your Enrollment Information</title>
  </head>
  <body style="background-color:#ffffff;margin:0 auto;font-family:-apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', 'Oxygen', 'Ubuntu', 'Cantarell', 'Fira Sans', 'Droid Sans', 'Helvetica Neue', sans-serif;">
    <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="max-width:37.5em;margin:0 auto;padding:0 20px;">
      <tbody>
        <tr style="width:100%">
          <td>
            <!-- Logo -->
            <table align="center" width="100%" border="0" cellpadding="0" cellspacing="0" role="presentation" style="margin-top:32px;">
              <tbody>
                <tr>
                  <td>
                    <img
                      alt="HFSE International School"
                      height="auto"
                      src="${LOGO_URL}"
                      style="display:block;outline:none;border:none;text-decoration:none"
                      width="160" />
                  </td>
                </tr>
              </tbody>
            </table>

            <!-- Message -->
            <h1 style="color:#1d1c1d;font-size:28px;font-weight:700;margin:30px 0 16px;padding:0;line-height:36px;">
              Complete Your Enrollment Information
            </h1>

            <p style="font-size:16px;line-height:26px;margin-bottom:16px;">
              Dear Parent,
            </p>

            <p style="font-size:16px;line-height:26px;margin-bottom:16px;">
              Good day!
            </p>

            <p style="font-size:16px;line-height:26px;margin-bottom:16px;">
              We hope this message finds you well. We're reaching out regarding your child's enrollment application — due to a technical issue on our end, some of the enrollment details you previously submitted were not fully saved in our system.
            </p>

            <p style="font-size:16px;line-height:26px;margin-bottom:30px;">
              We sincerely apologize for the inconvenience this may cause. To ensure your child's enrollment record is complete and accurate, we kindly ask you to re-enter the affected information using the link below:
            </p>

            <!-- Call-to-action button -->
            <table align="center" width="100%" cellpadding="0" cellspacing="0" role="presentation" style="margin-bottom:30px;">
              <tr>
                <td align="center">
                  <a href="${url}" style="background:#004aad;color:white;padding:14px 24px;border-radius:6px;text-decoration:none;font-size:16px;font-weight:600;display:inline-block;">
                    Complete Enrollment Information
                  </a>
                </td>
              </tr>
            </table>

            <!-- Backup link -->
            <p style="font-size:14px;line-height:24px;color:#000;margin-top:16px;margin-bottom:16px">
              If the button above doesn't work, copy and paste this link into your browser:
              <br />
              <span style="color:#004aad;word-break:break-all;">${url}</span>
            </p>

            <p style="font-size:16px;line-height:26px;margin-top:16px;margin-bottom:16px;">
              The form should only take a few minutes to complete. Once submitted, your enrollment record will be updated accordingly.
            </p>

            <p style="font-size:16px;line-height:26px;margin-top:16px;margin-bottom:16px;">
              If you have any questions or experience any issues while completing the form, please feel free to reply to this email and we'll be happy to assist you.
            </p>

            <p style="font-size:16px;line-height:26px;margin-top:16px;margin-bottom:16px;">
              Thank you for your understanding and cooperation.
            </p>

            <!-- Footer -->
            <hr style="margin:32px 0;border:none;border-top:1px solid #eaeaea;" />

            <p style="font-size:12px;line-height:20px;color:#6b6b6b;text-align:left;margin-bottom:4px;">
              +65 6451 0080<br />
              223 Mountbatten Road, #01-08, Singapore 398008
            </p>

            <p style="font-size:12px;line-height:20px;color:#6b6b6b;text-align:left;margin-bottom:4px;">
              PEI Registration No.: 201541283N<br />
              Valid: 26 March 2025 – 25 March 2029
            </p>

            <p style="font-size:12px;line-height:20px;color:#6b6b6b;text-align:left;">
              © 2025 HFSE International School. All rights reserved.
            </p>
          </td>
        </tr>
      </tbody>
    </table>
  </body>
</html>`;
}
