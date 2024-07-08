import * as nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: "smtp.gmail.com", // Replace with your SMTP server host
  port: 587, // Replace with your SMTP server port
  secure: false, // Adjust based on your server's security requirements
  auth: {
    user: "goncalojferreira92@gmail.com", // Replace with your email address
    pass: process.env.EMAIL_PASSWORD, // Replace with your email password
  },
});

export default async function sendEmail({
  from,
  to,
  subject,
  html,
}: {
  from: string;
  to: string;
  subject: string;
  html: string;
}) {
  try {
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      html,
    });
    console.log("Email sent:", info.response);
  } catch (error) {
    console.error("Error sending email:", error);
  }
};

// (async () => {
//   try {
//     await sendEmail(
//       "goncalojferreira92@gmail.com",
//       "goncalojferreira92@gmail.com",
//       "Found a new thing!",
//       "<b>This is the email body</b>"
//     );
//     console.log("Email sent successfully!");
//   } catch (error) {
//     console.error("Error sending email:", error);
//   }
// })();
