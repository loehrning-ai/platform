import type { Locale } from "@/lib/i18n/locale";

export interface LoginCopy {
  readonly metadata: {
    readonly title: string;
    readonly description: string;
  };
  readonly eyebrow: string;
  readonly heading: {
    readonly outage: string;
    readonly available: string;
    readonly unavailable: string;
  };
  readonly introduction: {
    readonly publicAccess: string;
    readonly outage: string;
    readonly available: string;
    readonly methodsUnavailable: string;
    readonly accountUnavailable: string;
    readonly records: string;
  };
  readonly reason: {
    readonly accountUnavailable: string;
    readonly accountUnavailableLink: string;
    readonly progressSave: string;
    readonly progressSaveLink: string;
    readonly courseLogin: string;
    readonly courseLoginLink: string;
    readonly otherDevice: string;
    readonly expired: string;
    readonly invalid: string;
    readonly authNotConfigured: string;
    readonly authUnavailable: string;
    readonly missingCode: string;
    readonly invalidLink: string;
    readonly untrustedOrigin: string;
    readonly invalidCodeFormat: string;
    readonly fallback: string;
  };
  readonly form: {
    readonly title: string;
    readonly availableInstruction: string;
    readonly unavailableInstruction: string;
    readonly google: string;
    readonly googlePending: string;
    readonly googleError: string;
    readonly emailSeparator: string;
    readonly emailLabel: string;
    readonly emailHint: string;
    readonly sendLink: string;
    readonly sendPending: string;
    readonly captchaRequired: string;
    readonly otpProviderError: string;
    readonly otpTransportError: string;
    readonly sent: string;
    readonly resendBlocked: string;
    readonly accountReadyNote: string;
    readonly accountUnavailableNote: string;
    readonly unavailable: {
      readonly outage: string;
      readonly configuration: string;
      readonly methods: string;
      readonly disabled: string;
    };
  };
  readonly turnstile: {
    readonly label: string;
    readonly ready: string;
    readonly error: string;
    readonly expired: string;
    readonly loading: string;
  };
}

