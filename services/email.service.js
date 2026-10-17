
import nodemailer from "nodemailer";
import {
  inquiryNotification,
  inquiryAcknowledgment,
} from "./email.templates.js";

const requiredEnv = ["SMTP_USER", "SMTP_PASS", "EMAIL_FROM", "CONTACT_EMAIL"];

function getTransporter() {
  const missing = requiredEnv.filter((key) => !process.env[key]?.trim());

  if (missing.length) {
    throw new Error(`Missing email configuration: ${missing.join(", ")}`);
  }

  return nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 20000,
  });
}

export async function verifyEmailTransport() {
  const transporter = getTransporter();
  await transporter.verify();
  return true;
}

export async function sendProjectInquiry(data) {
  const transporter = getTransporter();

  try {
    const notification = inquiryNotification(data);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: process.env.CONTACT_EMAIL,
      replyTo: data.email,
      ...notification,
    });
  } catch (error) {
    console.error("Inquiry notification delivery failed", {
      reference: data.reference,
      code: error.code || "UNKNOWN",
      command: error.command || "UNKNOWN",
    });

    // The server must not claim the inquiry was delivered to the team.
    throw new Error("INQUIRY_NOTIFICATION_FAILED");
  }

  let confirmationSent = false;

  try {
    const acknowledgment = inquiryAcknowledgment(data);

    await transporter.sendMail({
      from: process.env.EMAIL_FROM,
      to: data.email,
      ...acknowledgment,
    });

    confirmationSent = true;
  } catch (error) {
    // The internal notification has already succeeded.
    console.error("Client acknowledgment delivery failed", {
      reference: data.reference,
      code: error.code || "UNKNOWN",
      command: error.command || "UNKNOWN",
    });
  } finally {
    transporter.close();
  }

  return {
    adminSent: true,
    customerConfirmationSent: confirmationSent,
  };
}
