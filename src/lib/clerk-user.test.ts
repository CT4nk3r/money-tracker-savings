import { describe, expect, it } from "vitest";
import {
  getPrimaryVerifiedEmailAddress,
  getVerifiedEmailAddresses,
} from "@/lib/clerk-user";

type ClerkUser = Parameters<typeof getVerifiedEmailAddresses>[0];

function userWithEmails(
  emails: Array<{
    id: string;
    emailAddress: string;
    status: "verified" | "unverified" | null;
  }>,
  primaryEmailAddressId = emails[0]?.id,
) {
  return {
    primaryEmailAddressId,
    emailAddresses: emails.map((email) => ({
      id: email.id,
      emailAddress: email.emailAddress,
      verification: email.status ? { status: email.status } : null,
    })),
  } as ClerkUser;
}

describe("Clerk user helpers", () => {
  it("returns only verified email addresses in normalized form", () => {
    const user = userWithEmails([
      { id: "primary", emailAddress: "ME@Example.com", status: "verified" },
      { id: "secondary", emailAddress: "other@example.com", status: "unverified" },
      { id: "legacy", emailAddress: "legacy@example.com", status: null },
    ]);

    expect(getVerifiedEmailAddresses(user)).toEqual(["me@example.com"]);
  });

  it("prefers the primary email only when it is verified", () => {
    const user = userWithEmails(
      [
        { id: "primary", emailAddress: "primary@example.com", status: "unverified" },
        { id: "backup", emailAddress: "backup@example.com", status: "verified" },
      ],
      "primary",
    );

    expect(getPrimaryVerifiedEmailAddress(user)).toBe("backup@example.com");
  });
});
