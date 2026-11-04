export const PASSWORD_MIN_LENGTH = 6;
export const PASSWORD_MAX_LENGTH = 128;
export const PASSWORD_UPPERCASE = /[A-Z]/;
export const PASSWORD_LOWERCASE = /[a-z]/;
export const PASSWORD_MESSAGE = "Password must contain at least 6 characters, one uppercase letter, and one lowercase letter.";

export function meetsPasswordPolicy(value) {
  return typeof value === "string" && value.length >= PASSWORD_MIN_LENGTH
    && PASSWORD_UPPERCASE.test(value) && PASSWORD_LOWERCASE.test(value);
}
