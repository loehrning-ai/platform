import { z } from "zod";

export const certificateFormSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Bitte geben Sie Ihren vollständigen Namen ein.")
    .max(100, "Name darf maximal 100 Zeichen lang sein."),
});

export type CertificateFormData = z.infer<typeof certificateFormSchema>;
