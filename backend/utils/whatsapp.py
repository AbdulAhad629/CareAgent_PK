"""
WhatsApp / SMS Sender via Twilio
────────────────────────────
Sends the prescription PDF link to the patient's phone.
"""
from twilio.rest import Client
from core.config import settings


def send_prescription_message(phone: str, patient_name: str, pdf_url: str) -> dict:
    """
    Sends a WhatsApp message with the prescription PDF link.
    `phone` should be in international format, e.g. +923001234567
    """
    if not settings.TWILIO_ACCOUNT_SID or not settings.TWILIO_AUTH_TOKEN:
        print("   ⚠️  Twilio not configured — skipping send.")
        return {"sent": False, "reason": "Twilio not configured"}

    if not phone:
        return {"sent": False, "reason": "No phone number on file"}

    try:
        client = Client(settings.TWILIO_ACCOUNT_SID, settings.TWILIO_AUTH_TOKEN)

        to_number = phone if phone.startswith("+") else f"+92{phone.lstrip('0')}"
        whatsapp_to = f"whatsapp:{to_number}"

        body = (
            f"Hello {patient_name}, your prescription from CareAgent PK is ready.\n"
            f"View / download it here:\n{pdf_url}\n\n"
            f"Get well soon! 🩺"
        )

        message = client.messages.create(
            from_=settings.TWILIO_PHONE_NUMBER,
            to=whatsapp_to,
            body=body,
        )
        print(f"   ✅ WhatsApp sent to {to_number} (sid={message.sid})")
        return {"sent": True, "sid": message.sid}

    except Exception as e:
        print(f"   ⚠️  Failed to send WhatsApp message: {e}")
        return {"sent": False, "reason": str(e)}