import type { User } from "@clerk/backend";

export function getVerifiedEmailAddresses(user: User | null) {
  return (
    user?.emailAddresses
      .filter((email) => email.verification?.status === "verified")
      .map((email) => email.emailAddress.toLowerCase()) ?? []
  );
}

export function getPrimaryVerifiedEmailAddress(user: User | null) {
  const verifiedEmails = getVerifiedEmailAddresses(user);
  const primaryEmail = user?.emailAddresses
    .find((email) => email.id === user.primaryEmailAddressId)
    ?.emailAddress.toLowerCase();

  if (primaryEmail && verifiedEmails.includes(primaryEmail)) {
    return primaryEmail;
  }

  return verifiedEmails[0] ?? null;
}
