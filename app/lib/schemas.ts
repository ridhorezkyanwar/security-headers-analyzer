import { z } from "zod";

export const UrlInputSchema = z.object({
  url: z
    .string()
    .trim()
    .min(1, "URL tidak boleh kosong")
    .refine((value) => {
      try {
        const candidate = /^https?:\/\//i.test(value)
          ? value
          : `https://${value}`;
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
