import { z } from "zod";

export const UrlInputSchema = z.object({
  url: z
    .string()
    .min(1, "URL tidak boleh kosong")
    .refine((val) => {
      try {
        new URL(val.startsWith("http") ? val : `https://${val}`);
        return true;
      } catch {
        return false;
      }
    }, "Format URL tidak valid"),
});

export type UrlInput = z.infer<typeof UrlInputSchema>;