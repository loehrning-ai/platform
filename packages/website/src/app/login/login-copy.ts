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
    readonly records: string;
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
    readonly availableInstruction: string;
    readonly unavailableInstruction: string;
    readonly google: string;
    readonly googlePending: string;
    readonly googleError: string;
    readonly github: string;
    readonly githubPending: string;
    readonly githubError: string;
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
    readonly lead: string;
    readonly items: readonly LoginAccountValueItem[];
    readonly records: string;
    readonly control: string;
    readonly availability: string;
    readonly localNote: string;
  };
  readonly publicAccess: {
    readonly heading: string;
    readonly lead: string;
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
        "Optionales Lernkonto für Kursfortschritt, Teilnahmebestätigungen und Lernnachweise auf loehrning.ai.",
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
        "Ein Konto hält deinen Lernfaden, deine Werkzeuge und deinen eigenen KI-Zugang an einer Stelle zusammen.",
      configuration:
        "Diese Umgebung wartet noch auf die Freigabe von Server, EU-Region und Auftragsverarbeitung. Fortschritt bleibt in diesem Browser.",
      methodsUnavailable:
        "Für neue Anmeldungen ist noch keine Methode freigegeben. Ohne bestehende Sitzung bleibt der Fortschritt in diesem Browser.",
      accountUnavailable:
        "Das optionale Lernkonto ist hier nicht aktiviert. Fortschritt bleibt in diesem Browser.",
      records:
        "Teilnahmebestätigung und Lernnachweis beruhen auf dem gespeicherten Abschlussstatus.",
    },
    unavailable: {
      outage: {
        status: "Dienst antwortet nicht",
        headline: "Der Anmeldedienst ist gerade nicht erreichbar.",
        body: "Die Anfrage an den Anmeldedienst ist fehlgeschlagen. Das sagt nichts über deinen Link oder dein Konto aus, und bestehende Sitzungen laufen weiter.",
        next: "Lade die Seite in ein paar Minuten neu. Bis dahin bleiben alle öffentlichen Inhalte erreichbar.",
      },
      configuration: {
        status: "Konfiguration offen",
        headline: "Die Anmeldung ist noch nicht freigeschaltet.",
        body: "Server, EU-Region und Auftragsverarbeitung sind für diese Umgebung noch nicht als geprüft hinterlegt. Ohne diese drei Belege bleibt das Konto absichtlich aus.",
        next: "Hier ist nichts zu tun. Sobald die Belege eingetragen sind, schaltet der Server die Anmeldung von selbst frei.",
      },
      methods: {
        status: "Keine Methode freigegeben",
        headline: "Weder Google noch der Login-Link sind hier geprüft.",
        body: "Das Konto selbst läuft, aber keine einzelne Anmeldemethode ist vollständig konfiguriert und verifiziert. Deshalb zeigt diese Seite kein Formular an, das ins Leere liefe.",
        next: "Eine bestehende Sitzung bleibt gültig. Neue Anmeldungen sind erst nach der Freigabe einer Methode möglich.",
      },
      disabled: {
        status: "Hier nicht eingerichtet",
        headline: "Diese Umgebung läuft ohne Konto.",
        body: "Es gibt hier keinen Anmeldedienst, an den sich diese Seite wenden könnte. Das ist kein Fehler, sondern die Konfiguration dieser Installation.",
        next: "Bücher, Demos, KI-Check und die technischen Kurse bleiben vollständig offen. Dein Fortschritt liegt so lange in diesem Browser.",
      },
    },
    reason: {
      accountUnavailable:
        "Eine Anmeldung ist in dieser Umgebung nicht freigegeben. Die vier Grundlagenkurse sind deshalb vorübergehend nicht erreichbar. Bücher, Demos, KI-Check und technische Kurse bleiben öffentlich.",
      accountUnavailableLink: "Zum Kursangebot",
      progressSave:
        "Melde dich an, um deinen Lernfortschritt zwischen Geräten zu synchronisieren. Bücher und technische Kurse bleiben ohne Anmeldung nutzbar.",
      progressSaveLink: "Zurück zum Kursangebot",
      courseLogin:
        "Dieser Grundlagenkurs führt zu einer Teilnahmebestätigung oder einem Lernnachweis und benötigt ein Lernkonto. Technische Kurse, Bücher und Demos bleiben ohne Anmeldung nutzbar.",
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
      github: "Mit GitHub anmelden",
      githubPending: "GitHub wird geöffnet…",
      githubError:
        "Die GitHub-Anmeldung konnte nicht gestartet werden. Versuche es später erneut.",
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
        "Kein Passwort. Google oder ein einmaliger Link, mehr braucht das Konto nicht.",
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
    accountValue: {
      heading: "Was ein Konto dazugibt",
      lead: "Drei Dinge, die ohne Anmeldung nicht gehen. Alles andere auf dieser Plattform bleibt offen.",
      items: [
        {
          title: "Ein Lernfaden über alle Geräte",
          body: "Dein Kursstand liegt im Konto statt in einem einzelnen Browser. Du machst am Laptop dort weiter, wo du am Handy aufgehört hast, und siehst zuerst den nächsten Schritt.",
        },
        {
          title: "Deine Werkzeuge mit deinen Dokumenten",
          body: "Werkzeuge wie die Lebenslauf-Engine öffnen sich mit deinen eigenen Dokumenten, statt jedes Mal bei einer leeren Seite anzufangen.",
        },
        {
          title: "Deine eigene KI verbunden",
          body: "Du verbindest deinen eigenen Assistenten mit deinem Konto, gibst ihm genau den Zugriff, den du willst, und nimmst ihn genauso wieder weg.",
        },
      ],
      records:
        "Abgeschlossene Kurse ergeben eine Teilnahmebestätigung, die abrufbar bleibt.",
      control:
        "Exportieren, zurücksetzen, löschen: jederzeit und ohne Rückfrage.",
      availability:
        "Werkzeuge und KI-Zugang erscheinen, sobald dieser Server sie konfiguriert hat. Der Lernfaden arbeitet ab der ersten Anmeldung.",
      localNote:
        "Ohne Konto bleibt dein Fortschritt in diesem Browser und wird beim Anmelden nicht übernommen. Ein Konto ist für keinen Kurs Voraussetzung.",
    },
    publicAccess: {
      heading: "Ohne Konto offen",
      lead: "Das hier braucht keine Anmeldung, heute nicht und später nicht.",
      links: [
        {
          path: "/kurse",
          label: "Kurse",
          note: "Lernpfade und technische Kurse, frei lesbar.",
        },
        {
          path: "/buecher",
          label: "Bücher",
          note: "Vollständige Bände im Browser, mit Download.",
        },
        {
          path: "/demos",
          label: "Demos",
          note: "Laufende Beispiele zum Ausprobieren.",
        },
        {
          path: "/ki-check",
          label: "KI-Check",
          note: "Kurzer Selbsttest, wo du gerade stehst.",
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
        "Books, demos, the AI check, and technical courses are available without signing in.",
      outage:
        "The authentication service is not responding. Public content continues to work.",
      available:
        "An account holds your learning thread, your tools, and your own AI connection in one place.",
      configuration:
        "This environment is still waiting on the server, EU region, and data-processing clearances. Progress remains in this browser.",
      methodsUnavailable:
        "No sign-in method is approved yet. Without an existing session, progress remains in this browser.",
      accountUnavailable:
        "The optional learning account is disabled here. Progress remains in this browser.",
      records:
        "The certificate of participation rests on the stored completion status.",
    },
    unavailable: {
      outage: {
        status: "Service not responding",
        headline: "The authentication service cannot be reached.",
        body: "The request to the authentication service failed. That says nothing about your link or your account, and existing sessions keep running.",
        next: "Reload this page in a few minutes. Until then every public part of the platform stays reachable.",
      },
      configuration: {
        status: "Configuration pending",
        headline: "Sign-in has not been cleared yet.",
        body: "The server, EU region, and data-processing clearances are not recorded for this environment. Without those three, the account stays off on purpose.",
        next: "Nothing to do here. Once the clearances are recorded, the server enables sign-in by itself.",
      },
      methods: {
        status: "No method approved",
        headline: "Neither Google nor the email link is verified here.",
        body: "The account runtime itself is up, but no single sign-in method is fully configured and verified. That is why this page shows no form that would lead nowhere.",
        next: "An existing session stays valid. New sign-ins become possible once a method is approved.",
      },
      disabled: {
        status: "Not set up here",
        headline: "This deployment runs without accounts.",
        body: "There is no authentication service for this page to talk to. That is the configuration of this installation, not a failure.",
        next: "Books, demos, the AI check, and the technical courses stay fully open. Your progress lives in this browser meanwhile.",
      },
    },
    reason: {
      accountUnavailable:
        "Sign-in is not enabled in this environment. The four foundation courses are therefore temporarily unavailable. Books, demos, the AI check, and technical courses remain public.",
      accountUnavailableLink: "View all courses",
      progressSave:
        "Sign in to sync your learning progress between devices. Books and technical courses remain available without an account.",
      progressSaveLink: "Back to all courses",
      courseLogin:
        "This foundation course leads to a certificate of participation and needs a learning account. Technical courses, books, and demos stay usable without signing in.",
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
      fallback: "Sign-in could not be completed. Start it again on this page.",
    },
    form: {
      title: "Sign-in method",
      availableInstruction: "Choose an approved sign-in method.",
      unavailableInstruction:
        "No sign-in method is approved for this environment.",
      google: "Sign in with Google",
      googlePending: "Opening Google…",
      googleError: "Google sign-in could not be started. Try again later.",
      github: "Sign in with GitHub",
      githubPending: "Opening GitHub…",
      githubError: "GitHub sign-in could not be started. Try again later.",
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
      accountReadyNote:
        "No password. Google or a single-use link is all the account needs.",
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
    accountValue: {
      heading: "What an account adds",
      lead: "Three things that need a sign-in. Everything else on this platform stays open.",
      items: [
        {
          title: "One learning thread across devices",
          body: "Your course position lives in the account instead of one browser. Continue on the laptop where the phone left off, with the next step shown first.",
        },
        {
          title: "Your tools with your documents",
          body: "Tools such as the CV engine open with your own documents instead of starting from a blank page every time.",
        },
        {
          title: "Your own AI connected",
          body: "Connect your own assistant to the account, grant it exactly the access you want, and take that access away again just as easily.",
        },
      ],
      records:
        "Finished courses produce a certificate of participation that stays retrievable.",
      control: "Export, reset, delete: any time and without asking.",
      availability:
        "Tools and the AI connection appear once this server has them configured. The learning thread works from the first sign-in.",
      localNote:
        "Without an account your progress stays in this browser and is not carried over when you sign in. No course requires an account.",
    },
    publicAccess: {
      heading: "Open without an account",
      lead: "None of this needs a sign-in, today or later.",
      links: [
        {
          path: "/kurse",
          label: "Courses",
          note: "Learning paths and technical courses, free to read.",
        },
        {
          path: "/buecher",
          label: "Books",
          note: "Complete volumes in the browser, with downloads.",
        },
        {
          path: "/demos",
          label: "Demos",
          note: "Running examples you can try out.",
        },
        {
          path: "/ki-check",
          label: "AI check",
          note: "A short assessment of where you stand.",
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
