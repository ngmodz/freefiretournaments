import React from "react";

// Table of contents items
export const tocItems = [
  { id: "section-1", title: "General Terms of Use" },
  { id: "section-2", title: "Tournament Policies" },
  { id: "section-3", title: "Payment and Wallet" },
  { id: "section-4", title: "Privacy Policy" },
  { id: "section-5", title: "Intellectual Property" },
  { id: "section-6", title: "Limitation of Liability" },
  { id: "section-7", title: "Termination" },
  { id: "section-8", title: "Modifications to Terms" },
  { id: "section-9", title: "Governing Law" },
  { id: "section-10", title: "Contact Us" }
];

// Section content
export const sections = [
  {
    id: "section-1",
    title: "1. General Terms of Use",
    subsections: [
      {
        title: "1.1 Eligibility",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>You must be at least 13 years old to use Freefire Tournaments. If you are under 18, you must have parental or guardian consent.</li>
            <li>You must provide accurate and complete information during registration, including your Free Fire In-Game Name (IGN) and email address.</li>
            <li>Accounts are non-transferable and may not be shared.</li>
          </ul>
        )
      },
      {
        title: "1.2 Account Responsibilities",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>You are responsible for maintaining the confidentiality of your account credentials (email, password, etc.).</li>
            <li>You are liable for all activities conducted through your account.</li>
          </ul>
        )
      },
      {
        title: "1.3 Acceptable Use",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>Use the app only for lawful purposes and in accordance with these Terms.</li>
            <li>Do not engage in:
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Cheating, hacking, or exploiting bugs in Free Fire or the app.</li>
                <li>Sharing custom room details (Room ID/password) publicly or with non-participants.</li>
                <li>Posting offensive, defamatory, or illegal content in chats, descriptions, or profiles.</li>
                <li>Attempting to disrupt the app's functionality (e.g., DDoS attacks, unauthorized access).</li>
              </ul>
            </li>
            <li>Violation of these rules may result in account suspension or termination.</li>
          </ul>
        )
      }
    ]
  },
  {
    id: "section-2",
    title: "2. Tournament Policies",
    subsections: [
      {
        title: "2.1 Tournament Creation",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>Hosts must provide accurate tournament details, including game mode, entry fees, prize distribution, and custom room settings.</li>
            <li>Hosts are responsible for:
              <ul className="list-disc pl-6 space-y-1 mt-2">
                <li>Ensuring fair play and adherence to Free Fire's rules (e.g., no emulators unless specified).</li>
                <li>Entering accurate results promptly after the tournament.</li>
                <li>Communicating clearly with participants via the app.</li>
              </ul>
            </li>
            <li>Tournaments must comply with Free Fire's terms and local laws.</li>
          </ul>
        )
      },
      {
        title: "2.2 Joining Tournaments",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>Participants must pay the entry fee via Cashfree to join a tournament.</li>
            <li>Entry fees are non-refundable.</li>
            <li>Participants must join the custom room using the provided Room ID and password at the scheduled time. Failure to join may result in forfeiture without refund.</li>
          </ul>
        )
      },
      {
        title: "2.3 Prize Distribution",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>Prizes are distributed based on the host's specified distribution (e.g., 70% to 1st, 20% to 2nd, 10% to 3rd) and credited to winners' in-app wallets.</li>
            <li>Winners must provide accurate payment details for withdrawals (if applicable).</li>
            <li>Freefire Tournaments is not responsible for delays caused by third-party payment providers (e.g., Cashfree).</li>
          </ul>
        )
      },
      {
        title: "2.4 Tournament Cancellations",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>If the platform cancels a tournament due to technical issues or violations, refunds will be issued within 7 business days.</li>
          </ul>
        )
      }
    ]
  },
  {
    id: "section-3",
    title: "3. Payment and Wallet Policies",
    subsections: [
      {
        title: "3.1 Payment Processing",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>All payments (entry fees, deposits, withdrawals) are processed via Cashfree, a third-party payment provider.</li>
            <li>Users must comply with Cashfree's terms and provide valid payment information.</li>
            <li>Freefire Tournaments is not liable for errors or delays caused by Cashfree.</li>
          </ul>
        )
      },
      {
        title: "3.2 Wallet and Credits",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>In-app wallet can be used for tournament entry fees and other platform features.</li>
            <li>Credits earned from tournaments can be withdrawn to your bank account or wallet.</li>
            <li>Minimum withdrawal amount is ₹50.</li>
          </ul>
        )
      }
    ]
  },
  // Additional sections 4-10 would follow the same pattern
  {
    id: "section-10",
    title: "10. Contact Us",
    subsections: [
      {
        title: "10.1 Support",
        content: (
          <ul className="list-disc pl-6 space-y-2">
            <li>For questions or concerns about these Terms, please contact our support team through the in-app Contact Developer form.</li>
            <li>For urgent matters, email us at support@freefireapp.example.com</li>
          </ul>
        )
      }
    ]
  }
]; 