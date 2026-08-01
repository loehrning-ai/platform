export type SupabaseKeyKind =
  | "invalid"
  | "publishable"
  | "secret"
  | "legacy-anon"
  | "legacy-service-role";

export const SUPABASE_KEY_KIND: Readonly<{
  readonly INVALID: "invalid";
  readonly PUBLISHABLE: "publishable";
  readonly SECRET: "secret";
  readonly LEGACY_ANON: "legacy-anon";
  readonly LEGACY_SERVICE_ROLE: "legacy-service-role";
}>;

export function classifySupabaseKey(value: unknown): SupabaseKeyKind;
export function isSafePublicSupabaseKey(value: unknown): boolean;
export function isServiceSupabaseKey(value: unknown): boolean;
