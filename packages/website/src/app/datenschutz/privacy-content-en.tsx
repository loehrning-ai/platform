import type { RuntimeFeatures } from "@/lib/runtime-features";
import { formatServiceAddress, LEGAL_IDENTITY } from "@/lib/legal-identity";
import { localizeHref } from "@/lib/i18n/locale";

export function EnglishPrivacyContent({
  features,
}: {
  readonly features: RuntimeFeatures;
}) {
  const address = LEGAL_IDENTITY.serviceAddress;
  const formattedAddress = formatServiceAddress(address);

  return (
    <section className="py-12" aria-labelledby="privacy-title">
      <div className="mx-auto max-w-3xl break-words px-6">
        <h1
          id="privacy-title"
          className="text-3xl font-bold tracking-[-0.04em] sm:text-4xl"
        >
          Privacy policy
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Last updated: 13 September 2026
        </p>

        <div className="mt-12 space-y-8 text-sm leading-relaxed text-muted-foreground">
          <LegalSection title="1. Controller">
            <p
              data-testid="responsible-party"
              data-service-address={formattedAddress ?? ""}
              data-address-street={address?.streetAndNumber ?? ""}
              data-address-postal-code={address?.postalCode ?? ""}
              data-address-city={address?.city ?? ""}
              data-address-country={address?.country ?? ""}
            >
              {LEGAL_IDENTITY.providerName}
              <br />
              {LEGAL_IDENTITY.projectName}
              {address ? (
                <>
                  <br />
                  {address.streetAndNumber}
                  <br />
                  {address.postalCode} {address.city}
                  <br />
                  {address.country}
                </>
              ) : null}
              <br />
              Email: {LEGAL_IDENTITY.email}
            </p>
            <p className="mt-2">
              This platform is intended for people aged 16 or older. Younger
              people should obtain consent from a parent or legal guardian.
            </p>
            <p className="mt-2">
              No data protection officer has been appointed; the conditions of
              Section 38 BDSG are not met.
            </p>
          </LegalSection>

          <LegalSection title="2. General information about data processing">
            <p>
              Personal data is processed only where this is necessary for the
              requested function, secure delivery of the platform, or a response
              to an enquiry, and where a legal basis exists. Optional provider
              functions remain disabled until their technical configuration and
              required data processing agreements have been documented.
            </p>
          </LegalSection>

          <LegalSection title="3. Hosting">
            {features.vercelHosting ? (
              <p>
                This deployment is hosted by Vercel Inc. (USA). Technically
                necessary connection and server data, such as IP address,
                browser type, and access time, is processed in that context. The
                legal basis is Article 6(1)(f) GDPR (secure and efficient
                delivery). Acceptance of the Vercel DPA was documented with a
                date before activation. Transfers to third countries are
                governed by the safeguards documented in that DPA.
              </p>
            ) : (
              <p>
                No external hosting provider is configured in this provider-free
                deployment. Before a public deployment, the actual operator must
                state the hosting provider used, the legal basis, and any
                transfers to third countries here.
              </p>
            )}
          </LegalSection>

          <LegalSection title="4. Contact and feedback">
            <p>
              When you contact the operator by email, the information you
              provide is processed to handle your enquiry. Depending on the
              context, the legal basis is Article 6(1)(b) or (f) GDPR.
            </p>
            {features.feedback ? (
              <p className="mt-2">
                The active feedback form stores the category, message,
                optionally only the page path without query string or fragment,
                and the time in Supabase. Name and email address are not
                requested as separate fields. Free text can still contain
                personal or confidential information; do not enter such
                information. Messages are removed after no more than 180 days by
                a daily deletion job. For abuse prevention, the trusted client
                IP supplied by the hosting layer is combined with a separate
                server-side secret to produce an HMAC-SHA-256 value used as a
                rate-limit key. The key is valid for no more than 24 hours.
                Expired counters are ignored and removed during a later limiter
                call. Removal at the exact second of expiry is not guaranteed.
              </p>
            ) : (
              <p className="mt-2">
                The server-side feedback form is disabled in this deployment.
                Feedback can be sent by email to tim@loehrning.ai.
              </p>
            )}
          </LegalSection>

          <LegalSection title="5. Cookies, local storage, and audience measurement">
            <p>
              Course progress and exercise drafts are stored in the browser
              using localStorage or sessionStorage for the learning function
              requested by the user. Technically necessary cookies may be set
              when a learning account is active. The learning account&apos;s
              sign-in cookie is set only during the sign-in you expressly
              request, remains on the terminal device until you sign out and for
              no longer than 30 days, and is renewed on each visit. It serves
              solely to avoid repeating sign-in on every page view and is used
              neither for audience measurement nor for advertising. Under{" "}
              <a
                href="https://www.gesetze-im-internet.de/ttdsg/__25.html"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Section 25(1) TDDDG
              </a>
              , consent is generally required when information is stored on or
              read from a terminal device. The exception in Section 25(2)(2)
              TDDDG applies only where access is strictly necessary for a
              digital service expressly requested by the user. The platform does
              not treat a technology as exempt from consent merely because it
              does not use cookies.
            </p>
            {features.account ? (
              <p className="mt-2">
                After a successfully coordinated account deletion, the technical
                account identifier remains stored as a local deletion marker for
                no more than 30 days. During that period, the marker prevents a
                suspended tab from synchronising obsolete learning data and
                instructs that tab to delete the associated browser learning
                data. An expired marker is removed automatically in an open tab
                or at the next platform start. After a deletion request has
                definitively failed and been cancelled, a corresponding
                cancellation marker also remains for no more than 30 days so
                that a delayed signal from another tab cannot overwrite the
                newer state. If the outcome of a deletion request is technically
                unclear, a safety marker remains until the outcome is resolved
                or the site data is manually deleted; progress synchronisation
                stays paused. The browser also stores a non-expiring, random
                technical generation for account data and no more than 128
                deletion identifiers derived with SHA-256. Raw account
                identifiers are not stored permanently for this purpose. These
                controls prevent an old tab from reading or writing retired data
                after deletion or a security cleanup. Once the limit is reached,
                a new global generation replaces the previous individual
                deletion identifiers. Only the identifier for the current
                deletion remains available for idempotent processing.
              </p>
            ) : null}
            {features.vercelTelemetry ? (
              <>
                <p className="mt-2">
                  Vercel Web Analytics and Speed Insights are explicitly enabled
                  in this deployment. They are used for audience measurement and
                  technical monitoring. The data-protection legal basis and the
                  technical assessment under Section 25 TDDDG were documented
                  with a date before activation. This platform does not perform
                  advertising tracking.
                </p>
                <p className="mt-2">
                  The platform additionally sends its own usage events to Vercel
                  Web Analytics. An event consists of a name from a fixed list
                  published in the source code and at most two categorical
                  values drawn from closed vocabularies, for example a course,
                  demo or workshop identifier, a lesson number, or an outcome
                  label such as &apos;passed&apos; or &apos;timed out&apos;.
                  Identifiers, email addresses, any account reference, free
                  text, quiz or exam answers and scores are not transmitted. The
                  events are neither combined into a visit, session or device
                  profile nor linked to a learning account. The recipient is
                  Vercel Inc. (USA) acting as a processor; the data processing
                  agreement and the third-country transfer safeguards described
                  in section 3 apply. Vercel Inc. is certified under the EU-U.S.
                  Data Privacy Framework (Implementing Decision (EU) 2023/1795).
                  The legal basis is Article 6(1)(f) GDPR. The measurement
                  script neither stores information on nor reads information
                  from the terminal device, so Section 25(1) TDDDG is not
                  engaged for these events and the exception in Section 25(2)(2)
                  TDDDG is not relied upon for them. This assessment was
                  documented separately and with a date before activation.
                </p>
              </>
            ) : (
              <p className="mt-2">
                Vercel Web Analytics and Speed Insights are disabled in this
                deployment. No advertising or audience-measurement cookies are
                set.
              </p>
            )}
          </LegalSection>

          <LegalSection title="6. Technical error diagnostics (Sentry)">
            {features.sentry ? (
              <p>
                Sentry (Functional Software, Inc., USA) is active for technical
                error diagnostics. Only error events containing a timestamp,
                stable error class, technical file names and line numbers, and
                validated technical identifiers are sent. Free-form error
                messages, request URLs, headers, cookies, request bodies, user
                context, and interaction histories are removed before
                transmission. sendDefaultPii is disabled. Performance tracing,
                release-health sessions, client reports, breadcrumbs, and
                session replay are disabled. Error events are discarded entirely
                on certificate-verification pages. The legal basis is Article
                6(1)(f) GDPR. The DPA and actual retention period were
                documented before activation.
              </p>
            ) : (
              <p>
                Sentry is disabled in this deployment. No error events are sent
                to Sentry.
              </p>
            )}
          </LegalSection>

          <LegalSection
            id="ki"
            title="7. AI learning feedback and isolated course execution"
          >
            {features.anthropic || features.gemini ? (
              <>
                <p>
                  When a user expressly starts an interactive AI exercise, the
                  learning text entered is sent to the active provider according
                  to the requested model and this deployment&apos;s allowlist.
                  Model selection transmits only a public model identifier. API
                  keys remain on the server. The application does not add paths,
                  email addresses, or account identifiers to the prompt; prompts
                  and responses are not logged.
                </p>
                {features.anthropic ? (
                  <p className="mt-2">
                    Anthropic Claude (Anthropic PBC, USA) is active. The
                    configured retention period for this API traffic is{" "}
                    {features.anthropicRetentionDays} days. Activation requires
                    a dated DPA review marker; that technical marker does not by
                    itself establish legal compliance.
                  </p>
                ) : null}
                {features.gemini ? (
                  <p className="mt-2">
                    Google Gemini API (Google LLC, USA) is active for Gemini 2.5
                    Flash-Lite. Its configured retention period is{" "}
                    {features.geminiRetentionDays} days. Runtime activation
                    requires dated DPA and paid-tier review markers and does not
                    admit Gemini free-tier traffic as a learner-text path. The
                    paid-tier marker is an operator-supplied review attestation;
                    the application does not read or prove Google billing-tier
                    status. Those technical markers do not by themselves
                    establish legal compliance.
                  </p>
                ) : null}
                <p className="mt-2">
                  Users must not enter personal, confidential, or otherwise
                  unapproved real-world data in exercise fields. A model denied
                  by the deployment, incomplete readiness, or an exhausted token
                  quota ends the call without invented provider output.
                </p>
                <p className="mt-2">
                  To avoid identical provider calls, each individual function or
                  runtime instance keeps no more than 500 responses in memory
                  for a maximum of one hour. The cache is not shared across all
                  instances. The stored data consists of a SHA-256 request key
                  and the provider response, not the input as a separate
                  plaintext field. The response can repeat parts of the input. A
                  restart or eviction from the bounded cache can remove the data
                  earlier.
                </p>
                <p className="mt-2">
                  For hourly abuse limits, the authenticated account identifier
                  and Vercel&apos;s trusted client IP are separately converted
                  into HMAC-SHA-256 keys with a dedicated server secret.
                  Practice provider calls also reserve daily token quotas before
                  a call: per pseudonymous account, or per pseudonymous IP for
                  open-access AI grading, and for the deployment as a whole.
                  Supabase stores counters and expiry times, not the raw address
                  or learning text. Expired counters are ignored and removed
                  during a later limiter call; physical removal at the exact
                  second of expiry is not guaranteed.
                </p>
              </>
            ) : (
              <p>
                Anthropic Claude and Google Gemini API are disabled for AI
                learning feedback in this deployment. Exercises use local or
                rule-based feedback and send no input to these model providers.
              </p>
            )}
            {features.courseTerminal ? (
              <p className="mt-2">
                When expressly started, the Codex, Data Science, Data
                Engineering, and Data Infrastructure course projects can each
                transmit a fixed sequence of allowed command identifiers to
                Vercel Sandbox. Browser-side analysis plans are structurally
                checked only; they are not executable SQL and are not sent to
                Sandbox. Every run creates a new non-persistent Node 24
                workspace containing only server-generated synthetic files, with
                deny-all networking, a maximum 60-second lifetime, and a
                10-second limit per command. Free-form shell input, learner
                repositories, credentials, and network installs are not
                accepted. stdout, stderr, exit codes, and the Git diff are
                returned in a private, non-cacheable response and are not stored
                in learning progress. Data-course runs additionally return fixed
                synthetic metric evidence. Successful server logs retain only
                route, status, command count, and duration; error logs use
                bounded technical step and error classes only. Workspace
                contents and result transcripts are not logged. The server
                requests Sandbox termination in all cases; non-persistent
                execution is not a promise of physical deletion at an exact
                second inside provider infrastructure. Account, IP, and global
                run quotas count accepted executions through the same
                pseudonymous Supabase counters. They do not measure cost or
                spend.
              </p>
            ) : (
              <p className="mt-2">
                Real isolated course execution through Vercel Sandbox is
                disabled in this deployment. The Codex repository lab explicitly
                labels its separate browser fallback as a simulation. The three
                data labs do not present simulated metrics as execution when no
                real run exists.
              </p>
            )}
          </LegalSection>

          <LegalSection title="8. Learning account and data storage (Supabase)">
            {features.account ? (
              <>
                <p>
                  Supabase (Supabase, Inc., USA) provides authentication, the
                  learning account, and server-side helper functions. The
                  configured project identifies{" "}
                  <strong className="text-foreground">
                    {features.supabaseRegion}
                  </strong>{" "}
                  as an EU region. When the learning account is used, the
                  processed data includes the email address, session data,
                  course progress, completion-record status, XP, badges,
                  learning streaks, completed checkpoints, and activity times.
                </p>
                <p className="mt-2">
                  The legal basis is Article 6(1)(b) GDPR and, for security and
                  abuse prevention, Article 6(1)(f) GDPR. Acceptance of the
                  Supabase DPA and the EU region were documented before
                  activation. Marketing leads and report enquiries are not
                  stored in the learning account.
                </p>
                {features.magicLink ? (
                  <p className="mt-2">
                    Before a magic link is sent, Cloudflare Turnstile
                    (Cloudflare, Inc., USA) is loaded as a visible, technically
                    necessary security check. Turnstile processes connection
                    data and signals from the browser and device to distinguish
                    automated requests from regular use. The platform does not
                    send the email address entered as a Turnstile parameter. The
                    short-lived, single-use token is passed to Supabase with the
                    OTP request and checked there against the Turnstile
                    configuration stored in Supabase. The function is used only
                    to protect the public login and email-delivery budgets;
                    feedback collection in the Turnstile widget is disabled. The
                    legal basis is Article 6(1)(f) GDPR. Access to terminal
                    device information relies on Section 25(2)(2) TDDDG only to
                    the extent that it is strictly necessary for this expressly
                    requested, protected sign-in. The hostname restriction,
                    provider terms, and{" "}
                    <a
                      href="https://www.cloudflare.com/turnstile-privacy-policy/"
                      rel="noreferrer"
                      className="underline underline-offset-2 hover:text-foreground"
                    >
                      Turnstile Privacy Addendum
                    </a>{" "}
                    were documented with a date before activation.
                  </p>
                ) : null}
                {features.google ? (
                  <>
                    <p className="mt-2">
                      For sign-in with Google, Supabase redirects the browser to
                      Google and then to the approved callback path on this
                      platform. Google processes the sign-in as an independent
                      controller; for users in the European Economic Area this
                      is, according to Google&apos;s own information, Google
                      Ireland Limited, Gordon House, Barrow Street, Dublin 4,
                      Ireland. There is no joint controllership within the
                      meaning of Article 26 GDPR, and Google is not a processor
                      of this platform for that processing. The platform
                      requests no additional Google permissions and, in
                      particular, receives no access to Google Drive, Calendar,
                      or other Google content. Cloudflare Turnstile is neither
                      loaded nor passed as a parameter for Google sign-in. The
                      provider and callback configuration was verified and dated
                      before activation.
                    </p>
                    <p className="mt-2">
                      After a successful sign-in, Google transmits the profile
                      details associated with the Google account to Supabase;
                      the source of this data is therefore Google, not an entry
                      made on this platform. These details are not only
                      processed for the sign-in itself, they are stored
                      permanently in the learning account. The stored fields are
                      the Google account identifier (sub, provider_id), the
                      identifier of the issuing Google endpoint (iss), the email
                      address and its verification status (email,
                      email_verified), the name held in the Google account
                      (name, full_name), and the address of the profile picture
                      held in the Google account (picture, avatar_url). The
                      authentication component additionally creates the
                      technical field phone_verified; no telephone number is
                      requested or stored.
                    </p>
                    <p className="mt-2">
                      The purpose of this storage is to create and operate the
                      learning account, to recognise the account reliably on
                      every subsequent sign-in, and to attribute course progress
                      to it. The legal basis for the account identifier, the
                      issuer identifier, the email address, and its verification
                      status is Article 6(1)(b) GDPR; the learning account
                      cannot be provided without them. The name and the
                      profile-picture address are not necessary for performance
                      of the contract. They are supplied unavoidably by the
                      authentication component in use: its Google sign-in flow
                      is fixed to the &quot;email&quot; and &quot;profile&quot;
                      permission scope and cannot be narrowed further by this
                      platform, and removing the fields afterwards would be
                      overwritten at the next sign-in. The legal basis for
                      storing these two fields is therefore Article 6(1)(f)
                      GDPR; the legitimate interest is the unmodified,
                      trouble-free operation of the authentication component in
                      its standard configuration. The platform neither displays
                      nor evaluates the name and profile picture; loading
                      external images is ruled out by this website&apos;s
                      Content Security Policy. This platform&apos;s agent
                      interface does not request the &quot;profile&quot;
                      permission scope and does not release the name or the
                      profile-picture address to third-party applications. The
                      right to object under Article 21 GDPR applies to this
                      storage based on Article 6(1)(f) GDPR.
                    </p>
                    <p className="mt-2">
                      Google Ireland Limited is established in the European
                      Union. In so far as Google transfers data to Google LLC in
                      the United States, Google states that it relies on the
                      European Commission&apos;s adequacy decision on the
                      EU-U.S. Data Privacy Framework (Implementing Decision (EU)
                      2023/1795 of 10 July 2023); Google LLC is certified under
                      that framework.
                    </p>
                    <p className="mt-2">
                      The Google sign-in identity, including the profile details
                      named above, is stored for as long as the learning account
                      exists; at each subsequent sign-in with Google it is
                      replaced by the values Google supplies at that time.
                      Providing this data is not required by law; it is,
                      however, required in order to create a learning account
                      via Google, so that without it no sign-in via Google can
                      take place. No automated decision-making, including
                      profiling, within the meaning of Article 22 GDPR takes
                      place. The rights set out in section 9 and the right to
                      lodge a complaint under section 11 apply unchanged.
                    </p>
                  </>
                ) : null}
                {features.adminAnalytics ? (
                  <p className="mt-2">
                    The operator views internal operating statistics in the
                    signed-in area. They consist solely of counts that are
                    computed server-side on each request from data already held
                    in the learning account and are not stored separately; no
                    separate statistics dataset is created and there is no
                    separate retention period for one. No names, email
                    addresses, identifiers, or free text, and no details from
                    the sign-in service, enter these statistics. For as long as
                    the platform holds only very few accounts, such counts
                    cannot be regarded as anonymous even though they are
                    aggregated; below a defined minimum size, therefore, no
                    individual figures are shown, only a notice that there is
                    insufficient data. The legal basis is Article 6(1)(f) GDPR;
                    the legitimate interest is being able to assess the use and
                    reach of the operator&apos;s own offering and to plan its
                    operation. No additional data is collected for this purpose,
                    no information is stored on or read from the terminal
                    device, and no data is transmitted to third parties. The
                    right to object under Article 21 GDPR applies to this
                    processing. In addition, the operating statistics show
                    aggregated reach and usage-event figures from Vercel Web
                    Analytics (section 5). They are retrieved server-side from
                    the processor on each request and are not stored on this
                    platform; individual figures below the minimum size are not
                    shown here either.
                  </p>
                ) : null}
                {!features.magicLink && !features.google ? (
                  <p className="mt-2">
                    The learning-account backend is active, but neither magic
                    link nor Google is currently approved as a fully verified
                    sign-in method for new sign-ins.
                  </p>
                ) : null}
                <p className="mt-2">
                  For progress synchronisation, course reset, PDF download, and
                  account deletion, Supabase also processes route-specific
                  HMAC-SHA-256 keys. Depending on the protection level, they are
                  derived from the verified account identifier or the trusted
                  client IP supplied by the hosting layer, using a separate
                  server-side secret. The raw IP and account identifier are not
                  stored in the rate-limit table. Depending on the function,
                  counters remain effective for no more than one hour, or 24
                  hours for account deletions. Expired entries are removed on
                  the next limiter call or by the daily cleanup job. If there is
                  no later call, physical removal can take up to eight days
                  after expiry.
                </p>
              </>
            ) : (
              <p>
                The Supabase learning account, magic-link and Google sign-in,
                server-side progress synchronisation, and account management are
                disabled in this deployment. Progress remains exclusively in the
                relevant browser. Later activation of the learning account
                requires a complete server configuration, a confirmed EU region,
                and a dated Supabase DPA. Each sign-in method also remains
                disabled until its own technical and legal configuration has
                been verified.
              </p>
            )}
          </LegalSection>

          <LegalSection title="9. Your rights">
            <p>
              Data subjects have, in particular, rights of access,
              rectification, erasure, restriction, data portability, and
              objection under Articles 15 to 21 GDPR. Requests can be sent to
              tim@loehrning.ai.
            </p>
            {features.account ? (
              <p className="mt-2">
                For data associated with an active learning account, the
                following page is also available after sign-in:{" "}
                <a
                  href={localizeHref("/konto/datenschutz", "en")}
                  className="text-brand-orange underline underline-offset-4 hover:text-foreground"
                >
                  /en/konto/datenschutz
                </a>
                .
              </p>
            ) : null}
          </LegalSection>

          <LegalSection title="10. Retention periods">
            <ul className="list-inside list-disc space-y-1">
              <li>
                Contact emails: until the enquiry has been handled, unless a
                statutory obligation requires longer retention.
              </li>
              <li>
                Browser data: on the terminal device until the user deletes it
                or deletes the browser data.
              </li>
              {features.vercelTelemetry ? (
                <li>
                  Vercel Web Analytics and Speed Insights: the platform itself
                  stores nothing for this purpose. At Vercel the reports are
                  available for the reporting window of the booked plan,
                  currently twelve months. No fixed deletion date is promised
                  here, because the processor reserves the right to retain the
                  data for longer.
                </li>
              ) : null}
              {features.account ? (
                <>
                  <li>
                    Learning account, course progress, and historical assessment
                    attempts: until account deletion or a valid erasure request.
                  </li>
                  {features.google ? (
                    <li>
                      Google sign-in identity, including the profile details
                      transmitted by Google (account identifier, email address
                      and verification status, name, profile-picture address):
                      until account deletion or a valid erasure request. At each
                      subsequent sign-in with Google, the record is replaced by
                      the values Google supplies at that time.
                    </li>
                  ) : null}
                  <li>
                    Account rate limits: effective for no more than one hour, or
                    24 hours for account deletions; physical cleanup no later
                    than eight days after expiry.
                  </li>
                  <li>
                    Local completion markers for account-deletion requests that
                    were successfully confirmed or definitively failed and were
                    cancelled: no more than 30 days; removed upon expiry in an
                    open tab or at the next platform start. Markers for a
                    deletion with a technically unresolved outcome: until the
                    outcome is resolved or the site data is manually deleted. A
                    random technical account-data generation and no more than
                    128 deletion identifiers derived with SHA-256 from the
                    technical account identifier: no fixed expiry period, as a
                    permanent block against old browser tabs. Raw account
                    identifiers are not stored in these permanent controls. Once
                    the limit is reached, a global generation replaces the
                    previous individual deletion identifiers. Only the
                    identifier for the current deletion remains available for
                    idempotent processing.
                  </li>
                </>
              ) : null}
              {features.anthropic ? (
                <li>
                  AI response cache: no more than one hour in the memory of a
                  server process, with no more than 500 entries per function.
                </li>
              ) : null}
              {features.feedback ? (
                <>
                  <li>
                    Feedback messages: no more than 180 days; a daily deletion
                    job removes older entries.
                  </li>
                  <li>
                    Feedback rate limit: valid for 24 hours; expired counters
                    are removed during later limiter calls.
                  </li>
                </>
              ) : null}
              {features.sentry && features.sentryRetentionDays ? (
                <li>
                  Sentry error events: {features.sentryRetentionDays} days, in
                  line with the configured retention period.
                </li>
              ) : null}
            </ul>
          </LegalSection>

          <LegalSection title="11. Right to lodge a complaint">
            <p>
              Under{" "}
              <a
                href="https://eur-lex.europa.eu/eli/reg/2016/679/oj"
                rel="noreferrer"
                className="underline underline-offset-2 hover:text-foreground"
              >
                Article 77 GDPR
              </a>
              , a data subject has the right to lodge a complaint with a
              supervisory authority, in particular in the Member State of their
              habitual residence, place of work, or the place of the alleged
              infringement. No specific state authority is identified while the
              operator location has not been entered conclusively.
            </p>
          </LegalSection>

          <LegalSection title="12. Encryption in transit">
            <p>
              Public deployments must transmit confidential content using
              HTTPS/TLS. The actual hosting operator is responsible for the
              correct TLS configuration.
            </p>
          </LegalSection>
        </div>
      </div>
    </section>
  );
}

function LegalSection({
  id,
  title,
  children,
}: {
  readonly id?: string;
  readonly title: string;
  readonly children: React.ReactNode;
}) {
  return (
    <div id={id} className={id ? "scroll-mt-24" : undefined}>
      <h2 className="mb-2 text-lg font-semibold text-foreground">{title}</h2>
      {children}
    </div>
  );
}
