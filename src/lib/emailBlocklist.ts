/**
 * Disposable/temporary email domain blocklist
 * Used to prevent fake signups and temp mail usage
 */
const BLOCKED_DOMAINS = new Set([
  "mailinator.com", "tempmail.com", "guerrillamail.com", "yopmail.com",
  "throwaway.email", "fakeinbox.com", "sharklasers.com", "guerrillamailblock.com",
  "grr.la", "dispostable.com", "trashmail.com", "trashmail.me",
  "10minutemail.com", "tempail.com", "burnermail.io", "discard.email",
  "mailnesia.com", "maildrop.cc", "getairmail.com", "mohmal.com",
  "getnada.com", "temp-mail.org", "emailondeck.com", "mintemail.com",
  "tempinbox.com", "mailcatch.com", "inboxkitten.com", "tempr.email",
  "throwawaymail.com", "mailforspam.com", "spam4.me", "trashymail.com",
  "mytemp.email", "correotemporal.org", "crazymailing.com", "harakirimail.com",
  "mailnull.com", "mailscrap.com", "mailzilla.com", "nomail.xl.cx",
  "spamgourmet.com", "tempomail.fr", "tmpmail.net", "tmpmail.org",
  "wegwerfmail.de", "wegwerfmail.net", "yepmail.com", "jetable.org",
  "mailexpire.com", "tempmailo.com", "emailfake.com", "guerrillamail.info",
  "guerrillamail.net", "guerrillamail.org", "guerrillamail.de",
]);

/**
 * Check if an email uses a disposable/temporary domain
 * @returns error message if blocked, null if allowed
 */
export const validateEmailDomain = (email: string): string | null => {
  const domain = email.split("@")[1]?.toLowerCase();
  if (!domain) return "Please enter a valid email address.";
  if (BLOCKED_DOMAINS.has(domain)) {
    return "This email provider is not allowed. Please use a valid email.";
  }
  return null;
};
