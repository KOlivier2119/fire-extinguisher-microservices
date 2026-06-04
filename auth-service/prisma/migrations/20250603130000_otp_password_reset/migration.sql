-- OTP password reset fields
ALTER TABLE "PasswordResetToken" ALTER COLUMN "tokenHash" DROP NOT NULL;

ALTER TABLE "PasswordResetToken" ADD COLUMN "otpHash" TEXT;
ALTER TABLE "PasswordResetToken" ADD COLUMN "resetSessionTokenHash" TEXT;
ALTER TABLE "PasswordResetToken" ADD COLUMN "sessionExpiresAt" TIMESTAMP(3);
ALTER TABLE "PasswordResetToken" ADD COLUMN "attempts" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "PasswordResetToken" ADD COLUMN "verifiedAt" TIMESTAMP(3);
