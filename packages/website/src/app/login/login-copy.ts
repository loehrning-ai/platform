import type { Locale } from "@/lib/i18n/locale";

/**
 * Why sign-in is not offered right now. The four values are disjoint machine
 * states, not shades of one message: an outage is temporary and needs no
 * action, a pending configuration is a deployment fact, missing methods mean
 * the account runtime is healthy but no provider passed verification, and
 * `disabled` means this deployment simply runs without accounts. Each one gets
 * its own status line, headline, body and next step below.
 */
export type LoginUnavailableReason =
  | "outage"
  | "configuration"
  | "methods"
  | "disabled";

export interface LoginUnavailableCopy {
  /** Short machine state, rendered as the status chip. */
  readonly status: string;
  readonly headline: string;
  readonly body: string;
  /** What the reader should do, or that there is nothing to do. */
  readonly next: string;
}

export interface LoginAccountValueItem {
  readonly title: string;
  readonly body: string;
}

export interface LoginPublicLink {
  /** German path; the page localizes it before rendering. */
  readonly path: string;
  readonly label: string;
  readonly note: string;
}

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
    readonly configuration: string;
    readonly methodsUnavailable: string;
    readonly accountUnavailable: string;
  };
  readonly unavailable: Readonly<
    Record<LoginUnavailableReason, LoginUnavailableCopy>
  >;
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
    readonly google: string;
    readonly googlePending: string;
    readonly googleError: string;
    readonly github: string;
    readonly githubPending: string;
    readonly githubError: string;
    /**
     * Layered Art. 13 notice rendered beneath the provider buttons. One lead
     * per rendered provider set, so the notice never names a provider the page
     * does not offer or omits one it does. Information only, never a consent
     * control: consent is not the legal basis for storing the identity.
     */
    readonly oauthNotice: {
      readonly google: string;
      readonly github: string;
      readonly both: string;
      readonly detailsBefore: string;
      readonly detailsLink: string;
      readonly detailsAfter: string;
    };
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
    readonly unavailable: Readonly<Record<LoginUnavailableReason, string>>;
  };
  readonly accountValue: {
    readonly heading: string;
    readonly items: readonly LoginAccountValueItem[];
    readonly records: string;
    readonly control: string;
    readonly availability: string;
    readonly localNote: string;
  };
  readonly publicAccess: {
    readonly heading: string;
    readonly links: readonly LoginPublicLink[];
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
        "Optionales Lernkonto für Kursfortschritt und Teilnahmebestätigungen auf loehrning.ai.",
    },
    eyebrow: "Freie Lernplattform · Konto",
    heading: {
      outage: "Anmeldung nicht verfügbar.",
      available: "Lernstand synchronisieren.",
      unavailable: "Weiter ohne Konto.",
    },
    introduction: {
      publicAccess:
        "Bücher, Demos, KI-Check und technische Kurse sind ohne Anmeldung offen.",
      outage: "Bestehende Sitzungen laufen weiter.",
      available: "Die vier Grundlagenkurse brauchen ein kostenloses Konto.",
      configuration:
        "Dein Fortschritt bleibt vorerst in diesem Browser.",
      methodsUnavailable:
        "Dein Fortschritt bleibt in diesem Browser.",
      accountUnavailable: "Dein Fortschritt bleibt in diesem Browser.",
    },
    unavailable: {
      outage: {
        status: "Dienst antwortet nicht",
        headline: "Der Anmeldedienst ist gerade nicht erreichbar.",
        body: "Das liegt nicht an deinem Link oder deinem Konto.",
        next: "Lade die Seite in ein paar Minuten neu.",
      },
      configuration: {
        status: "Konfiguration offen",
        headline: "Die Anmeldung ist noch nicht freigeschaltet.",
        body: "Server, EU-Region und Auftragsverarbeitung sind für diese Umgebung noch nicht geprüft.",
        next: "Hier ist nichts zu tun. Sobald das geprüft ist, schaltet der Server die Anmeldung selbst frei.",
      },
      methods: {
        status: "Keine Methode freigegeben",
        headline: "Die Anmeldung ist hier noch nicht eingerichtet.",
        body: "",
        next: "Hier ist nichts zu tun. Die offenen Inhalte unten kannst du weiter nutzen.",
      },
      disabled: {
        status: "Hier nicht eingerichtet",
        headline: "Diese Umgebung läuft ohne Konto.",
        body: "Das ist gewollt.",
        next: "Hier ist nichts zu tun.",
      },
    },
    reason: {
      accountUnavailable:
        "Die Anmeldung ist hier nicht freigegeben, deshalb sind die vier Grundlagenkurse gerade nicht erreichbar.",
      accountUnavailableLink: "Zum Kursangebot",
      progressSave:
        "Melde dich an, um deinen Fortschritt zwischen Geräten zu synchronisieren.",
      progressSaveLink: "Zurück zum Kursangebot",
      courseLogin:
        "Dieser Grundlagenkurs endet mit einem Nachweis und braucht deshalb ein Lernkonto.",
      courseLoginLink: "Zurück zum Kursangebot",
      otherDevice:
        "Der Link wurde auf einem anderen Gerät oder in einem anderen Browser geöffnet. Fordere dort einen neuen an.",
      expired: "Dieser Link ist abgelaufen. Fordere einen neuen Link an.",
      invalid:
        "Dieser Link ist ungültig oder wurde bereits verwendet. Fordere einen neuen Link an.",
      authNotConfigured:
        "Die Anmeldung ist in dieser Umgebung nicht konfiguriert.",
      authUnavailable:
        "Der Anmeldedienst ist gerade nicht erreichbar. Dein Link wurde dabei nicht als ungültig gewertet.",
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
      google: "Mit Google anmelden",
      googlePending: "Google wird geöffnet…",
      googleError:
        "Die Google-Anmeldung konnte nicht gestartet werden. Versuche es später erneut.",
      github: "Mit GitHub anmelden",
      githubPending: "GitHub wird geöffnet…",
      githubError:
        "Die GitHub-Anmeldung konnte nicht gestartet werden. Versuche es später erneut.",
      oauthNotice: {
        google:
          "Bei der Anmeldung über Google speichert diese Plattform deine Google-Kontokennung, deine E-Mail-Adresse und deren Bestätigungsstatus sowie den in deinem Google-Konto hinterlegten Namen und die Adresse deines Profilbilds. Name und Profilbild werden nicht angezeigt und nicht ausgewertet.",
        github:
          "Bei der Anmeldung über GitHub speichert diese Plattform deine GitHub-Kontokennung, deinen GitHub-Benutzernamen, deine E-Mail-Adresse und deren Bestätigungsstatus sowie den in deinem GitHub-Konto hinterlegten Namen und die Adresse deines Profilbilds. Benutzername, Name und Profilbild werden nicht angezeigt und nicht ausgewertet.",
        both: "Bei der Anmeldung über Google oder GitHub speichert diese Plattform deine Kontokennung beim gewählten Anbieter, deine E-Mail-Adresse und deren Bestätigungsstatus sowie den dort hinterlegten Namen und die Adresse deines Profilbilds; bei GitHub kommt dein Benutzername hinzu. Name, Profilbild und Benutzername werden nicht angezeigt und nicht ausgewertet.",
        detailsBefore: "Einzelheiten und Rechtsgrundlagen stehen in der ",
        detailsLink: "Datenschutzerklärung",
        detailsAfter: ", Abschnitt 8.",
      },
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
      accountReadyNote: "Du brauchst kein Passwort.",
      accountUnavailableNote:
        "Die meisten Inhalte sind auch ohne Konto offen.",
      unavailable: {
        outage: "Anmeldedienst nicht erreichbar.",
        configuration: "Anmeldung noch gesperrt.",
        methods: "Keine Anmeldemethode verfügbar.",
        disabled: "Keine Anmeldemethode verfügbar.",
      },
    },
    accountValue: {
      heading: "Was ein Konto dazugibt",
      items: [
        {
          title: "Fortschritt auf allen Geräten",
          body: "Du machst am Laptop dort weiter, wo du am Handy aufgehört hast.",
        },
        {
          title: "Deine Werkzeuge mit deinen Dokumenten",
          body: "Werkzeuge wie die Lebenslauf-Engine öffnen sich mit deinen gespeicherten Dokumenten.",
        },
        {
          title: "Eigene KI anbinden",
          body: "Du legst fest, worauf dein eigener Assistent zugreifen darf, und entziehst ihm den Zugriff jederzeit.",
        },
      ],
      records:
        "Für jeden abgeschlossenen Kurs bekommst du eine Teilnahmebestätigung, die du jederzeit abrufen kannst.",
      control:
        "Du kannst deine Daten jederzeit exportieren, zurücksetzen oder löschen.",
      availability:
        "Werkzeuge und KI-Zugang erscheinen im Konto, sobald sie hier eingerichtet sind.",
      localNote:
        "Fortschritt ohne Konto bleibt in diesem Browser. Nach dem Anmelden kannst du ihn einmal ins Konto übernehmen.",
    },
    publicAccess: {
      heading: "Ohne Konto offen",
      links: [
        {
          path: "/kurse",
          label: "Kurse",
          note: "Lernpfade und technische Kurse.",
        },
        {
          path: "/buecher",
          label: "Bücher",
          note: "Ganze Bände zum Lesen und Herunterladen.",
        },
        {
          path: "/demos",
          label: "Demos",
          note: "Beispiele zum Ausprobieren.",
        },
        {
          path: "/ki-check",
          label: "KI-Check",
          note: "Kurzer Selbsttest zu deinem Stand.",
        },
      ],
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
        "Optional learning account for course progress and certificates of participation on loehrning.ai.",
    },
    eyebrow: "Open learning platform · Account",
    heading: {
      outage: "Sign-in unavailable.",
      available: "Sync learning progress.",
      unavailable: "Continue without an account.",
    },
    introduction: {
      publicAccess:
        "Books, demos, the AI check and technical courses are open without signing in.",
      outage: "Existing sessions keep running.",
      available: "The four foundation courses need a free account.",
      configuration:
        "For now, your progress stays in this browser.",
      methodsUnavailable:
        "Your progress stays in this browser.",
      accountUnavailable: "Your progress stays in this browser.",
    },
    unavailable: {
      outage: {
        status: "Service not responding",
        headline: "The authentication service cannot be reached.",
        body: "This is not caused by your link or your account.",
        next: "Reload this page in a few minutes.",
      },
      configuration: {
        status: "Configuration pending",
        headline: "Sign-in has not been cleared yet.",
        body: "The server, EU region and data processing are not yet verified for this environment.",
        next: "Nothing to do here. Once that is verified, the server enables sign-in by itself.",
      },
      methods: {
        status: "No method approved",
        headline: "Sign-in is not set up here yet.",
        body: "",
        next: "Nothing to do here. The open content below still works.",
      },
      disabled: {
        status: "Not set up here",
        headline: "This deployment runs without accounts.",
        body: "This is intentional.",
        next: "Nothing to do here.",
      },
    },
    reason: {
      accountUnavailable:
        "Sign-in is not enabled here, so the four foundation courses are unavailable for now.",
      accountUnavailableLink: "View all courses",
      progressSave: "Sign in to sync your progress between devices.",
      progressSaveLink: "Back to all courses",
      courseLogin:
        "This foundation course ends with a certificate of participation, so it needs a learning account.",
      courseLoginLink: "Back to all courses",
      otherDevice:
        "The link was opened on another device or in another browser. Request a new one there.",
      expired: "This link has expired. Request a new sign-in link.",
      invalid:
        "This link is invalid or has already been used. Request a new sign-in link.",
      authNotConfigured: "Sign-in is not configured in this environment.",
      authUnavailable:
        "The authentication service cannot be reached right now. Your link was not marked invalid.",
      missingCode:
        "The authentication response is incomplete. Start sign-in again on this page.",
      invalidLink:
        "The sign-in link expired, was already used, or could not be verified.",
      untrustedOrigin:
        "The origin of the authentication request could not be verified. Start sign-in again on this page.",
      invalidCodeFormat:
        "The authentication response was malformed. Start sign-in again on this page.",
      fallback: "Sign-in could not be completed. Start it again on this page.",
    },
    form: {
      title: "Sign-in method",
      google: "Sign in with Google",
      googlePending: "Opening Google…",
      googleError: "Google sign-in could not be started. Try again later.",
      github: "Sign in with GitHub",
      githubPending: "Opening GitHub…",
      githubError: "GitHub sign-in could not be started. Try again later.",
      oauthNotice: {
        google:
          "When you sign in with Google, this platform stores your Google account identifier, your email address and its verification status, and the name and profile-picture address held in your Google account. The name and profile picture are neither displayed nor evaluated.",
        github:
          "When you sign in with GitHub, this platform stores your GitHub account identifier, your GitHub username, your email address and its verification status, and the name and profile-picture address held in your GitHub account. The username, name and profile picture are neither displayed nor evaluated.",
        both: "When you sign in with Google or GitHub, this platform stores your account identifier with the provider you choose, your email address and its verification status, and the name and profile-picture address held in that account; with GitHub, your username is stored as well. The name, profile picture and username are neither displayed nor evaluated.",
        detailsBefore: "Details and legal bases are set out in the ",
        detailsLink: "privacy notice",
        detailsAfter: ", section 8.",
      },
      emailSeparator: "or use email",
      emailLabel: "Email address",
      emailHint: "You will receive a single-use link for this browser.",
      sendLink: "Send sign-in link",
      sendPending: "Sending link…",
      captchaRequired: "Complete the security check first.",
      otpProviderError:
        "The sign-in link could not be sent. Check the email address and complete the security check again.",
      otpTransportError: "The sign-in link could not be sent. Try again later.",
      sent: "Sign-in link sent. Open the email in this browser.",
      resendBlocked:
        "A sign-in link was just sent. Wait before requesting another.",
      accountReadyNote: "No password needed.",
      accountUnavailableNote: "Most content is open without an account.",
      unavailable: {
        outage: "Sign-in service unreachable.",
        configuration: "Sign-in still locked.",
        methods: "No sign-in method available.",
        disabled: "No sign-in method available.",
      },
    },
    accountValue: {
      heading: "What an account adds",
      items: [
        {
          title: "Progress on every device",
          body: "Continue on the laptop where you stopped on the phone.",
        },
        {
          title: "Your tools with your documents",
          body: "Tools such as the CV engine open with your saved documents.",
        },
        {
          title: "Connect your own AI",
          body: "You decide what your own assistant may access and can revoke that access any time.",
        },
      ],
      records:
        "Each finished course gives you a certificate of participation you can retrieve any time.",
      control: "You can export, reset or delete your data at any time.",
      availability:
        "Tools and the AI connection appear in your account once they are set up here.",
      localNote:
        "Progress without an account stays in this browser. After signing in you can import it into your account once.",
    },
    publicAccess: {
      heading: "Open without an account",
      links: [
        {
          path: "/kurse",
          label: "Courses",
          note: "Learning paths and technical courses.",
        },
        {
          path: "/buecher",
          label: "Books",
          note: "Complete volumes to read or download.",
        },
        {
          path: "/demos",
          label: "Demos",
          note: "Examples you can try out.",
        },
        {
          path: "/ki-check",
          label: "AI check",
          note: "A short self-test of where you stand.",
        },
      ],
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
