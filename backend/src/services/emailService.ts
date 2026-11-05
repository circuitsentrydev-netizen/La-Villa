
import nodemailer from "nodemailer";

export interface PaymentReceiptEmail {
  customerName: string;
  customerEmail: string;
  accommodationName: string;
  reservationCode: string;
  paymentReference: string;
  checkInDate: string;
  checkOutDate: string;
  amount: number;
  currency: string;
}

const escapeHtml = (value: string): string =>
  value.replace(/[&<>"']/g, (character) => {
    const replacements: Record<string, string> = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;",
    };

    return replacements[character];
  });

const formatMoney = (amount: number, currency: string): string =>
  new Intl.NumberFormat("en-ZA", {
    style: "currency",
    currency,
  }).format(amount);

export class EmailService {
  private createTransporter() {
    const host = process.env.SMTP_HOST;
    const port = Number(process.env.SMTP_PORT || 587);
    const user = process.env.SMTP_USER;
    const pass = process.env.SMTP_PASS;

    if (!host || !user || !pass) {
      throw new Error("SMTP_NOT_CONFIGURED");
    }

    return nodemailer.createTransport({
      host,
      port,
      secure: port === 465,
      auth: { user, pass },
    });
  }

  private get fromAddress(): string {
    return (
      process.env.EMAIL_FROM ||
      process.env.SMTP_USER ||
      "La Villa <no-reply@example.com>"
    );
  }

  async sendPaymentReceipt(input: PaymentReceiptEmail): Promise<void> {
    const transporter = this.createTransporter();

    const customerName = escapeHtml(input.customerName);
    const accommodation = escapeHtml(input.accommodationName);
    const reservationCode = escapeHtml(input.reservationCode);
    const reference = escapeHtml(input.paymentReference);
    const checkIn = escapeHtml(input.checkInDate);
    const checkOut = escapeHtml(input.checkOutDate);
    const amount = formatMoney(input.amount, input.currency);

    const html = `
      <!doctype html>
      <html>
        <body style="margin:0;background:#f5f5f1;font-family:Arial,sans-serif;color:#24352d">
          <div style="max-width:620px;margin:32px auto;background:#fff;border-radius:14px;overflow:hidden">
            <div style="padding:28px;background:#1b4d3e;color:#fff">
              <h1 style="margin:0;font-size:27px">La Villa</h1>
              <p style="margin:6px 0 0;color:#e5eee8">Lekker Stays · Payment receipt</p>
            </div>
            <div style="padding:30px">
              <h2 style="margin-top:0">Payment received</h2>
              <p>Hello ${customerName},</p>
              <p>We have successfully verified your payment. Your reservation is confirmed.</p>
              <div style="padding:20px;background:#f5f7f4;border-radius:10px;margin:24px 0">
                <p style="margin:0;color:#66756d">Amount paid</p>
                <h1 style="margin:8px 0;color:#1b4d3e">${amount}</h1>
                <strong>Payment status: PAID</strong>
              </div>
              <h3>Reservation details</h3>
              <table style="width:100%;border-collapse:collapse">
                <tr><td style="padding:9px 0;color:#68766f">Accommodation</td><td style="padding:9px 0;text-align:right"><strong>${accommodation}</strong></td></tr>
                <tr><td style="padding:9px 0;color:#68766f">Reservation code</td><td style="padding:9px 0;text-align:right"><strong>${reservationCode}</strong></td></tr>
                <tr><td style="padding:9px 0;color:#68766f">Payment reference</td><td style="padding:9px 0;text-align:right"><strong>${reference}</strong></td></tr>
                <tr><td style="padding:9px 0;color:#68766f">Check-in</td><td style="padding:9px 0;text-align:right">${checkIn}</td></tr>
                <tr><td style="padding:9px 0;color:#68766f">Check-out</td><td style="padding:9px 0;text-align:right">${checkOut}</td></tr>
              </table>
              <p style="margin-top:26px">Please keep this email as proof of payment. Your payment was verified by La Villa against Paystack.</p>
              <p>Thank you for choosing La Villa Lekker Stays.</p>
            </div>
            <div style="padding:18px 30px;background:#f5f5f1;color:#68766f;font-size:12px">
              Circuit Sentry · La Villa Lekker Stays<br/>
              circuitsentrydev@gmail.com
            </div>
          </div>
        </body>
      </html>
    `;

    await transporter.sendMail({
      from: this.fromAddress,
      to: input.customerEmail,
      subject: `La Villa payment receipt – ${input.reservationCode}`,
      html,
      text: [
        "La Villa Lekker Stays - Payment receipt",
        `Hello ${input.customerName},`,
        "Your payment has been verified and your reservation is confirmed.",
        `Accommodation: ${input.accommodationName}`,
        `Reservation: ${input.reservationCode}`,
        `Payment reference: ${input.paymentReference}`,
        `Check-in: ${input.checkInDate}`,
        `Check-out: ${input.checkOutDate}`,
        `Amount paid: ${amount}`,
        "Status: PAID",
      ].join("\n"),
    });
  }

  async sendAdminPaymentAlert(input: PaymentReceiptEmail): Promise<void> {
    const adminEmail =
      process.env.ADMIN_NOTIFICATION_EMAIL ||
      "circuitsentrydev@gmail.com";

    const transporter = this.createTransporter();

    await transporter.sendMail({
      from: this.fromAddress,
      to: adminEmail,
      subject: `La Villa: payment received – ${input.reservationCode}`,
      text: [
        "A customer payment has been verified.",
        `Customer: ${input.customerName}`,
        `Customer email: ${input.customerEmail}`,
        `Accommodation: ${input.accommodationName}`,
        `Reservation: ${input.reservationCode}`,
        `Payment reference: ${input.paymentReference}`,
        `Check-in: ${input.checkInDate}`,
        `Check-out: ${input.checkOutDate}`,
        `Amount: ${formatMoney(input.amount, input.currency)}`,
        "Payment status: PAID",
      ].join("\n"),
    });
  }
}
