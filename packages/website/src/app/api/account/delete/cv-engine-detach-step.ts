import { PreDeleteStepError, type PreDeleteStep } from "./pre-delete";
import { detachCvEngineAccountArtifacts } from "@/lib/cv-engine/account-deletion";
import { CvEngineSchemaProbeError } from "@/lib/cv-engine/errors";
import { tryCreateServiceClient } from "@/lib/supabase/server";

/**
 * The hosted resume tool keeps its documents, its rendered PDF bookkeeping and
 * its pending artefact cleanup in this same project, all cascading off
 * `auth.users`. Deleting the identity first would take those rows with it and
 * leave the rendered files behind unqueued and unreferenced, so the tool's own
 * deletion transition has to run while the account still exists. When its
 * schema is not present here there is nothing to coordinate and the step is a
 * no-op; when it is present and refuses, the step rejects and nothing is
 * deleted at all.
 *
 * The transition is idempotent, so a deletion that fails after it ran and is
 * retried finds an account already in transition and converges rather than
 * stranding the learner between the two systems.
 *
 * The schema probe uses its own service-role client rather than the admin
 * client in the context: when SUPABASE_URL or the service-role key is absent
 * while the admin client was still constructible from the public URL, the
 * presence of the tool's schema is unknowable, and an unknowable answer must
 * not become an uncoordinated deletion.
 */
export const cvEngineDetachStep: PreDeleteStep = {
  name: "cv-engine-detach",
  async run({ ownerClient }) {
    const serviceClient = tryCreateServiceClient();
    if (!serviceClient) {
      throw new PreDeleteStepError("cv-engine schema unknowable", {
        cause: new CvEngineSchemaProbeError(),
      });
    }
    const outcome = await detachCvEngineAccountArtifacts({
      serviceClient,
      // The learner's own verified session: the transition takes no arguments
      // and reads auth.uid(), so only this client can identify the account.
      ownerClient,
    });
    if (outcome.status === "failed") {
      throw new PreDeleteStepError("cv-engine detach refused", {
        cause: outcome.error,
        ...(outcome.providerCode ? { providerCode: outcome.providerCode } : {}),
      });
    }
  },
};
