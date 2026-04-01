import { generateRegistrationOptions } from "@simplewebauthn/server";

const opts = await generateRegistrationOptions({
  rpName: "Test",
  rpID: "localhost",
  userName: "t@t.com",
  userDisplayName: "Test",
  attestationType: "none",
  authenticatorSelection: {
    residentKey: "preferred",
    userVerification: "preferred",
    authenticatorAttachment: "platform",
  },
});

console.log("OK - options generated");
console.log("Keys:", Object.keys(opts));
console.log("user.id:", opts.user.id);
console.log("challenge:", opts.challenge.substring(0, 20) + "...");
