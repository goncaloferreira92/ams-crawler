// import { sendAllEmails } from "./email_service/sendAllEmails";
// import { Agency, type AgencyProperty } from "./types";

// Test sending an email with dummy data
// const testEmail: AgencyProperty = new Map([[Agency.Vesteda, ["Property name 01"]]]);
// await sendAllEmails(testEmail);

// Test removing a property so the script will have to detect the difference.
export function testDeletePropertyToCheck(spanTexts: Set<string>) {
  // Test deleting an element to check if it will send a message
  const spanTextsKeys = Array.from(spanTexts.keys());
  spanTextsKeys.splice(3, 5);
  return spanTextsKeys;
}