export const LOGIN_COPY: Readonly<Record<Locale, LoginCopy>> = {
  de: {
    metadata: {
      title: "Login | Freie Lernplattform",
      description:
        "Optionales Lernkonto für Kursfortschritt, Lernnachweise und Zertifikate auf loehrning.ai.",
    },
    eyebrow: "Freie Lernplattform · Konto",
    heading: {
      outage: "Anmeldung nicht verfügbar.",
      available: "Lernstand synchronisieren.",
      unavailable: "Weiter ohne Konto.",
    },
    introduction: {
      publicAccess:
        "Bücher, Demos, KI-Check und technische Kurse sind ohne Anmeldung zugänglich.",
      outage:
        "Der Anmeldedienst antwortet nicht. Öffentliche Inhalte funktionieren weiter.",
      available:
        "Ein Lernkonto synchronisiert Kursfortschritt zwischen Geräten.",
      methodsUnavailable:
        "Für neue Anmeldungen ist noch keine Methode freigegeben. Ohne bestehende Sitzung bleibt der Fortschritt in diesem Browser.",
      accountUnavailable:
        "Das optionale Lernkonto ist hier nicht aktiviert. Fortschritt bleibt in diesem Browser.",
      records:
        "Lernnachweise und Zertifikate basieren auf dem gespeicherten Abschlussstatus.",
    },
    reason: {
      accountUnavailable:
        "Eine Anmeldung ist in dieser Umgebung nicht freigegeben. Die vier Grundlagenkurse sind deshalb vorübergehend nicht erreichbar. Bücher, Demos, KI-Check und technische Kurse bleiben öffentlich.",
      accountUnavailableLink: "Zum Kursangebot",
      progressSave:
        "Melde dich an, um deinen Lernfortschritt zwischen Geräten zu synchronisieren. Bücher und technische Kurse bleiben ohne Anmeldung nutzbar.",
      progressSaveLink: "Zurück zum Kursangebot",
      courseLogin:
        "Dieser Grundlagenkurs führt zu einem Lernnachweis oder Zertifikat und benötigt ein Lernkonto. Technische Kurse, Bücher und Demos bleiben ohne Anmeldung nutzbar.",
      courseLoginLink: "Zurück zum Kursangebot",
      otherDevice:
        "Der Link wurde auf einem anderen Gerät oder in einem anderen Browser geöffnet. Fordere dort einen neuen Link an.",
      expired: "Dieser Link ist abgelaufen. Fordere einen neuen Link an.",
      invalid:
        "Dieser Link ist ungültig oder wurde bereits verwendet. Fordere einen neuen Link an.",
      authNotConfigured:
        "Die Anmeldung ist in dieser Umgebung nicht konfiguriert.",
      authUnavailable:
        "Der Anmeldedienst ist vorübergehend nicht erreichbar. Der Link wurde nicht als ungültig eingestuft.",
      missingCode:
        "Die Anmeldeantwort ist unvollständig. Starte die Anmeldung auf dieser Seite neu.",
      invalidLink:
        "Der Anmeldelink ist abgelaufen, wurde bereits verwendet oder konnte nicht bestätigt werden.",
      untrustedOrigin:
        "Die Herkunft der Anmeldeanfrage konnte nicht bestätigt werden. Starte die Anmeldung auf dieser Seite neu.",
      invalidCodeFormat:
        "Die Anmeldeantwort war fehlerhaft. Starte die Anmeldung auf dieser Seite neu.",
      fallback:
        "Die Anmeldung konnte nicht abgeschlossen werden. Starte sie auf dieser Seite neu.",
    },
    form: {
      title: "Anmeldemethode",
      availableInstruction: "Wähle eine freigegebene Anmeldemethode.",
      unavailableInstruction:
        "Für diese Umgebung ist keine Anmeldemethode freigegeben.",
      google: "Mit Google anmelden",
      googlePending: "Google wird geöffnet…",
      googleError:
        "Die Google-Anmeldung konnte nicht gestartet werden. Versuche es später erneut.",
      emailSeparator: "oder per E-Mail",
      emailLabel: "E-Mail-Adresse",
      emailHint:
        "Du erhältst einen einmal verwendbaren Link für diesen Browser.",
      sendLink: "Login-Link senden",
      sendPending: "Link wird gesendet…",
      captchaRequired: "Schließe zuerst die Sicherheitsprüfung ab.",
      otpProviderError:
        "Der Login-Link konnte nicht verschickt werden. Prüfe die E-Mail-Adresse und schließe die Sicherheitsprüfung erneut ab.",
      otpTransportError:
        "Der Login-Link konnte nicht verschickt werden. Versuche es später erneut.",
      sent: "Login-Link verschickt. Öffne die E-Mail in diesem Browser.",
      resendBlocked:
        "Ein Login-Link wurde gerade verschickt. Warte, bevor du einen weiteren anforderst.",
      accountReadyNote:
        "Das Lernkonto speichert Kursfortschritt, XP und Abschlussstatus. Die meisten Inhalte und Downloads bleiben öffentlich; vier Grundlagenkurse benötigen ein Konto.",
      accountUnavailableNote:
        "Die meisten Kurse, Bücher, Demos und Downloads bleiben ohne Konto zugänglich.",
      unavailable: {
        outage: "Der Anmeldedienst ist vorübergehend nicht erreichbar.",
        configuration:
          "Die Anmeldung bleibt deaktiviert, bis Server-, EU-Regions- und Auftragsverarbeitungskonfiguration verifiziert sind.",
        methods:
          "Keine Anmeldemethode ist für diese Umgebung vollständig konfiguriert und verifiziert.",
        disabled: "Die Anmeldung ist in dieser Umgebung nicht konfiguriert.",
      },
    },
    turnstile: {
      label: "Sicherheitsprüfung",
      ready: "Sicherheitsprüfung abgeschlossen.",
      error:
        "Sicherheitsprüfung nicht verfügbar. Lade die Seite neu oder deaktiviere den Inhaltsblocker für diese Seite.",
      expired:
        "Sicherheitsprüfung abgelaufen. Schließe die erneuerte Prüfung ab.",
      loading: "Sicherheitsprüfung wird geladen.",
    },
  },
  en: {
    metadata: {
      title: "Login | Open learning platform",
      description:
        "Optional learning account for course progress, learning records, and certificates on loehrning.ai.",
    },
    eyebrow: "Open learning platform · Account",
    heading: {
      outage: "Sign-in unavailable.",
      available: "Sync learning progress.",
      unavailable: "Continue without an account.",
    },
    introduction: {
      publicAccess:
        "Books, demos, the AI check, and technical courses are available without signing in.",
      outage:
        "The authentication service is not responding. Public content continues to work.",
      available: "An account syncs course progress between devices.",
      methodsUnavailable:
        "No sign-in method is approved yet. Without an existing session, progress remains in this browser.",
      accountUnavailable:
        "The optional learning account is disabled here. Progress remains in this browser.",
      records:
        "Learning records and certificates are based on stored completion data.",
    },
    reason: {
      accountUnavailable:
        "Sign-in is not enabled in this environment. The four foundation courses are therefore temporarily unavailable. Books, demos, the AI check, and technical courses remain public.",
      accountUnavailableLink: "View all courses",
      progressSave:
        "Sign in to sync your learning progress between devices. Books and technical courses remain available without an account.",
      progressSaveLink: "Back to all courses",
      courseLogin:
        "This foundation course leads to a learning record or certificate and requires an account. Technical courses, books, and demos remain available without signing in.",
      courseLoginLink: "Back to all courses",
      otherDevice:
        "The link was opened on another device or in another browser. Request a new link there.",
      expired: "This link has expired. Request a new sign-in link.",
      invalid:
        "This link is invalid or has already been used. Request a new sign-in link.",
      authNotConfigured: "Sign-in is not configured in this environment.",
      authUnavailable:
        "The authentication service is temporarily unavailable. The link was not classified as invalid.",
      missingCode:
        "The authentication response is incomplete. Start sign-in again on this page.",
      invalidLink:
        "The sign-in link expired, was already used, or could not be verified.",
      untrustedOrigin:
        "The origin of the authentication request could not be verified. Start sign-in again on this page.",
      invalidCodeFormat:
        "The authentication response was malformed. Start sign-in again on this page.",
      fallback:
        "Sign-in could not be completed. Start it again on this page.",
    },
    form: {
      title: "Sign-in method",
      availableInstruction: "Choose an approved sign-in method.",
      unavailableInstruction:
        "No sign-in method is approved for this environment.",
      google: "Sign in with Google",
      googlePending: "Opening Google…",
      googleError:
        "Google sign-in could not be started. Try again later.",
      emailSeparator: "or use email",
      emailLabel: "Email address",
      emailHint:
        "You will receive a single-use link for this browser.",
      sendLink: "Send sign-in link",
      sendPending: "Sending link…",
      captchaRequired: "Complete the security check first.",
      otpProviderError:
        "The sign-in link could not be sent. Check the email address and complete the security check again.",
      otpTransportError:
        "The sign-in link could not be sent. Try again later.",
      sent: "Sign-in link sent. Open the email in this browser.",
      resendBlocked:
        "A sign-in link was just sent. Wait before requesting another.",
      accountReadyNote:
        "The account stores course progress, XP, and completion status. Most content and downloads remain public; four foundation courses require an account.",
      accountUnavailableNote:
        "Most courses, books, demos, and downloads remain available without an account.",
      unavailable: {
        outage: "The authentication service is temporarily unavailable.",
        configuration:
          "Sign-in remains disabled until the server, EU region, and data-processing configuration are verified.",
        methods:
          "No sign-in method is fully configured and verified for this environment.",
        disabled: "Sign-in is not configured in this environment.",
      },
    },
    turnstile: {
      label: "Security check",
      ready: "Security check complete.",
      error:
        "Security check unavailable. Reload the page or disable the content blocker for this page.",
      expired: "Security check expired. Complete the renewed check.",
      loading: "Security check loading.",
    },
  },
};
