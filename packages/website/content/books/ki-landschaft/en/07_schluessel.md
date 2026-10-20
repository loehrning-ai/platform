# Who holds the key

::ticker{ref="h09-field.cert_n" tail="certificates that company websites deliver, and the question of who issued them."}

Of {{h09-field.cert_n}} certificates, a body based in the United States issued {{h09-field.cert_us_hq}}, and European-run issuers reach {{h09-field.cert_eu_strict}} (interval {{h09-field.cert_eu_strict.range}}).

Behind every website stand providers, from the certificate for the encrypted connection through embedded services to, sometimes, an AI provider. I asked five questions, each with a base of its own. What I counted was certificates, loaded services, named AI providers, platforms in job titles and partner lists of consultancies. The seat of a provider says nothing about the location of the server, and a certificate is mostly the default of the host, that is the company where the website lives.

Let's Encrypt alone accounts for {{h09-field.cert_letsencrypt}}. Add providers with a registered office in Europe and it is {{h09-field.cert_eu_incl}}. Of {{h09-field.services_n}} websites, {{h09-field.services_google}} load a Google service, and with all US services it is {{h09-field.services_us_broad}} on the broad count.

::figure{id="h09-field"}

Of {{h09-field.ai_pages}} pages with the AI word, {{h09-field.ai_named_pages}} name a provider, and {{h09-field.ai_none_share}} name none. Of these {{h09-field.ai_named_pages}}, over {{h09-field.ai_us_share_strict_floor}} are American on the strict count, and with a broader provider list that covers {{h09-field.ai_named_broad}} pages it is {{h09-field.ai_us_share_broad}}.

In job titles, {{h09-field.jobs_us_employers}} employers name a US platform, {{h09-field.jobs_azure_employers}} of them Azure against {{h09-field.jobs_aws_employers}} for AWS, and {{h09-field.jobs_eu_employers}} name a European one. Of {{h09-field.partner_n}} consultancies with a partner list, {{h09-field.partner_microsoft}} name Microsoft, and a European cloud or AI is named by {{h09-field.partner_eu_cloud}} each. The partner lists are self-reported and were read out with AI. The detection lists are longer for US providers than for European ones.

## Protection headers and server go together

The headers a website hands to the browser for protection, the protection headers, go closely with the server software in my data, and I suspect the host sets a lot here. Of {{h08-field.firms_headers}} websites with stored headers, {{h08-field.zero_all}} send none of six protection headers, on Apache it is {{h08-field.zero_apache}}, behind Cloudflare {{h08-field.zero_cloudflare}}. The AUC for the question of whether a page sends HSTS, the rule to connect only in encrypted form, is {{h08-field.auc_platform}} (interval {{h08-field.auc_platform.range}}) when the platform is known and {{h08-field.auc_firm}} with the features of the firm, and 0.5 would be a coin toss. Firm features depend on the matching of firm to website, which held in only {{h05-waterfall.audit_own}}, and will be recalculated with checked websites.

::stage{id="h08-field"}

{{h08-field.banner_sites}} websites ({{h08-field.banner_share}}) report word for word the same server version. Of them, {{h08-field.banner_enforced}} enforce the mail protection rule DMARC, among the rest it is {{h08-field.other_enforced}}. Together they account for {{h08-field.enforced_share_banner}} of the {{h08-field.enforced_all}} enforced policies. That fits shared defaults but does not prove them.

{{h08-field.php_sites}} websites show their PHP version, and only such pages are in this number. For {{h08-field.php_eol}} of them the version is in use beyond the end of vendor support, for a median of {{h08-field.php_years_past}} years. An old version can still be patched, because providers often fix errors without a new version number.

Depending on the state, {{rand-kap7.https_laender_min}} to {{rand-kap7.https_laender_max}} of the homepages run on HTTPS. Among the shortest pages HTTPS is missing in {{rand-kap7.thin_no_https}} of the cases.

> **What you can do:** Ask your host three questions. Who issues your certificate? Which protection headers does it send for your site? Which mail policy applies to your domain? The answer is probably its default, and then you decide whether you want it that way and note the date of the answer.
