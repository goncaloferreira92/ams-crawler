import { infoWithDate } from "../helpers";
import type { AgencyProperty } from "../types";
import sendEmail from "./sendEmail";

export async function sendAllEmails(agencyProperties: AgencyProperty) {
  try {
    infoWithDate("Found new properties!");

    infoWithDate("Sending emails...");
    const html = ["<h4>Let's submit! Our app found something here:</h4>"];
    for (const [agency, properties] of agencyProperties.entries()) {
      infoWithDate(`Agency: ${agency}`);
      const agencyPropertyHtml = `<span>${agency}:</span>
                  <ul>${properties
                    .map((property) => {
                      infoWithDate(`Property name: ${property}`);
                      return `<li>Property name: ${property}</li>`;
                    })
                    .join("")}</ul>`;
      html.push(agencyPropertyHtml);
    }

    await sendEmail({
      from: "goncalojferreira92@gmail.com",
      to: "goncalojferreira92@gmail.com",
      subject: `Found a new for Amsterdam!`,
      html: html.join("\n"),
    });

    await sendEmail({
      from: "goncalojferreira92@gmail.com",
      to: "veronique.kuperstein@gmail.com",
      subject: `Found a new for Amsterdam!`,
      html: html.join("\n"),
    });

    infoWithDate("Emails successfully sent! 👏");
  } catch (err) {
    console.error(
      new Error(new Date().toISOString() + ": Could not send emails")
    );
    if (err instanceof Error) {
      console.error(err);
    } else
      console.error(
        new Error(
          new Date().toISOString() + ": Could not identify the error type."
        )
      );
  }
}
