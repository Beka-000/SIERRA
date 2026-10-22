/**
 * lib/mail.ts — Gmail SMTP email utility
 * Использует nodemailer + Gmail App Password из .env
 */
import nodemailer from "nodemailer";

// ─── Транспорт ────────────────────────────────────────────────────────────────

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;

  if (!user || !pass) {
    throw new Error(
      "Email not configured: GMAIL_USER and GMAIL_APP_PASSWORD are required"
    );
  }

  return nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,
    secure: true, // SSL
    auth: { user, pass },
  });
}

// ─── Письмо восстановления пароля ─────────────────────────────────────────────

export async function sendPasswordResetEmail(
  to: string,
  resetLink: string
): Promise<void> {
  const from = process.env.MAIL_FROM ?? "Sierra Coffee <noreply@sierra-coffee.kg>";
  const transport = createTransport();

  const html = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Восстановление пароля — Sierra Coffee</title>
</head>
<body style="margin:0;padding:0;background:#17130F;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
         style="background:#17130F;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" role="presentation"
               style="max-width:480px;background:#211A15;border:1px solid rgba(255,255,255,0.08);
                      border-radius:16px;overflow:hidden;">

          <!-- Header -->
          <tr>
            <td align="center" style="padding:32px 32px 24px;border-bottom:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0 0 8px;font-size:11px;font-weight:600;letter-spacing:0.12em;
                         text-transform:uppercase;color:#c9a96e;">
                Sierra Coffee
              </p>
              <h1 style="margin:0;font-size:22px;font-weight:600;color:#F7F1E8;letter-spacing:-0.02em;">
                Восстановление пароля
              </h1>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:28px 32px;">
              <p style="margin:0 0 16px;font-size:14px;line-height:1.6;color:rgba(247,241,232,0.65);">
                Мы получили запрос на восстановление пароля для вашего аккаунта Sierra Coffee.
              </p>
              <p style="margin:0 0 28px;font-size:14px;line-height:1.6;color:rgba(247,241,232,0.65);">
                Нажмите кнопку ниже, чтобы создать новый пароль. Ссылка действительна
                <strong style="color:#F7F1E8;">1 час</strong>.
              </p>

              <!-- Button -->
              <table width="100%" cellpadding="0" cellspacing="0" role="presentation">
                <tr>
                  <td align="center" style="padding:4px 0 28px;">
                    <a href="${resetLink}"
                       style="display:inline-block;background:#c9a96e;color:#0f0d0b;
                              font-size:14px;font-weight:600;text-decoration:none;
                              padding:13px 32px;border-radius:10px;letter-spacing:0.01em;">
                      Восстановить пароль
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:0 0 12px;font-size:12px;color:rgba(247,241,232,0.35);line-height:1.6;">
                Если кнопка не работает, скопируйте и вставьте эту ссылку в браузер:
              </p>
              <p style="margin:0 0 24px;font-size:11px;color:#c9a96e;word-break:break-all;">
                ${resetLink}
              </p>

              <p style="margin:0;font-size:12px;color:rgba(247,241,232,0.3);line-height:1.6;">
                Если вы не запрашивали восстановление пароля, просто проигнорируйте это письмо.
                Ваш текущий пароль останется без изменений.
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td align="center"
                style="padding:16px 32px 28px;border-top:1px solid rgba(255,255,255,0.06);">
              <p style="margin:0;font-size:11px;color:rgba(247,241,232,0.2);">
                © ${new Date().getFullYear()} Sierra Coffee · Бишкек, Кыргызстан
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>
`;

  const text = `Восстановление пароля — Sierra Coffee\n\nДля создания нового пароля перейдите по ссылке:\n${resetLink}\n\nСсылка действительна 1 час.\n\nЕсли вы не запрашивали восстановление пароля, проигнорируйте это письмо.`;

  await transport.sendMail({
    from,
    to,
    subject: "Восстановление пароля — Sierra Coffee",
    text,
    html,
  });
}
