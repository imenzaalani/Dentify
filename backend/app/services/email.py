import aiosmtplib
from email.message import EmailMessage

from app.core.config import settings

BRAND_COLOR = "#0061ca"
TEXT_COLOR = "#1a1a1a"
MUTED_COLOR = "#6b7280"
BORDER_COLOR = "#e5e7eb"
BG_COLOR = "#f4f5f7"


def _reset_email_html(reset_link: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:{BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{BG_COLOR};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid {BORDER_COLOR};overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <div style="width:44px;height:44px;border-radius:10px;background-color:{BRAND_COLOR};display:inline-block;line-height:44px;color:#ffffff;font-size:20px;font-weight:700;">
                  D
                </div>
                <div style="margin-top:10px;font-size:15px;font-weight:600;color:{TEXT_COLOR};">
                  Dentify
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <h1 style="margin:0;font-size:20px;font-weight:600;color:{TEXT_COLOR};">
                  Reset your password
                </h1>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:{MUTED_COLOR};">
                  We got a request to reset the password for your Dentify account.
                  Click the button below to choose a new one.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;text-align:center;">
                <a href="{reset_link}"
                   style="display:inline-block;background-color:{BRAND_COLOR};color:#ffffff;
                          font-size:14px;font-weight:600;text-decoration:none;
                          padding:12px 28px;border-radius:8px;">
                  Reset password
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:{MUTED_COLOR};">
                  This link expires in 30 minutes. If the button doesn't work, copy and
                  paste this URL into your browser:
                </p>
                <p style="margin:8px 0 0 0;font-size:12px;word-break:break-all;">
                  <a href="{reset_link}" style="color:{BRAND_COLOR};">{reset_link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid {BORDER_COLOR};margin-top:8px;">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:{MUTED_COLOR};text-align:center;">
                  If you didn't request this, you can safely ignore this email —
                  your password won't be changed.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:{MUTED_COLOR};">
            Dentify · This is an automated message, please don't reply.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def _reset_email_text(reset_link: str) -> str:
    return (
        "Reset your Dentify password\n\n"
        "We got a request to reset the password for your Dentify account. "
        "Open the link below to choose a new one. This link expires in 30 minutes.\n\n"
        f"{reset_link}\n\n"
        "If you didn't request this, you can safely ignore this email — "
        "your password won't be changed."
    )


def _invite_email_html(invite_link: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:{BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{BG_COLOR};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid {BORDER_COLOR};overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <div style="width:44px;height:44px;border-radius:10px;background-color:{BRAND_COLOR};display:inline-block;line-height:44px;color:#ffffff;font-size:20px;font-weight:700;">
                  D
                </div>
                <div style="margin-top:10px;font-size:15px;font-weight:600;color:{TEXT_COLOR};">
                  Dentify
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <h1 style="margin:0;font-size:20px;font-weight:600;color:{TEXT_COLOR};">
                  You're invited to Dentify
                </h1>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:{MUTED_COLOR};">
                  A Dentify administrator has invited you to join as a doctor. Click the button below to set up your account and choose a secure password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;text-align:center;">
                <a href="{invite_link}"
                   style="display:inline-block;background-color:{BRAND_COLOR};color:#ffffff;
                          font-size:14px;font-weight:600;text-decoration:none;
                          padding:12px 28px;border-radius:8px;">
                  Set up account
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:{MUTED_COLOR};">
                  This link expires in 30 minutes. If the button doesn't work, copy and paste this URL into your browser:
                </p>
                <p style="margin:8px 0 0 0;font-size:12px;word-break:break-all;">
                  <a href="{invite_link}" style="color:{BRAND_COLOR};">{invite_link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid {BORDER_COLOR};margin-top:8px;">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:{MUTED_COLOR};text-align:center;">
                  If you were not expecting this invitation, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:{MUTED_COLOR};">
            Dentify · This is an automated message, please don't reply.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def _invite_email_text(invite_link: str) -> str:
    return (
        "You're invited to Dentify\n\n"
        "A Dentify administrator has invited you to join as a doctor. "
        "Open the link below to set up your account and choose a secure password. "
        "This link expires in 30 minutes.\n\n"
        f"{invite_link}\n\n"
        "If you were not expecting this invitation, you can ignore this email."
    )


async def send_password_reset_email(to_email: str, token: str, portal: str = "patient") -> None:
    path = "/staff/reset-password" if portal == "staff" else "/reset-password"
    reset_link = f"{settings.FRONTEND_URL}{path}?token={token}"

    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        # Dev fallback until Gmail credentials are set — link is fully
        # clickable from the console, so the flow is testable right now.
        print(f"[dev] password reset link for {to_email}: {reset_link}")
        return

    message = EmailMessage()
    message["From"] = f"Dentify <{settings.GMAIL_ADDRESS}>"
    message["To"] = to_email
    message["Subject"] = "Reset your Dentify password"
    message.set_content(_reset_email_text(reset_link))
    message.add_alternative(_reset_email_html(reset_link), subtype="html")

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.GMAIL_ADDRESS,
        password=settings.GMAIL_APP_PASSWORD,
    )
def _patient_invite_text(invite_link: str) -> str:
    return (
        "You're invited to the Dentify patient portal\n\n"
        "Your dental clinic has set up a patient portal account for you. "
        "Open the link below to choose a password and activate it. "
        "This link expires in 30 minutes.\n\n"
        f"{invite_link}\n\n"
        "If you weren't expecting this, you can ignore this email."
    )


def _patient_invite_html(invite_link: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:{BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{BG_COLOR};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid {BORDER_COLOR};overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <div style="width:44px;height:44px;border-radius:10px;background-color:{BRAND_COLOR};display:inline-block;line-height:44px;color:#ffffff;font-size:20px;font-weight:700;">D</div>
                <div style="margin-top:10px;font-size:15px;font-weight:600;color:{TEXT_COLOR};">Dentify</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <h1 style="margin:0;font-size:20px;font-weight:600;color:{TEXT_COLOR};">Your patient portal is ready</h1>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:{MUTED_COLOR};">
                  Your clinic has set up online access for you — view appointments, treatment plans, and messages in one place. Click below to set your password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;text-align:center;">
                <a href="{invite_link}" style="display:inline-block;background-color:{BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">Set up account</a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:{MUTED_COLOR};">This link expires in 30 minutes. If the button doesn't work, copy and paste this URL:</p>
                <p style="margin:8px 0 0 0;font-size:12px;word-break:break-all;"><a href="{invite_link}" style="color:{BRAND_COLOR};">{invite_link}</a></p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid {BORDER_COLOR};">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:{MUTED_COLOR};text-align:center;">If you weren't expecting this, you can ignore this email.</p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:{MUTED_COLOR};">Dentify · This is an automated message, please don't reply.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


async def send_patient_invite_email(to_email: str, token: str) -> None:
    invite_link = f"{settings.FRONTEND_URL}/invite?token={token}"

    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        print(f"[dev] patient invite link for {to_email}: {invite_link}")
        return

    message = EmailMessage()
    message["From"] = f"Dentify <{settings.GMAIL_ADDRESS}>"
    message["To"] = to_email
    message["Subject"] = "Set up your Dentify patient portal"
    message.set_content(_patient_invite_text(invite_link))
    message.add_alternative(_patient_invite_html(invite_link), subtype="html")

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.GMAIL_ADDRESS,
        password=settings.GMAIL_APP_PASSWORD,
    )


def _invite_message_text(invite_link: str, role_label: str) -> str:
    return (
        f"You're invited to Dentify {role_label}\n\n"
        "A Dentify administrator has invited you to join the team. "
        "Open the link below to set up your account and choose a secure password. "
        "This link expires in 30 minutes.\n\n"
        f"{invite_link}\n\n"
        "If you were not expecting this invitation, you can ignore this email."
    )


def _invite_message_html(invite_link: str, role_label: str) -> str:
    return f"""\
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:{BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{BG_COLOR};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid {BORDER_COLOR};overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <div style="width:44px;height:44px;border-radius:10px;background-color:{BRAND_COLOR};display:inline-block;line-height:44px;color:#ffffff;font-size:20px;font-weight:700;">
                  D
                </div>
                <div style="margin-top:10px;font-size:15px;font-weight:600;color:{TEXT_COLOR};">
                  Dentify
                </div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <h1 style="margin:0;font-size:20px;font-weight:600;color:{TEXT_COLOR};">
                  You're invited to Dentify {role_label}
                </h1>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:{MUTED_COLOR};">
                  A Dentify administrator has invited you to join the team {role_label}. Click the button below to set up your account and choose a secure password.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;text-align:center;">
                <a href="{invite_link}"
                   style="display:inline-block;background-color:{BRAND_COLOR};color:#ffffff;
                          font-size:14px;font-weight:600;text-decoration:none;
                          padding:12px 28px;border-radius:8px;">
                  Set up account
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:0 32px 8px 32px;text-align:center;">
                <p style="margin:0;font-size:12px;color:{MUTED_COLOR};">
                  This link expires in 30 minutes. If the button doesn't work, copy and paste this URL into your browser:
                </p>
                <p style="margin:8px 0 0 0;font-size:12px;word-break:break-all;">
                  <a href="{invite_link}" style="color:{BRAND_COLOR};">{invite_link}</a>
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid {BORDER_COLOR};margin-top:8px;">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:{MUTED_COLOR};text-align:center;">
                  If you were not expecting this invitation, you can ignore this email.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:{MUTED_COLOR};">
            Dentify · This is an automated message, please don't reply.
          </p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""


def _get_role_label(role: str) -> str:
    if role == "dentist":
        return "as a doctor"
    if role == "receptionist":
        return "as a receptionist"
    return "to join"


async def send_appointment_confirmation_email(
    to_email: str,
    patient_name: str,
    dentist_name: str,
    scheduled_at: str,
) -> None:
    portal_link = f"{settings.FRONTEND_URL}/sign-in"
    message = EmailMessage()
    message["From"] = f"Dentify <{settings.GMAIL_ADDRESS}>"
    message["To"] = to_email
    message["Subject"] = "Votre rendez-vous Dentify est confirmé"
    message.set_content(
        _appointment_confirmation_text(patient_name, dentist_name, scheduled_at, portal_link)
    )
    message.add_alternative(
        _appointment_confirmation_html(patient_name, dentist_name, scheduled_at, portal_link),
        subtype="html",
    )

    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        print(f"[dev] appointment confirmation for {to_email}: {scheduled_at} with {dentist_name}")
        return

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.GMAIL_ADDRESS,
        password=settings.GMAIL_APP_PASSWORD,
    )


def _appointment_confirmation_text(
    patient_name: str,
    dentist_name: str,
    scheduled_at: str,
    portal_link: str,
) -> str:
    return (
        f"Bonjour {patient_name},\n\n"
        f"Votre rendez-vous Dentify est confirmé pour le {scheduled_at}.\n"
        f"Le praticien : {dentist_name}.\n\n"
        f"Connectez-vous au patient portal pour voir les détails : {portal_link}\n\n"
        "À bientôt,\n"
        "Dentify"
    )


def _appointment_confirmation_html(
    patient_name: str,
    dentist_name: str,
    scheduled_at: str,
    portal_link: str,
) -> str:
    return f"""
<!DOCTYPE html>
<html>
  <body style="margin:0;padding:0;background-color:{BG_COLOR};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background-color:{BG_COLOR};padding:32px 16px;">
      <tr>
        <td align="center">
          <table role="presentation" width="100%" style="max-width:480px;background-color:#ffffff;border-radius:12px;border:1px solid {BORDER_COLOR};overflow:hidden;">
            <tr>
              <td style="padding:32px 32px 0 32px;text-align:center;">
                <div style="width:44px;height:44px;border-radius:10px;background-color:{BRAND_COLOR};display:inline-block;line-height:44px;color:#ffffff;font-size:20px;font-weight:700;">D</div>
                <div style="margin-top:10px;font-size:15px;font-weight:600;color:{TEXT_COLOR};">Dentify</div>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 8px 32px;text-align:center;">
                <h1 style="margin:0;font-size:20px;font-weight:600;color:{TEXT_COLOR};">Rendez-vous confirmé</h1>
                <p style="margin:12px 0 0 0;font-size:14px;line-height:1.6;color:{MUTED_COLOR};">
                  Bonjour {patient_name}, votre rendez-vous avec {dentist_name} est confirmé pour {scheduled_at}.
                </p>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px;text-align:center;">
                <a href="{portal_link}" style="display:inline-block;background-color:{BRAND_COLOR};color:#ffffff;font-size:14px;font-weight:600;text-decoration:none;padding:12px 28px;border-radius:8px;">
                  Voir les détails du rendez-vous
                </a>
              </td>
            </tr>
            <tr>
              <td style="padding:24px 32px 32px 32px;border-top:1px solid {BORDER_COLOR};">
                <p style="margin:16px 0 0 0;font-size:12px;line-height:1.6;color:{MUTED_COLOR};text-align:center;">
                  Si vous n'attendiez pas ce rendez-vous, contactez votre cabinet.
                </p>
              </td>
            </tr>
          </table>
          <p style="margin:16px 0 0 0;font-size:11px;color:{MUTED_COLOR};">Dentify · Ceci est un message automatique, merci de ne pas répondre.</p>
        </td>
      </tr>
    </table>
  </body>
</html>
"""

async def send_staff_invite_email(to_email: str, token: str, role: str) -> None:
    invite_link = f"{settings.FRONTEND_URL}/staff/invite?token={token}"
    role_label = _get_role_label(role)

    if not settings.GMAIL_ADDRESS or not settings.GMAIL_APP_PASSWORD:
        print(f"[dev] staff invite link for {to_email}: {invite_link}")
        return

    message = EmailMessage()
    message["From"] = f"Dentify <{settings.GMAIL_ADDRESS}>"
    message["To"] = to_email
    message["Subject"] = "Set up your Dentify account"
    message.set_content(_invite_message_text(invite_link, role_label))
    message.add_alternative(_invite_message_html(invite_link, role_label), subtype="html")

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",
        port=587,
        start_tls=True,
        username=settings.GMAIL_ADDRESS,
        password=settings.GMAIL_APP_PASSWORD,
    )