import { z } from "zod";

export const UrlInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL tidak boleh kosong")
    .max(2048, "URL maksimal 2.048 karakter")
    .refine((value) => {
      try {
        const hasHttpScheme = /^https?:\/\//i.test(value);
        const looksLikeHostAndPort = /^[^:/?#]+:\d+(?:[/?#]|$)/.test(value);
        const hasUnsupportedScheme =
          /^[a-z][a-z\d+.-]*:/i.test(value) &&
          !hasHttpScheme &&
          !looksLikeHostAndPort;

        if (hasUnsupportedScheme) {
          return false;
        }

        const candidate = hasHttpScheme ? value : `https://${value}`;
        const parsed = new URL(candidate);

        return (
          (parsed.protocol === "http:" || parsed.protocol === "https:") &&
          parsed.hostname.length > 0 &&
          !parsed.username &&
          !parsed.password
        );
      } catch {
        return false;
      }
    }, "Masukkan URL HTTP(S) yang valid tanpa kredensial"),
});

export type UrlInput = z.infer<typeof UrlInputSchema>;
