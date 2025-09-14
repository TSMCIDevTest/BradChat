import nodemailer from 'nodemailer';
import { ENV } from '../lib/env.js';
import { createWelcomeEmailTemplate } from "../emails/emailTemplates.js"; // Make sure to import your template function

// Create a transporter object using the default SMTP transport
const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Example for Gmail. Use your email provider's SMTP host
  port: 587,
  secure: false, // Use 'true' for port 465, 'false' for other ports
  auth: {
    user: ENV.EMAIL_USER,
    pass: ENV.EMAIL_PASS,
  },
  tls: {
      ciphers: 'SSLv3'
  }
});

export const sendWelcomeEmail = async (email, name, clientURL) => {
  try {
    const mailOptions = {
      from: `${ENV.EMAIL_FROM_NAME} <${ENV.EMAIL_USER}>`,
      to: email,
      subject: "Welcome to BradChat!",
      html: createWelcomeEmailTemplate(name, clientURL),
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("Welcome email sent successfully:", info.response);
  } catch (error) {
    console.error("Error sending welcome email:", error);
    throw new Error("Failed to send welcome email");
  }
};