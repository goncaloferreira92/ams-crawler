import type { FileSink } from "bun";
import { infoWithDate } from "../helpers";
import type { AgencyProperty } from "../types";
import sendEmail from "./sendEmail";

export async function sendAllEmails(
  agencyProperties: AgencyProperty,
  fileWriter: FileSink
) {
  try {
    infoWithDate("Found new properties!", fileWriter);

    infoWithDate("Sending emails...", fileWriter);
    const html = ["<h4>Let's submit! Our app found something here:</h4>"];
    for (const [agency, properties] of agencyProperties.entries()) {
      infoWithDate(`Agency: ${agency}`, fileWriter);
      const agencyPropertyHtml = `<span>${agency}:</span>
                  <ul>${Array.from(properties)
                    .map((property) => {
                      infoWithDate(`Property name: ${property}`, fileWriter);
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

    infoWithDate("Emails successfully sent! 👏", fileWriter);
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
