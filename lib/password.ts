/** Bez slova i cifara koje se mešaju (0/O, 1/l), jer se lozinka često diktira uživo. */
const ALPHABET = "abcdefghijkmnpqrstuvwxyzABCDEFGHJKLMNPQRSTUVWXYZ23456789";

export function generatePassword(length = 12): string {
  return Array.from(crypto.getRandomValues(new Uint32Array(length)), (value) => ALPHABET[value % ALPHABET.length]).join("");
}
