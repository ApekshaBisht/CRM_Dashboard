import smtplib
import os
from email.message import EmailMessage

def load_env_file(path):
    if not os.path.exists(path):
        return
    with open(path, "r", encoding="utf-8") as f:
        for raw_line in f:
            line = raw_line.strip()
            if not line or line.startswith("#") or "=" not in line:
                continue
            key, value = line.split("=", 1)
            os.environ[key.strip()] = value.strip()

load_env_file(".env")

gmail_user = os.environ.get("GMAIL_USER")
gmail_password = os.environ.get("GMAIL_APP_PASSWORD")

if not gmail_user or not gmail_password:
    print("Missing GMAIL_USER or GMAIL_APP_PASSWORD in .env")
    exit(1)

msg = EmailMessage()
msg["From"] = gmail_user
msg["To"] = gmail_user
msg["Subject"] = "SMTP Test"
msg.set_content("This is a test email from the Antigravity agent.")

print(f"Connecting to smtp.gmail.com:587 as {gmail_user}...")
try:
    with smtplib.SMTP("smtp.gmail.com", 587, timeout=10) as smtp:
        smtp.starttls()
        smtp.login(gmail_user, gmail_password)
        smtp.send_message(msg)
    print("Email sent successfully!")
except Exception as e:
    print(f"Failed to send email: {e}")
