import { z } from "zod";

/**
 * Zod validation schemas for the auth forms.
 * The phone regex is copied 1:1 from spec §8.1 so client and server
 * (backend common/validators.py) agree on the format.
 *
 * Schemas are built via factory functions so validation messages can be
 * rendered in the ACTIVE UI locale (TH by default).
 */

export const ThaiPhoneRegex = /^0[689]\d{8}$/;

export interface ValidationMessages {
  emailRequired: string;
  emailInvalid: string;
  passwordRequired: string;
  passwordMin: string;
  passwordLetter: string;
  passwordNumber: string;
  phoneInvalid: string;
}

export function createLoginSchema(m: ValidationMessages) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, m.emailRequired)
      .email(m.emailInvalid),
    password: z.string().min(1, m.passwordRequired),
  });
}

export function createRegisterSchema(m: ValidationMessages) {
  return z.object({
    email: z
      .string()
      .trim()
      .min(1, m.emailRequired)
      .email(m.emailInvalid),
    password: z
      .string()
      .min(8, m.passwordMin)
      .regex(/[a-zA-Z]/, m.passwordLetter)
      .regex(/[0-9]/, m.passwordNumber),
    first_name: z.string().trim().max(150).optional().default(""),
    last_name: z.string().trim().max(150).optional().default(""),
    phone_number: z
      .union([
        z.string().regex(ThaiPhoneRegex, { message: m.phoneInvalid }),
        z.literal(""),
      ])
      .optional()
      .default(""),
  });
}

export type LoginInput = z.infer<ReturnType<typeof createLoginSchema>>;
export type RegisterInput = z.infer<ReturnType<typeof createRegisterSchema>>;

