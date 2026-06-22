// questions/section_7.js
// Section 7: Security Architecture
// Subsections: 7.1 Authentication & Authorisation
//              7.2 Token Standards & Strategy
//              7.3 API Security
//              7.4 Zero Trust Architecture
//              7.5 Secrets Management
//              7.6 Network Security
//              7.7 Threat Modeling
//              7.8 Data Protection
// Target: ~36 questions
// Added: 2026-04-27

const SECTION_7_QUESTIONS = [

  // ============================================================
// SECTION 7 — SECURITY ARCHITECTURE
// Batch 1 of N — Subsection 7.1 Authentication & Authorisation
// IDs: 7.1.01 → 7.1.08
//
// SPLICE INSTRUCTIONS:
//   Open questions/section_7.js
//   Insert the array contents below INSIDE the existing
//   `const SECTION_7_QUESTIONS = [ ... ];` declaration.
//   If file is empty, wrap with:
//     const SECTION_7_QUESTIONS = [ <paste here> ];
// ============================================================

  // ---------- 7.1.01 ----------
  {
    id: "7.1.01",
    section: 7,
    subsection: "7.1",
    level: "basic",

    question: "What problem does OAuth2 solve, and how is OIDC different from it?",

    quick_answer: "→ OAuth2 = delegated AUTHORIZATION (access to resources)\n→ OIDC = AUTHENTICATION layer built on top of OAuth2\n→ OAuth2 issues access_token; OIDC adds id_token (JWT)\n→ id_token proves WHO the user is; access_token proves WHAT they can do\n→ Rule: 'logging in with Google' = OIDC, 'app posting to your Google Drive' = OAuth2",

    detailed_answer: "OAuth2 was designed to solve the password anti-pattern: third-party apps were storing user passwords to act on their behalf. OAuth2 introduced delegated authorization — the user authenticates with the resource owner (e.g., Google), and the app receives a scoped access_token instead of the password. The token says 'this app may read this user's calendar for 1 hour' — nothing more.\n\nOAuth2 deliberately said nothing about WHO the user is. That gap got filled by ad-hoc patterns (calling /userinfo on Google, parsing Facebook's /me) and they were all incompatible. OIDC (OpenID Connect) standardized this: it sits ON TOP of OAuth2 and adds an id_token — a signed JWT containing user identity claims (sub, email, name, etc.) and metadata (iss, aud, exp, nonce).\n\nThe distinction matters in interviews because candidates conflate them. If your use case is 'a user logs into our app using their corporate Google account,' that is authentication → OIDC. If your use case is 'our app needs to upload files to the user's Dropbox,' that is authorization → OAuth2. Most modern flows do both: OIDC returns id_token + access_token in a single round trip, so you authenticate the user AND get a token to call APIs.\n\nTrade-off to articulate: OIDC is opinionated and standardized (good for SSO, identity federation), but adds JWT validation complexity. Pure OAuth2 with opaque tokens is simpler if you only need authorization and your resource server can introspect tokens.",

    key_points: [
      "OAuth2 = authorization framework — answers 'what can this app do on behalf of the user'",
      "OIDC = authentication protocol on OAuth2 — answers 'who is the user'",
      "id_token is always a JWT with standard claims (sub, iss, aud, exp, nonce)",
      "access_token format is opaque to the client — could be JWT or reference token",
      "nonce in id_token prevents replay attacks during the auth flow",
      "Most production identity providers (Auth0, Okta, Cognito, Keycloak) implement both"
    ],

    hint: "If a user 'logs in with X,' which token actually proves their identity to your backend — and which one lets your backend call X's APIs?",

    common_trap: "Treating the access_token as proof of user identity. The access_token is opaque to the client by design — parsing it for user info is a contract violation that breaks when the IdP rotates token format. Always use id_token (OIDC) or /userinfo endpoint for identity.",

    follow_up_questions: [
      {
        text: "Walk me through the Authorization Code + PKCE flow end to end.",
        type: "linked",
        links_to: "7.1.02"
      },
      {
        text: "When would you choose OAuth2 Client Credentials over Authorization Code?",
        type: "linked",
        links_to: "7.1.03"
      },
      {
        text: "What's the difference between an id_token and a session cookie?",
        type: "inline",
        mini_answer: "id_token is a one-time identity assertion at login — it should NOT be sent on every API call. Once your backend verifies the id_token, establish a session (cookie or your own short-lived JWT). Sending id_token on every request leaks identity claims and ties your session lifetime to the IdP's token expiry."
      }
    ],

    related: ["7.1.02", "7.1.05", "7.1.07", "4.4.01"],

    has_diagram: true,
    diagram: `OAuth2 vs OIDC — what each token carries

    ┌──────────────────────────────────────────────────┐
    │  OAuth2 only                                     │
    │  ─────────                                       │
    │  Client → IdP:  "user approved, give me token"   │
    │  IdP → Client:  access_token (opaque/JWT)        │
    │                 ↓                                │
    │              "scope: drive.read, exp: 1h"        │
    │              (says nothing about WHO)            │
    └──────────────────────────────────────────────────┘

    ┌──────────────────────────────────────────────────┐
    │  OIDC = OAuth2 + identity layer                  │
    │  ──────────────────────────────                  │
    │  Client → IdP:  "...and scope=openid"            │
    │  IdP → Client:  access_token  +  id_token (JWT)  │
    │                                  ↓               │
    │                       { sub, iss, aud,           │
    │                         email, name, exp,        │
    │                         nonce }                  │
    │                       (proves WHO the user is)   │
    └──────────────────────────────────────────────────┘`,

    has_code: false,

    tags: ["oauth2", "oidc", "authentication", "authorization", "jwt", "identity"]
  },

  // ---------- 7.1.02 ----------
  {
    id: "7.1.02",
    section: 7,
    subsection: "7.1",
    level: "intermediate",

    question: "Walk through the Authorization Code + PKCE flow end to end. What attack does PKCE prevent?",

    quick_answer: "→ Client generates code_verifier (random) and code_challenge = SHA256(verifier)\n→ Browser → IdP /authorize with code_challenge → user logs in\n→ IdP redirects back with one-time auth code\n→ Client exchanges code + ORIGINAL verifier at /token → gets tokens\n→ Prevents authorization code interception attacks (esp. mobile/SPA)",

    detailed_answer: "Authorization Code is the most secure OAuth2/OIDC flow because tokens never travel through the browser URL. Instead, the IdP sends back a short-lived authorization code, which the client then exchanges at the /token endpoint over a back-channel (or fetch from SPA) for the actual tokens.\n\nThe original Authorization Code flow assumed the client could keep a client_secret — true for backend web apps, false for SPAs and mobile apps. A malicious app on the user's device could register the same custom URL scheme, intercept the redirect with the auth code, and exchange it for tokens. PKCE (Proof Key for Code Exchange, RFC 7636) closes this hole.\n\nPKCE flow: (1) Client generates a high-entropy random string code_verifier (43-128 chars). (2) Computes code_challenge = BASE64URL(SHA256(code_verifier)). (3) Sends code_challenge + code_challenge_method=S256 with the /authorize request. (4) IdP stores the challenge against the auth code. (5) When client exchanges the code at /token, it sends the original code_verifier. (6) IdP recomputes SHA256(verifier), compares to stored challenge — if mismatch, rejects.\n\nThis means even if an attacker intercepts the auth code, they cannot exchange it without the verifier — which never left the originating client. PKCE is now mandatory for SPAs and mobile, and recommended for ALL clients per OAuth 2.1.\n\nTrade-off: PKCE adds one cryptographic operation per login but eliminates the need for a client_secret in public clients. The 'cost' is negligible; the security gain is substantial.",

    key_points: [
      "Authorization Code = redirect with code, then back-channel token exchange",
      "Original flow needed client_secret — impossible to keep in SPA/mobile",
      "PKCE replaces secret with per-request proof: verifier (kept) + challenge (sent)",
      "code_challenge_method=S256 (SHA256) — never use 'plain' in production",
      "Auth code is single-use and short-lived (typically 30-60 seconds)",
      "OAuth 2.1 makes PKCE mandatory for ALL clients, not just public ones",
      "state parameter (separate from PKCE) prevents CSRF on the redirect itself"
    ],

    hint: "If you intercept the URL redirect carrying the auth code, what extra piece of information would you still need to actually get the tokens?",

    common_trap: "Confusing the state parameter with PKCE. state prevents CSRF (binding the response to the originating session); PKCE prevents code interception. Both are needed — they solve different attacks. Also: never store code_verifier in localStorage long-term; it lives only for the duration of the auth dance.",

    follow_up_questions: [
      {
        text: "Where do you store tokens in a browser SPA? Cookies vs localStorage trade-offs.",
        type: "inline",
        mini_answer: "Neither is perfect. localStorage is vulnerable to XSS — any injected script reads the token. httpOnly cookies are immune to XSS read but vulnerable to CSRF unless you use SameSite=Strict/Lax + CSRF tokens. Best practice today: backend-for-frontend (BFF) pattern — the SPA holds NO tokens, the BFF holds them server-side and exchanges them via a session cookie. This is why BFF (4.4.01) is now the recommended OAuth pattern for SPAs."
      },
      {
        text: "How do you handle token refresh in a long-lived SPA session?",
        type: "inline",
        mini_answer: "Use refresh token rotation: every refresh issues a NEW refresh token and invalidates the old one. If an attacker steals a refresh token and uses it, the legitimate client's next refresh fails — IdP detects reuse and revokes the entire token family. Combine with short access_token lifetime (5-15 min) and refresh_token absolute lifetime cap (e.g., 7 days)."
      },
      {
        text: "What's the difference between the state parameter and PKCE — both seem to prevent attacks?",
        type: "linked",
        links_to: "7.1.01"
      }
    ],

    related: ["7.1.01", "7.1.03", "7.1.07", "4.4.01"],

    has_diagram: true,
    diagram: `Authorization Code + PKCE — sequence

  Client (SPA)         Browser            IdP             Resource Server
      │                   │                │                     │
      │ 1. generate       │                │                     │
      │   verifier (rand) │                │                     │
      │   challenge =     │                │                     │
      │   SHA256(ver)     │                │                     │
      │                   │                │                     │
      │ 2. redirect ────► │                │                     │
      │   /authorize?     │                │                     │
      │   challenge=...   │                │                     │
      │   state=xyz       │                │                     │
      │                   │ 3. user login  │                     │
      │                   │ ◄──────────────►                     │
      │                   │                │                     │
      │                   │ 4. redirect    │                     │
      │                   │   ?code=ABC    │                     │
      │                   │   &state=xyz   │                     │
      │ ◄─────────────────┤                │                     │
      │                                    │                     │
      │ 5. POST /token  ──────────────────►│                     │
      │    code=ABC                        │                     │
      │    verifier=<original>             │                     │
      │                                    │ verify:             │
      │                                    │ SHA256(ver)==stored │
      │                                    │     challenge?      │
      │                                    │                     │
      │ 6. ◄────── access_token + id_token │                     │
      │            (+ refresh_token)       │                     │
      │                                                          │
      │ 7. GET /api  Authorization: Bearer access_token ────────►│
      │ 8. ◄──────────────────────────── 200 OK + data           │`,

    has_code: true,
    code_language: "javascript",
    code_snippet: `// PKCE code_verifier + code_challenge generation (browser SPA)

async function generatePKCE() {
  // 1. code_verifier: 43-128 chars, URL-safe random
  const array = new Uint8Array(32);
  crypto.getRandomValues(array);
  const verifier = base64UrlEncode(array);

  // 2. code_challenge = BASE64URL(SHA256(verifier))
  const encoder = new TextEncoder();
  const data = encoder.encode(verifier);
  const hash = await crypto.subtle.digest('SHA-256', data);
  const challenge = base64UrlEncode(new Uint8Array(hash));

  // Store verifier in sessionStorage (NOT localStorage — short-lived)
  sessionStorage.setItem('pkce_verifier', verifier);

  return { verifier, challenge };
}

function base64UrlEncode(bytes) {
  return btoa(String.fromCharCode(...bytes))
    .replace(/\\+/g, '-')
    .replace(/\\//g, '_')
    .replace(/=+$/, '');
}

// On login button click:
const { challenge } = await generatePKCE();
const params = new URLSearchParams({
  client_id: 'my-spa',
  redirect_uri: 'https://app.example.com/callback',
  response_type: 'code',
  scope: 'openid profile email',
  code_challenge: challenge,
  code_challenge_method: 'S256',
  state: crypto.randomUUID(),  // CSRF protection — separate from PKCE
});
window.location.href = \`https://idp.example.com/authorize?\${params}\`;

// On /callback handler — exchange code for tokens:
const verifier = sessionStorage.getItem('pkce_verifier');
const tokenResp = await fetch('https://idp.example.com/token', {
  method: 'POST',
  headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
  body: new URLSearchParams({
    grant_type: 'authorization_code',
    code: codeFromUrl,
    redirect_uri: 'https://app.example.com/callback',
    client_id: 'my-spa',
    code_verifier: verifier,   // proves we initiated the flow
  }),
});`,

    tags: ["oauth2", "pkce", "authorization-code", "spa-security", "mobile-security", "oidc"]
  },

  // ---------- 7.1.03 ----------
  {
    id: "7.1.03",
    section: 7,
    subsection: "7.1",
    level: "intermediate",

    question: "When would you use OAuth2 Client Credentials flow instead of Authorization Code? What are the security implications?",

    quick_answer: "→ Client Credentials = machine-to-machine; no user involved\n→ Service A authenticates AS ITSELF to call Service B\n→ Uses client_id + client_secret (or mTLS / signed JWT assertion)\n→ NEVER use for user-facing flows — there's no user identity in the token\n→ Scope tokens narrowly; rotate secrets; prefer mTLS or workload identity",

    detailed_answer: "Client Credentials is OAuth2's flow for service-to-service (M2M) authentication where no human is in the loop. The client (a backend service) presents its own credentials directly to the IdP's /token endpoint and receives an access_token representing ITSELF — not a user.\n\nClassic use cases: a payments microservice calling a fraud-detection service, a nightly batch job pulling data from an internal API, a CI/CD pipeline deploying to a cloud provider. The token's 'sub' claim identifies the calling service, not a person.\n\nThe security model is fundamentally different from user flows. With user flows, compromise of the client gets you one user's tokens. With Client Credentials, compromise of client_secret gets you everything that service is authorized to do — often broad, machine-level scopes. So:\n\n(1) Scope tokens narrowly — 'read:invoices' not 'admin'. Apply least-privilege ruthlessly. (2) Rotate client_secret regularly; ideally use short-lived secrets via a secrets manager (Vault, AWS Secrets Manager). (3) Prefer mTLS client authentication over client_secret — the certificate is harder to exfiltrate than a string. (4) In Kubernetes, prefer workload identity (SPIFFE/SPIRE, AWS IRSA, GKE Workload Identity) — no static secret at all; the platform attests to the workload's identity. (5) Audit token usage; alert on unusual scopes or geographic origins.\n\nAnti-pattern to call out: using Client Credentials to act 'on behalf of' a user (e.g., a backend job processing user data). The token has no user context, so you lose all per-user audit trail and authorization checks. For 'on-behalf-of' patterns, use Token Exchange (RFC 8693) or Service Account impersonation with explicit user context propagation.",

    key_points: [
      "Use only for machine-to-machine — no user, no consent, no browser",
      "Token represents the service itself; sub claim = service identity",
      "client_secret is high-value: one secret = full service privileges",
      "Prefer mTLS or signed JWT assertion (private_key_jwt) over shared secret",
      "In K8s/cloud — use workload identity (IRSA, Workload Identity, SPIFFE)",
      "NEVER use to act on behalf of a user — use Token Exchange instead"
    ],

    hint: "If a backend cron job needs to call an internal API, who is the 'user' that authorizes the request — and does that question even make sense?",

    common_trap: "Embedding the client_secret in source code or container images. Even private repos leak — and images are pulled by anyone with registry access. Always inject secrets at runtime via env vars from a secrets manager, or eliminate the secret entirely with workload identity.",

    follow_up_questions: [
      {
        text: "How would you rotate a client_secret with zero downtime?",
        type: "inline",
        mini_answer: "Most IdPs (Auth0, Okta, Keycloak) support multiple active secrets per client. Process: (1) Generate secret_v2 alongside secret_v1. (2) Deploy services with secret_v2 — gradually. (3) Once all instances rotated, revoke secret_v1. (4) Monitor for any leftover usage of v1 before final revocation. This is the same pattern as JWT signing key rotation — overlap windows prevent outages."
      },
      {
        text: "What's the difference between Client Credentials and an API key?",
        type: "inline",
        mini_answer: "API keys are static, long-lived bearer tokens with no standard format or expiry. Client Credentials produces short-lived OAuth access tokens (typically 1 hour) with standard scopes, JWT validation, and revocation via /introspect. API keys are simpler but harder to rotate, scope, or audit. For internal M2M, Client Credentials is the better default."
      },
      {
        text: "How does mTLS-based client authentication compare to client_secret?",
        type: "linked",
        links_to: "7.1.07"
      }
    ],

    related: ["7.1.01", "7.1.02", "7.1.07", "7.5.01"],

    has_diagram: true,
    diagram: `Client Credentials — M2M flow (no user)

  Service A (client)              IdP                  Service B (resource)
      │                            │                          │
      │ 1. POST /token             │                          │
      │    grant_type=             │                          │
      │      client_credentials    │                          │
      │    client_id=service-a     │                          │
      │    client_secret=***       │                          │
      │    scope=read:invoices     │                          │
      │ ─────────────────────────► │                          │
      │                            │                          │
      │                       verify creds                    │
      │                       check scopes                    │
      │                            │                          │
      │ 2. ◄──── access_token      │                          │
      │     {                      │                          │
      │       sub: "service-a",    │                          │
      │       scope: "read:inv",   │                          │
      │       exp: now + 1h        │                          │
      │     }                      │                          │
      │                            │                          │
      │ 3. GET /api/invoices                                  │
      │    Authorization: Bearer <access_token>               │
      │ ──────────────────────────────────────────────────►   │
      │                                                       │
      │                                              validate JWT
      │                                              check scope
      │                                                       │
      │ 4. ◄──────────────────────────────── 200 OK + data    │

  No user, no browser, no consent screen, no PKCE.
  All security rests on protecting client_secret (or mTLS cert).`,

    has_code: true,
    code_language: "java",
    code_snippet: `// Spring Boot — Client Credentials with private_key_jwt assertion
// (preferred over shared client_secret for production M2M)

@Configuration
public class M2MTokenClient {

    @Bean
    public OAuth2AuthorizedClientManager authorizedClientManager(
            ClientRegistrationRepository clientRegistrationRepository,
            OAuth2AuthorizedClientRepository authorizedClientRepository) {

        OAuth2AuthorizedClientProvider provider =
            OAuth2AuthorizedClientProviderBuilder.builder()
                .clientCredentials()
                .build();

        DefaultOAuth2AuthorizedClientManager manager =
            new DefaultOAuth2AuthorizedClientManager(
                clientRegistrationRepository, authorizedClientRepository);
        manager.setAuthorizedClientProvider(provider);
        return manager;
    }

    @Bean
    public WebClient webClient(OAuth2AuthorizedClientManager manager) {
        ServletOAuth2AuthorizedClientExchangeFilterFunction filter =
            new ServletOAuth2AuthorizedClientExchangeFilterFunction(manager);
        filter.setDefaultClientRegistrationId("invoice-service");
        return WebClient.builder().apply(filter.oauth2Configuration()).build();
    }
}

// application.yml — note: NO client_secret in source control
// Pulled from Vault / AWS Secrets Manager at startup
spring:
  security:
    oauth2:
      client:
        registration:
          invoice-service:
            client-id: payments-service
            authorization-grant-type: client_credentials
            scope: read:invoices,write:invoices
            client-authentication-method: private_key_jwt  # NOT client_secret_basic
        provider:
          invoice-service:
            token-uri: \${IDP_TOKEN_URI}
            jwk-set-uri: \${IDP_JWKS_URI}

// Usage — token is auto-fetched, cached, and refreshed
@Service
public class InvoiceClient {
    private final WebClient webClient;

    public Mono<Invoice> fetchInvoice(String id) {
        return webClient.get()
            .uri("/api/invoices/{id}", id)
            .retrieve()
            .bodyToMono(Invoice.class);
        // OAuth2 filter injects Bearer token automatically
    }
}`,

    tags: ["oauth2", "client-credentials", "m2m", "service-to-service", "mtls", "workload-identity"]
  },

  // ---------- 7.1.04 ----------
  {
    id: "7.1.04",
    section: 7,
    subsection: "7.1",
    level: "intermediate",

    question: "RBAC vs ABAC — when does each win, and how would you decide for a new system?",

    quick_answer: "→ RBAC: permissions tied to ROLES (admin, editor, viewer)\n→ ABAC: permissions evaluated from ATTRIBUTES (user, resource, action, context)\n→ RBAC wins when org structure is flat and predictable\n→ ABAC wins for fine-grained, context-aware (time, location, ownership) rules\n→ Hybrid is the real-world answer: RBAC for coarse, ABAC for fine",

    detailed_answer: "RBAC (Role-Based Access Control) groups permissions into roles and assigns roles to users. The check is simple: 'does this user have the editor role?' It's easy to reason about, easy to audit, and easy to administer at small-to-medium scale. The classic failure mode is role explosion: as you add resource types, regions, customer segments, you end up with roles like 'editor-eu-tier2-finance-readonly' and the role catalog becomes unmanageable.\n\nABAC (Attribute-Based Access Control) evaluates a policy at request time over four attribute sets: subject (who), resource (what), action (verb), environment (when/where). The check becomes: 'allow if user.department == resource.owner_department AND time IS business_hours AND request.ip IN trusted_range.' It's expressive, but harder to audit and harder to reason about — 'why was this denied?' requires replaying the policy.\n\nDecision framework I use: Start with RBAC if your authorization model is mostly 'who you are' (org chart). Add ABAC when you hit any of: (1) resource-level rules ('users can only edit their own documents'), (2) context-sensitive rules ('no production access outside business hours'), (3) multi-tenant isolation ('users can only see data in their tenant'), (4) compliance requirements that need policy-as-code (HIPAA, SOC2).\n\nReal-world systems are almost always hybrid. RBAC handles 'is this person an engineer or a manager,' ABAC handles 'is this engineer on the team that owns this service.' Tools like Open Policy Agent (OPA) let you write ABAC policies in Rego while still expressing role checks. Cedar (AWS) is a newer option built specifically for ABAC + RBAC hybrids.\n\nTrade-off to articulate: ABAC's flexibility costs you debuggability and admin overhead. Every ABAC system needs a policy decision log ('this request was allowed because rule 47 matched') or you'll be drowning in support tickets.",

    key_points: [
      "RBAC: user → role → permissions; simple, auditable, role-explosion at scale",
      "ABAC: policy(subject, resource, action, env) → allow/deny; expressive, harder to debug",
      "ReBAC (relationship-based, Google Zanzibar) is a third model — great for social/sharing apps",
      "Hybrid is the norm: RBAC for org-level, ABAC for resource/context-level",
      "OPA (Rego) and Cedar are the standard policy engines in 2025",
      "Always log policy decisions with the rule that fired — for audit and debugging"
    ],

    hint: "If your product manager says 'editors can only modify documents in their own department, and only between 9am and 5pm,' which model handles each clause?",

    common_trap: "Picking ABAC because it's 'more powerful' without building the audit/debug tooling. An ABAC system without decision logging is a black box — users will rage when access is denied and no one can explain why. Build the policy debugger BEFORE the policy library grows.",

    follow_up_questions: [
      {
        text: "How does Google's Zanzibar model (ReBAC) differ from RBAC and ABAC?",
        type: "inline",
        mini_answer: "Zanzibar models permissions as relationships between objects: (user:alice, editor, document:42). Checks become graph traversals: 'is there a path from alice to document:42 with editor permission?' This handles inheritance and sharing naturally (folder→file, group→member) which RBAC fakes badly and ABAC expresses awkwardly. SpiceDB and OpenFGA are open-source Zanzibar implementations. Best fit: collaboration tools, social platforms, hierarchical resources."
      },
      {
        text: "How would you implement ABAC with Open Policy Agent (OPA) in a microservices architecture?",
        type: "inline",
        mini_answer: "Two patterns: (1) Sidecar — OPA runs as a sidecar container, services call localhost:8181/v1/data/authz. Sub-millisecond latency, policy bundle pulled from central registry. (2) Library — embed OPA as a Go/WASM library directly in the service. Faster, but couples policy version to service version. For most cases, sidecar wins because policy can be updated independently. Centralize policy in Git, push bundles via OPA bundle API, log every decision to a SIEM."
      },
      {
        text: "How do you handle authorization in a multi-tenant SaaS — tenant isolation specifically?",
        type: "inline",
        mini_answer: "Tenant ID must be a first-class authorization attribute, never just a query filter. Patterns: (1) Inject tenant_id into every JWT claim at login. (2) Every authorization check includes tenant_id == resource.tenant_id as a mandatory predicate. (3) Database row-level security as defense-in-depth (Postgres RLS). (4) Separate schemas/databases per tenant for high-isolation tiers. The risk you're guarding against is the cross-tenant data leak — the worst class of multi-tenant bug."
      }
    ],

    related: ["7.1.01", "7.1.06", "7.7.01"],

    has_diagram: true,
    diagram: `RBAC vs ABAC — same question, two models

  Question: "Can Alice edit document 42?"

  ┌─────────────────────────────────────────────────┐
  │  RBAC                                           │
  │  ────                                           │
  │   alice ──has role──► editor                    │
  │   editor ──has perm──► document:edit            │
  │                                                 │
  │   Check: does alice have document:edit ?  YES   │
  │   (no notion of WHICH document — global perm)   │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │  ABAC                                           │
  │  ────                                           │
  │   subject  = { id: alice, dept: eng, role: ed } │
  │   resource = { id: 42, owner_dept: eng,         │
  │                classification: internal }       │
  │   action   = "edit"                             │
  │   env      = { time: 14:30, ip: 10.0.1.5 }      │
  │                                                 │
  │   Policy:                                       │
  │     allow if                                    │
  │       subject.role == "editor" AND              │
  │       subject.dept == resource.owner_dept AND   │
  │       env.time IN business_hours                │
  │                                                 │
  │   Check: → ALLOW (all clauses match)            │
  └─────────────────────────────────────────────────┘

  ┌─────────────────────────────────────────────────┐
  │  Hybrid (real world)                            │
  │  ───────────────────                            │
  │   RBAC:  is alice an "editor"?     (role check) │
  │   ABAC:  does alice's dept match    (rule)      │
  │          document 42's dept?                    │
  │                                                 │
  │   Decision = role check AND policy check        │
  └─────────────────────────────────────────────────┘`,

    has_code: true,
    code_language: "rego",
    code_snippet: `# Open Policy Agent (Rego) — hybrid RBAC + ABAC policy
# Evaluated per-request via OPA sidecar at sub-ms latency

package authz

import future.keywords.if
import future.keywords.in

# Default deny — explicit allow only
default allow := false

# Rule 1: Admins can do anything (pure RBAC)
allow if {
    "admin" in input.user.roles
}

# Rule 2: Editors can edit documents in their own department
#         during business hours (RBAC + ABAC hybrid)
allow if {
    input.action == "edit"
    input.resource.type == "document"
    "editor" in input.user.roles                    # RBAC clause
    input.user.department == input.resource.owner_department  # ABAC
    business_hours                                   # ABAC env
}

# Rule 3: Anyone can read public documents
allow if {
    input.action == "read"
    input.resource.type == "document"
    input.resource.classification == "public"
}

# Rule 4: Document owners can always read/edit/delete their own
allow if {
    input.action in ["read", "edit", "delete"]
    input.resource.owner_id == input.user.id
}

# Helper — business hours check
business_hours if {
    hour := time.clock(time.now_ns())[0]
    hour >= 9
    hour < 17
}

# Decision log — fired on every check (critical for debugging)
decision := {
    "allow": allow,
    "user": input.user.id,
    "action": input.action,
    "resource": input.resource.id,
    "matched_rules": matched,
} if {
    matched := [r | allow with input as input; r := "see policy trace"]
}

# Example input the service sends:
# {
#   "user":     { "id": "alice", "roles": ["editor"], "department": "eng" },
#   "action":   "edit",
#   "resource": { "id": "42", "type": "document",
#                 "owner_department": "eng", "owner_id": "bob" }
# }`,

    tags: ["rbac", "abac", "authorization", "opa", "rego", "policy-as-code", "multi-tenant"]
  },

  // ---------- 7.1.05 ----------
  {
    id: "7.1.05",
    section: 7,
    subsection: "7.1",
    level: "intermediate",

    question: "SAML vs OIDC for enterprise SSO — when do you still pick SAML in 2025?",

    quick_answer: "→ Both solve enterprise SSO; both delegate auth to an IdP\n→ SAML = XML, browser POST bindings, mature in enterprise (15+ years)\n→ OIDC = JSON/JWT, REST-friendly, works on mobile and SPAs\n→ Pick OIDC for new builds; SAML when integrating with legacy enterprise IdPs\n→ Reality: enterprise B2B sales force you to support BOTH",

    detailed_answer: "SAML 2.0 was the enterprise SSO standard from the mid-2000s. It's XML-based, uses browser POST bindings to shuttle signed assertions between IdP and SP, and is deeply embedded in legacy identity stacks (ADFS, PingFederate, older Okta deployments, Shibboleth in higher ed). It works well, but the developer experience is painful: XML signature validation, canonicalization bugs, no native mobile/SPA story.\n\nOIDC was designed to fix all of that. JSON instead of XML, JWTs instead of signed XML assertions, REST endpoints instead of SOAP-style bindings, and first-class support for mobile and SPA flows via PKCE. For a greenfield system in 2025, OIDC is the obvious choice.\n\nThe catch is enterprise B2B sales. Large customers run on SAML — their IT department has standardized on it, their compliance team understands it, and they will require it in the contract. If you're building B2B SaaS, you almost always end up supporting BOTH: OIDC for your modern customers and your own consumer flows, SAML for enterprise SSO via vendors like Auth0, WorkOS, or BoxyHQ that abstract the SAML pain.\n\nTechnical trade-offs to articulate: (1) Token format — SAML assertions can be much larger (multi-KB XML) and don't fit in headers easily; JWTs are compact. (2) Mobile/SPA — SAML's redirect-POST dance breaks badly outside browsers; OIDC has PKCE. (3) Tooling — JWT debuggers, libraries, and observability are everywhere; SAML tooling is sparse and dated. (4) Standards momentum — almost no new investment in SAML; all RFC activity is on OIDC and OAuth 2.1.\n\nWhen SAML genuinely wins: integrating with a customer's existing IdP that only speaks SAML, federation with academic institutions (Shibboleth), or government systems where SAML is mandated. In those cases, treat SAML as a 'protocol gateway' problem — use a vendor or a dedicated service to handle SAML, then issue your own internal OIDC tokens downstream.",

    key_points: [
      "SAML: XML, mature, enterprise-entrenched, painful for mobile/SPA",
      "OIDC: JSON/JWT, REST-native, modern flows (PKCE, refresh rotation)",
      "B2B reality: support both — SAML for enterprise SSO, OIDC for everything else",
      "Use a SAML-to-OIDC bridge (WorkOS, Auth0, BoxyHQ) to avoid in-house SAML",
      "Internal services should always speak OIDC; SAML stays at the perimeter",
      "SAML signature validation has a long history of CVEs — vendor it, don't DIY"
    ],

    hint: "If your largest enterprise prospect has a 10-year-old Active Directory Federation Services deployment, what protocol is their IdP fluent in — and what's that going to cost you architecturally?",

    common_trap: "Rolling your own SAML implementation. SAML XML signature validation has a notorious history of bugs — XML signature wrapping attacks, canonicalization mismatches, comment-injection bypasses. Use a battle-tested library (passport-saml, Spring Security SAML2) or, better, a vendor that handles SAML so you only consume OIDC internally.",

    follow_up_questions: [
      {
        text: "How do you handle 'JIT (just-in-time) user provisioning' from SAML/OIDC — and what about deprovisioning?",
        type: "inline",
        mini_answer: "JIT provisioning: on first SSO login, create the local user record from IdP claims (email, name, groups). Easy. Deprovisioning is harder — when the IdP deactivates a user, your app may not know. Solutions: (1) SCIM 2.0 — IdP pushes user lifecycle events to your /scim endpoints. (2) Short token TTL — when the user can't refresh, they're effectively locked out within minutes. (3) Periodic reconciliation against the IdP's user directory. SCIM is the right answer for enterprise; combine with short tokens for defense-in-depth."
      },
      {
        text: "What's IdP-initiated vs SP-initiated SSO, and which is more secure?",
        type: "inline",
        mini_answer: "SP-initiated: user starts at your app, gets redirected to IdP, comes back. IdP-initiated: user starts at the IdP portal (Okta dashboard), clicks your app, lands on a SAML response with no prior request. IdP-initiated is less secure — there's no RelayState binding, so it's vulnerable to login CSRF (attacker tricks user into logging in as a different identity). Modern guidance: prefer SP-initiated; if you must support IdP-initiated, validate audience strictly and use a landing page that re-confirms intent."
      },
      {
        text: "Walk me through a federation setup where you trust an external IdP.",
        type: "linked",
        links_to: "7.1.08"
      }
    ],

    related: ["7.1.01", "7.1.06", "7.1.08"],

    has_diagram: true,
    diagram: `SAML vs OIDC — the same SSO, two protocols

  ┌──────────────────────── SAML 2.0 ────────────────────────┐
  │                                                          │
  │  Browser ──GET──► SP ──redirect──► IdP                   │
  │                                     │                    │
  │                                  user logs in            │
  │                                     │                    │
  │  Browser ◄──POST── IdP                                   │
  │     │   <SAMLResponse>                                   │
  │     │     <Assertion signed=...>                         │
  │     │       <Subject>alice@corp</Subject>                │
  │     │       <AttributeStatement>                         │
  │     │         <Attr name="role">editor</Attr>            │
  │     │       </AttributeStatement>                        │
  │     │     </Assertion>                                   │
  │     │   </SAMLResponse>                                  │
  │     │   (XML, signed, base64 in form POST)               │
  │     ▼                                                    │
  │   SP validates XML signature, creates session            │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  ┌──────────────────────── OIDC ────────────────────────────┐
  │                                                          │
  │  Browser ──GET──► RP ──redirect──► IdP /authorize        │
  │                                     │                    │
  │                                  user logs in            │
  │                                     │                    │
  │  Browser ◄──redirect── IdP                               │
  │     ?code=ABC&state=xyz                                  │
  │     │                                                    │
  │     ▼                                                    │
  │   RP ──POST /token──► IdP                                │
  │   RP ◄────────────── { id_token, access_token }          │
  │                                                          │
  │   id_token (JWT, signed):                                │
  │     { sub: "alice", iss: "...", aud: "rp",               │
  │       email: "alice@corp", roles: ["editor"], exp: ... } │
  │                                                          │
  │   RP validates JWT signature (JWKS), creates session     │
  │                                                          │
  └──────────────────────────────────────────────────────────┘

  Same outcome. Different decade. JSON vs XML.`,

    has_code: false,

    tags: ["saml", "oidc", "sso", "enterprise", "federation", "scim"]
  },

  // ---------- 7.1.06 ----------
  {
    id: "7.1.06",
    section: 7,
    subsection: "7.1",
    level: "advanced",

    question: "Design SSO for a multi-product enterprise platform. How do you handle session, logout, and per-product authorization?",

    quick_answer: "→ Central IdP issues id_token + access_token; each product is an OIDC RP\n→ Session lives at the IdP (SSO session) AND at each product (app session)\n→ Single Sign-On = one IdP login → seamless entry to all products\n→ Single Logout (SLO) = hard problem; back-channel logout (RFC 8414) > front-channel\n→ Authorization stays per-product; IdP issues identity, products own permissions",

    detailed_answer: "SSO at the platform level has three architectural layers that must be designed independently: identity (who is the user), session (how long do they stay logged in), and authorization (what can they do in product X).\n\nIdentity: A single IdP — could be your own (Keycloak, Cognito) or an external one (Okta, Azure AD) — is the source of truth. Every product is registered as an OIDC Relying Party. On first login to ANY product, the user authenticates at the IdP; subsequent product visits within the SSO session window get a silent token issuance (no re-auth prompt) because the IdP cookie is already present.\n\nSession: There are now TWO sessions to reason about. (1) The IdP session — a cookie at the IdP domain that says 'this browser has an authenticated user.' This drives the SSO experience. (2) The application session — typically a short-lived JWT or session cookie at each product, refreshed periodically. The SSO session is usually long (hours to days); the app session is shorter (minutes to an hour). Misaligning these creates strange UX: user logs out of one product but is silently logged back in by the IdP cookie.\n\nLogout is genuinely hard. 'Single Logout' has two flavors: (a) Front-channel logout — IdP redirects the browser through every RP's logout URL via hidden iframes. Fragile (third-party cookie blocking, iframe failures), often partial. (b) Back-channel logout (OIDC Back-Channel Logout spec) — IdP POSTs a signed logout token directly to each RP's back-channel endpoint, server-to-server. Reliable, but requires every RP to implement the endpoint and maintain a session→sid mapping. Modern guidance: implement back-channel; use front-channel only as a fallback for legacy RPs.\n\nAuthorization: Critically, the IdP issues identity, NOT product permissions. Each product owns its own authorization model — RBAC, ABAC, or hybrid (see 7.1.04). The IdP token might carry coarse claims (department, employee_level) that products use as INPUTS to their own authorization decisions, but the authoritative permission check happens at each product. This separation lets products evolve independently and avoids the IdP becoming a permissions monolith.\n\nReal-world failure mode to flag: tenants and SSO interaction. In B2B platforms, the user's tenant identity often comes from the IdP (especially with SAML). Get this wrong and you have cross-tenant data leaks. Always validate: token's tenant claim == resource's tenant — at every authorization check, no exceptions.",

    key_points: [
      "Three layers: identity (IdP), session (dual — IdP + app), authorization (per product)",
      "SSO session at IdP drives silent re-authentication across products",
      "App sessions should be SHORTER than SSO session for security/UX balance",
      "Back-channel logout (OIDC) > front-channel — third-party cookie death killed iframes",
      "Each product owns its authorization model; IdP issues identity claims as inputs",
      "Tenant claim from IdP is mandatory in every authz check for B2B platforms",
      "Plan for SCIM provisioning AND deprovisioning from day one"
    ],

    hint: "If a user logs out of product A, what should happen to their session in product B — and how does the IdP even know products A and B exist for this user?",

    common_trap: "Trying to centralize authorization decisions at the IdP. It seems clean — one place for all permissions — but couples every product release to the IdP team, and bloats tokens with permissions for products the user isn't currently using. Keep IdP for identity; let each product own its policy engine.",

    follow_up_questions: [
      {
        text: "How would you handle session timeouts differently for an admin product vs a customer-facing product on the same SSO?",
        type: "inline",
        mini_answer: "Per-RP session config. The admin product registers with stricter parameters: max_age=900 (force re-auth after 15 min), prompt=login on sensitive operations (step-up auth), shorter app session, and back-channel logout subscription. Customer product: long session, refresh tokens, no prompt. The IdP serves both from the same SSO session but enforces RP-specific policies. Step-up auth is the key concept — re-prompting for credentials before high-risk actions even within an active session."
      },
      {
        text: "How do refresh tokens interact with SSO logout?",
        type: "inline",
        mini_answer: "Refresh tokens are independent of the IdP session by default — that's the whole point. So even after SSO logout, an attacker with the refresh token can keep getting new access tokens. Mitigations: (1) Bind refresh tokens to the SSO session sid claim; revoke on back-channel logout. (2) Use refresh token rotation with reuse detection. (3) Maintain a server-side revocation list (Redis) checked on every refresh. (4) Cap refresh_token absolute lifetime regardless of activity."
      },
      {
        text: "How does this design change for federated identity from external IdPs?",
        type: "linked",
        links_to: "7.1.08"
      }
    ],

    related: ["7.1.01", "7.1.04", "7.1.05", "7.1.08"],

    has_diagram: true,
    diagram: `Multi-Product SSO Architecture

  ┌──────────────────────────────────────────────────────────────┐
  │                         IdP (central)                        │
  │   ┌─────────────────────────────────────────────────────┐    │
  │   │  SSO session cookie (idp.company.com)               │    │
  │   │  • user: alice                                      │    │
  │   │  • sid: session-abc123                              │    │
  │   │  • rps_logged_into: [product-a, product-b]          │    │
  │   └─────────────────────────────────────────────────────┘    │
  │                                                              │
  │   Issues: id_token, access_token, refresh_token              │
  │   Endpoints: /authorize  /token  /userinfo                   │
  │             /backchannel_logout  /jwks                       │
  └────────┬────────────────┬────────────────┬───────────────────┘
           │                │                │
           │ OIDC           │ OIDC           │ OIDC
           │                │                │
   ┌───────▼──────┐  ┌──────▼───────┐  ┌─────▼────────┐
   │  Product A   │  │  Product B   │  │  Product C   │
   │  (Analytics) │  │  (Admin)     │  │  (Reports)   │
   │              │  │              │  │              │
   │  App session │  │  App session │  │  App session │
   │  60 min      │  │  15 min      │  │  60 min      │
   │              │  │  (sensitive) │  │              │
   │  Own RBAC    │  │  Own RBAC    │  │  Own ABAC    │
   │  policy      │  │  policy      │  │  policy      │
   │              │  │              │  │              │
   │  /backchan-  │  │  /backchan-  │  │  /backchan-  │
   │   nel-logout │  │   nel-logout │  │   nel-logout │
   └──────────────┘  └──────────────┘  └──────────────┘

  Logout flow (back-channel):
    User clicks logout in Product A
       → Product A clears local session
       → Product A POSTs to IdP /logout
       → IdP iterates rps_logged_into
       → IdP POSTs signed logout_token to each RP's
         /backchannel-logout endpoint (server-to-server)
       → Each RP invalidates session for matching sid

  Authorization stays local:
    Each product validates the JWT (signature + iss + aud + exp)
    then runs its own policy engine to decide allow/deny.
    IdP claims are inputs, not the verdict.`,

    has_code: true,
    code_language: "java",
    code_snippet: `// Spring Boot — Back-Channel Logout endpoint (OIDC RP side)
// Handles logout_token POSTed by IdP when user logs out elsewhere

@RestController
@RequestMapping("/oidc")
public class BackChannelLogoutController {

    private final SessionRegistry sessionRegistry;
    private final JwtDecoder logoutTokenDecoder;  // configured with IdP JWKS

    @PostMapping("/backchannel-logout")
    public ResponseEntity<Void> handleLogout(
            @RequestParam("logout_token") String logoutToken) {

        Jwt token;
        try {
            // 1. Validate signature, iss, aud, exp, iat
            token = logoutTokenDecoder.decode(logoutToken);
        } catch (JwtException e) {
            return ResponseEntity.badRequest().build();
        }

        // 2. Verify required claims per OIDC Back-Channel Logout spec
        Map<String, Object> events = token.getClaim("events");
        if (events == null ||
            !events.containsKey("http://schemas.openid.net/event/backchannel-logout")) {
            return ResponseEntity.badRequest().build();
        }

        // 3. Reject if 'nonce' is present (logout tokens MUST NOT have nonce)
        if (token.getClaim("nonce") != null) {
            return ResponseEntity.badRequest().build();
        }

        // 4. Identify the session(s) to invalidate
        String sid = token.getClaim("sid");        // session ID from IdP
        String sub = token.getSubject();           // user subject

        // Map sid → app sessions (we stored this mapping at login time)
        List<String> appSessions = sessionRegistry.findBySid(sid);
        if (appSessions.isEmpty() && sub != null) {
            // Fallback: log out all sessions for this user
            appSessions = sessionRegistry.findBySubject(sub);
        }

        // 5. Invalidate sessions + revoke any refresh tokens
        appSessions.forEach(sessionId -> {
            sessionRegistry.invalidate(sessionId);
            refreshTokenStore.revokeBySession(sessionId);
        });

        // 6. Return 200 quickly — IdP fires logout to many RPs in parallel
        return ResponseEntity.ok().build();
    }
}

// At LOGIN time, we MUST persist the sid→session mapping:
//
//   Jwt idToken = ...
//   String sid = idToken.getClaim("sid");
//   sessionRegistry.register(httpSession.getId(), sid, idToken.getSubject());
//
// Without this mapping, back-channel logout has nothing to invalidate.`,

    tags: ["sso", "oidc", "back-channel-logout", "session-management", "step-up-auth", "enterprise-sso"]
  },

  // ---------- 7.1.07 ----------
  {
    id: "7.1.07",
    section: 7,
    subsection: "7.1",
    level: "advanced",

    question: "Token introspection vs JWT validation — when do you choose each, and what are the operational trade-offs?",

    quick_answer: "→ JWT validation = self-contained; verify signature + claims locally\n→ Introspection = call IdP /introspect endpoint to ask 'is this token still valid'\n→ JWT: fast, scalable, BUT cannot revoke before expiry\n→ Introspection: revocable, real-time, BUT IdP becomes hot path\n→ Hybrid: JWT for read paths, introspect for high-value writes",

    detailed_answer: "This is the core operational trade-off in token-based auth. JWT validation is purely local: the resource server fetches the IdP's public keys (JWKS) once, caches them, and validates every incoming token by verifying the signature and standard claims (iss, aud, exp, nbf). No network call per request. Throughput is limited only by your CPU.\n\nIntrospection (RFC 7662) is the opposite: every protected request triggers a call to the IdP's /introspect endpoint, passing the access token. The IdP returns { active: true/false, scope, sub, exp, ... }. The token can be opaque (a random string) or a JWT — introspection works either way. Crucially, the IdP can return active: false for tokens it has revoked, even if the token's signature is still valid and exp is in the future.\n\nThe trade-off is real and consequential. JWT scales beautifully — your API can do 100K req/s without touching the IdP — but you cannot revoke a token mid-life. If an access token leaks at 10:00 with exp=11:00, the attacker has it for the full hour. You can mitigate with short token TTL (5-15 min) + refresh tokens that ARE revocable. Introspection gives you instant revocation but turns the IdP into a critical hot-path dependency: if /introspect goes down, every protected API goes down. And introspection latency adds to every request.\n\nProduction patterns: (1) Pure JWT with short TTL — most APIs. (2) Pure introspection — high-value, low-volume APIs (admin, payments). (3) Hybrid — validate JWT locally for fast path, introspect for sensitive operations or when JWT carries a 'requires_introspection' flag. (4) JWT + revocation list — validate JWT locally, but check a Redis set of revoked jti claims. The Redis check is sub-ms and only the revoked set needs to be in memory.\n\nOperational concerns I'd raise: JWKS rotation needs overlap windows (publish new key, wait for clients to refresh JWKS cache, then start signing with new key). Cache JWKS aggressively (1 hour) but support cache invalidation on signature failures. For introspection, cache the introspection result for the token's remaining lifetime (or a short window like 30s) to amortize the cost.",

    key_points: [
      "JWT: stateless, fast, no revocation; introspection: stateful, revocable, IdP-dependent",
      "JWT signature verified via JWKS — cache aggressively (1 hour typical)",
      "Introspection turns IdP into a hard dependency on every request",
      "Hybrid: short JWT TTL + refresh rotation gives 'pseudo-revocation' in minutes",
      "JWT + Redis revocation list = best of both (check tiny revoked set, not all tokens)",
      "Cache introspection results to amortize cost (30s TTL or until token exp)",
      "JWKS key rotation needs overlap windows — publish new key BEFORE signing with it"
    ],

    hint: "If a user changes their password right now, what should happen to their currently-active sessions across 50 microservices — and how does each model handle that?",

    common_trap: "Choosing pure JWT and then realizing you have no way to log out a compromised account. By the time you discover the leak, the token has done its damage. Either go hybrid (revocation list) from day one, or set TTL so short (under 5 min) that the blast radius is acceptable.",

    follow_up_questions: [
      {
        text: "How do you handle JWT signing key rotation without breaking active sessions?",
        type: "inline",
        mini_answer: "JWKS endpoint returns ALL active keys (current + previous). Rotation: (1) Generate new key, add to JWKS as kid=v2, do NOT sign with it yet. (2) Wait for JWKS cache TTL across all RPs (e.g., 1 hour) — every RP now knows v2 exists. (3) Switch signing to v2. Tokens signed with v2 validate because RPs already have the key. Tokens signed with v1 still validate (v1 still in JWKS). (4) After v1 token max-age elapses, remove v1 from JWKS. The kid header in JWT lets the RP pick the right key from JWKS."
      },
      {
        text: "How does refresh token rotation interact with JWT revocation?",
        type: "inline",
        mini_answer: "Refresh tokens are typically opaque (not JWT) and stored server-side at the IdP — naturally revocable. Pattern: short JWT access token (5-15 min) + revocable refresh token. On 'logout', revoke the refresh token. The access token still works for up to 15 min, but no new ones can be minted. Combined with refresh token rotation + reuse detection, this gives you near-real-time revocation without per-request introspection."
      },
      {
        text: "When should the access token be opaque rather than JWT?",
        type: "inline",
        mini_answer: "When you want guaranteed revocation, when the audience is single (only one RS will see it, so no benefit to self-contained validation), when claims are sensitive (JWTs are inspected by anyone holding them — base64 != encryption), or when token size matters (opaque is small). Use JWE if you need encrypted self-contained tokens, but JWE adds enough operational complexity that opaque + introspection is often simpler."
      }
    ],

    related: ["7.1.01", "7.1.02", "7.1.03"],

    has_diagram: true,
    diagram: `JWT validation vs Introspection — request paths

  ┌─────────────────── JWT Validation (local) ───────────────────┐
  │                                                              │
  │  Client ──Bearer JWT──► Resource Server                      │
  │                              │                               │
  │                              ├─ verify signature             │
  │                              │  (JWKS cached, no network)    │
  │                              ├─ check exp, iss, aud          │
  │                              └─ allow/deny                   │
  │                                                              │
  │  Latency overhead: ~0.1ms (CPU only)                         │
  │  Revocation:       NO (until token expires)                  │
  │  IdP load:         only for JWKS refresh (hourly)            │
  └──────────────────────────────────────────────────────────────┘

  ┌─────────────────── Introspection (remote) ───────────────────┐
  │                                                              │
  │  Client ──Bearer token──► Resource Server                    │
  │                                │                             │
  │                                │ POST /introspect            │
  │                                ├──────────────────► IdP      │
  │                                │                    │        │
  │                                │  ◄─── { active,    │        │
  │                                │        scope,      │        │
  │                                │        sub, exp }  │        │
  │                                └─ allow/deny                 │
  │                                                              │
  │  Latency overhead: 5-50ms (network + IdP)                    │
  │  Revocation:       INSTANT                                   │
  │  IdP load:         every request (cache or die)              │
  └──────────────────────────────────────────────────────────────┘

  ┌─────────────── Hybrid: JWT + revocation list ────────────────┐
  │                                                              │
  │  Client ──Bearer JWT──► Resource Server                      │
  │                              │                               │
  │                              ├─ verify signature (local)     │
  │                              ├─ check exp, iss, aud          │
  │                              ├─ check Redis: jti revoked?    │
  │                              │  (sub-ms, in-memory set)      │
  │                              └─ allow/deny                   │
  │                                                              │
  │  Latency overhead: ~1ms                                      │
  │  Revocation:       seconds (on Redis set update)             │
  │  IdP load:         only for revocation events (rare)         │
  │  → Best balance for most production systems                  │
  └──────────────────────────────────────────────────────────────┘`,

    has_code: true,
    code_language: "java",
    code_snippet: `// Spring Boot — Hybrid: JWT validation + Redis revocation check

@Component
public class HybridJwtValidator implements OAuth2TokenValidator<Jwt> {

    private final RedisTemplate<String, String> redis;
    private static final String REVOKED_PREFIX = "revoked:jti:";

    @Override
    public OAuth2TokenValidatorResult validate(Jwt token) {
        // 1. Standard claims already validated by Spring's JwtDecoder
        //    (signature via JWKS, exp, nbf, iss, aud)

        // 2. Additional revocation check
        String jti = token.getId();  // 'jti' claim — JWT unique ID
        if (jti == null) {
            return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Missing jti claim", null));
        }

        // Redis SET membership check — sub-millisecond
        Boolean isRevoked = redis.hasKey(REVOKED_PREFIX + jti);

        if (Boolean.TRUE.equals(isRevoked)) {
            return OAuth2TokenValidatorResult.failure(
                new OAuth2Error("invalid_token", "Token revoked", null));
        }

        return OAuth2TokenValidatorResult.success();
    }
}

@Configuration
public class JwtConfig {

    @Bean
    public JwtDecoder jwtDecoder(
            @Value("\${idp.jwks-uri}") String jwksUri,
            HybridJwtValidator revocationValidator) {

        NimbusJwtDecoder decoder = NimbusJwtDecoder
            .withJwkSetUri(jwksUri)
            .cache(Duration.ofHours(1))   // JWKS cache — hourly refresh
            .build();

        // Combine default validators (signature/exp/iss) + our revocation check
        OAuth2TokenValidator<Jwt> combined = new DelegatingOAuth2TokenValidator<>(
            JwtValidators.createDefaultWithIssuer("https://idp.example.com"),
            new JwtTimestampValidator(Duration.ofSeconds(30)), // clock skew
            revocationValidator
        );
        decoder.setJwtValidator(combined);
        return decoder;
    }
}

// Revocation API — called when user logs out / changes password
@Service
public class TokenRevocationService {
    private final RedisTemplate<String, String> redis;

    public void revoke(Jwt token) {
        String jti = token.getId();
        long ttlSeconds = Duration.between(
            Instant.now(), token.getExpiresAt()).getSeconds();

        if (ttlSeconds > 0) {
            // TTL = remaining token life — auto-cleanup, no garbage collection
            redis.opsForValue().set(
                "revoked:jti:" + jti, "1", Duration.ofSeconds(ttlSeconds));
        }
    }
}`,

    tags: ["jwt", "introspection", "token-validation", "jwks", "revocation", "redis"]
  },

  // ---------- 7.1.08 ----------
  {
    id: "7.1.08",
    section: 7,
    subsection: "7.1",
    level: "advanced",

    question: "Design identity federation between your platform and external IdPs (customer's Okta, Azure AD). What are the security risks?",

    quick_answer: "→ Federation = your IdP trusts assertions from external IdPs (delegated trust)\n→ Two patterns: identity broker (your IdP federates) vs direct (each app federates)\n→ Trust chain: external IdP → your IdP → your apps; failure anywhere = blast radius\n→ Risks: claim spoofing, IdP compromise, stale deprovisioning, tenant confusion\n→ Always re-issue tokens at the broker; never pass external tokens downstream",

    detailed_answer: "Federation lets users authenticate with their own organization's IdP and access your platform without you owning their credentials. For B2B SaaS, this is table stakes — every enterprise customer wants their employees to sign in with their corporate Okta or Azure AD.\n\nIdentity broker pattern (recommended): You run a central IdP (Keycloak, Auth0, Cognito, or your own) that acts as the broker. External IdPs are configured as 'identity providers' in your broker. User flow: (1) user clicks 'Sign in with Acme Corp', (2) your broker redirects to Acme's IdP, (3) Acme authenticates and returns SAML/OIDC assertion, (4) your broker validates the assertion, maps external claims to your internal user model, (5) your broker issues YOUR OWN tokens to your applications. The downstream apps only ever see your broker — they don't know or care that Acme exists.\n\nDirect federation (avoid): each application talks to each external IdP. This couples every app to every customer's IdP config — operational nightmare at scale. Only acceptable if you have one product and a handful of customers.\n\nThe trust chain creates concentrated risk. The broker is now a critical security boundary: if it's compromised, every customer's identity is compromised. Hardening: (1) Validate every assertion strictly — issuer, audience, signature, expiry, NotBefore, NotOnOrAfter for SAML. (2) Pin acceptable signing algorithms (no 'none', no weak algorithms). (3) Map claims explicitly with an allowlist — never copy unknown claims into your tokens (claim injection). (4) Always include the source IdP in your internal tokens (e.g., 'idp_source: acme-okta') so downstream services can apply per-customer policy.\n\nTenant confusion is the most dangerous and most common bug. When user 'alice@acme.com' authenticates via Acme's IdP, she must be bound to Acme's tenant in your system — never anyone else's. The mapping must be deterministic: external IdP issuer → tenant ID, configured at IdP federation setup, never derived from user-supplied claims (an attacker controls their own claims). If you allow JIT user creation, validate that the email domain matches the federated IdP's allowed domains.\n\nDeprovisioning is the silent failure. When Acme fires Alice, their IdP knows immediately. Your broker doesn't, and your apps definitely don't. Mitigations: (1) SCIM provisioning — Acme's IdP pushes user lifecycle events to your broker. (2) Short token lifetime + reauth on refresh, so 'silent' revocation happens within minutes. (3) Periodic reconciliation. Without this, a fired employee may retain access for days.",

    key_points: [
      "Identity broker pattern centralizes federation; direct federation doesn't scale",
      "Always re-issue your own tokens at the broker — never propagate external tokens",
      "Map external claims explicitly via allowlist — never copy unknown claims",
      "Bind external IdP issuer → tenant ID at config time, NOT from runtime claims",
      "SCIM 2.0 for provisioning AND deprovisioning — don't only think about onboarding",
      "Per-IdP signing algorithm allowlist; reject 'none' and weak algorithms hard",
      "Audit trail must capture: external IdP, internal user, mapped claims, decision"
    ],

    hint: "If a customer's IdP gets compromised, what's the blast radius in your system — and what's the fastest way to contain it without taking down all federated tenants?",

    common_trap: "Trusting unmapped claims from external IdPs. If you copy 'roles' or 'groups' directly from the external assertion into your token, an external IdP admin (or attacker) can grant arbitrary privileges in your system by crafting claims. Always map through an explicit transformation rule per federation.",

    follow_up_questions: [
      {
        text: "How do you handle the 'just-in-time' user creation when an external user signs in for the first time?",
        type: "inline",
        mini_answer: "JIT provisioning: on first federation login, broker creates a local user record with claims mapped from the assertion. Validate: (1) email domain matches federated IdP's allowed domains (prevent cross-customer hijack). (2) tenant binding is from IdP config, not claims. (3) initial role is least-privilege (e.g., 'user', not 'admin') — let customer admins elevate via SCIM or in-app workflows. (4) audit log the JIT event prominently. Many breaches involve JIT giving accidental admin to attackers."
      },
      {
        text: "What's the difference between SP-initiated and IdP-initiated federation in this design?",
        type: "linked",
        links_to: "7.1.05"
      },
      {
        text: "How would you handle a customer's IdP being compromised — emergency response?",
        type: "inline",
        mini_answer: "Runbook: (1) Disable the federation in the broker — blocks all new logins from that IdP. (2) Revoke all active refresh tokens for users from that tenant. (3) Force re-auth for active sessions (back-channel logout to all RPs). (4) Audit recent activity for that tenant — privilege escalations, data exports. (5) Coordinate with customer to rotate IdP signing keys before re-enabling. The key design property: federation must be revocable per-customer in seconds, not hours."
      }
    ],

    related: ["7.1.01", "7.1.05", "7.1.06"],

    has_diagram: true,
    diagram: `Identity Broker Federation — multi-tenant B2B platform

  ┌────────────────┐  ┌────────────────┐  ┌────────────────┐
  │  Acme Corp     │  │  Globex Corp   │  │  Initech       │
  │  Okta          │  │  Azure AD      │  │  Google W'spc  │
  │  (SAML)        │  │  (OIDC)        │  │  (OIDC)        │
  └────────┬───────┘  └────────┬───────┘  └────────┬───────┘
           │                   │                   │
           │  External         │  assertions /     │
           │  identity         │  id_tokens        │
           │  assertions       │                   │
           ▼                   ▼                   ▼
  ┌──────────────────────────────────────────────────────────┐
  │                    YOUR IDENTITY BROKER                  │
  │  ────────────────────────────────────────────────        │
  │                                                          │
  │  Per-tenant federation config:                           │
  │   • acme-corp     → Okta SAML  → tenant_id: t-001        │
  │   • globex-corp   → Azure OIDC → tenant_id: t-002        │
  │   • initech       → Google OIDC → tenant_id: t-003       │
  │                                                          │
  │  For each incoming assertion:                            │
  │   1. Validate signature against IdP's published keys     │
  │   2. Verify issuer, audience, exp, NotBefore             │
  │   3. Map claims via per-IdP allowlist                    │
  │       external.email     → your.email                    │
  │       external.dept      → your.department               │
  │       external.groups    → your.roles (mapped)           │
  │   4. Bind to tenant from federation config (NOT claim)   │
  │   5. Issue YOUR tokens (id_token + access_token)         │
  │       claims include: idp_source, tenant_id              │
  │                                                          │
  └────────────────────────┬─────────────────────────────────┘
                           │
                           │ YOUR id_token + access_token
                           │ (downstream apps see only this)
                           │
       ┌───────────────────┼───────────────────┐
       │                   │                   │
       ▼                   ▼                   ▼
  ┌──────────┐        ┌──────────┐        ┌──────────┐
  │ Product  │        │ Product  │        │ Product  │
  │   A      │        │   B      │        │   C      │
  │          │        │          │        │          │
  │ Knows:   │        │ Knows:   │        │ Knows:   │
  │ tenant,  │        │ tenant,  │        │ tenant,  │
  │ user,    │        │ user,    │        │ user,    │
  │ roles    │        │ roles    │        │ roles    │
  │          │        │          │        │          │
  │ Doesn't  │        │ Doesn't  │        │ Doesn't  │
  │ know:    │        │ know:    │        │ know:    │
  │ which    │        │ which    │        │ which    │
  │ external │        │ external │        │ external │
  │ IdP      │        │ IdP      │        │ IdP      │
  └──────────┘        └──────────┘        └──────────┘`,

    has_code: true,
    code_language: "yaml",
    code_snippet: `# Identity broker federation config (Keycloak-style, simplified)
# One block per customer's external IdP

federations:
  - id: acme-corp-okta
    display_name: "Sign in with Acme Corp"
    type: saml2

    # CRITICAL: tenant binding from CONFIG, never from runtime claims
    tenant_id: t-001-acme

    # Trust establishment
    metadata_url: https://acme.okta.com/app/exk1abc/sso/saml/metadata
    signing_cert_fingerprint: sha256:AB:CD:...   # pinned, rotated manually

    # Acceptable algorithms — explicit allowlist
    allowed_signature_algorithms:
      - http://www.w3.org/2001/04/xmldsig-more#rsa-sha256
    rejected_algorithms:
      - http://www.w3.org/2000/09/xmldsig#rsa-sha1   # weak, never accept

    # Email domain validation — prevent cross-tenant hijack via JIT
    allowed_email_domains:
      - acme.com
      - acmecorp.com

    # Claim mapping — explicit, no wildcards
    claim_mappings:
      - external: NameID
        internal: email
        required: true
      - external: "http://schemas.xmlsoap.org/ws/2005/05/identity/claims/givenname"
        internal: given_name
      - external: "http://acme.com/claims/department"
        internal: department
      - external: "http://acme.com/claims/groups"
        internal: roles
        # Group → role transformation — SECURITY CRITICAL
        # Never copy raw external groups into internal roles
        transform:
          mode: explicit_map
          mappings:
            "Acme-Engineers": "user"
            "Acme-Admins": "tenant_admin"   # tenant_admin, NOT global admin
          default: "user"   # unknown groups → least privilege

    # JIT provisioning
    jit_provisioning:
      enabled: true
      default_role: user
      require_email_verified: true

    # Lifecycle — SCIM endpoint for deprovisioning
    scim:
      enabled: true
      endpoint: /scim/v2/tenants/t-001-acme
      bearer_token_secret: acme-scim-token   # from secrets manager

    # Token policy for federated users
    token_policy:
      access_token_ttl: 600s        # short — pseudo-revocation in 10 min
      refresh_token_ttl: 86400s     # 24h absolute cap
      refresh_token_rotation: true
      back_channel_logout: true

    # Audit
    audit:
      log_all_assertions: true
      log_claim_mappings: true
      alert_on_unknown_claims: true   # detect upstream IdP changes`,

    tags: ["federation", "identity-broker", "saml", "oidc", "multi-tenant", "scim", "b2b-sso"]
  },

  //7.2 Token Standards & Strategy

  {
    id: "7.2.01",
    section: 7,
    subsection: "7.2",
    level: "intermediate",
    question: "How does JWT work? How do you implement secure JWT authentication in a Spring Boot application?",
    quick_answer: "→ Structure: Header.Payload.Signature (Base64URL encoded, dot-separated)\n→ Payload readable by anyone — never store sensitive data in it\n→ Use RS256 (asymmetric) over HS256 — microservices verify without holding signing key\n→ Access token: 15min expiry, store in JS memory (not localStorage — XSS risk)\n→ Refresh token: httpOnly Secure SameSite=Strict cookie only\n→ Always validate: signature + exp + iss + aud",
    detailed_answer: "JWT (JSON Web Token) is a compact self-contained token for transmitting claims.\n\nStructure — three Base64URL parts separated by dots:\n1. Header: {alg: 'RS256', typ: 'JWT'}\n2. Payload: {sub: 'user123', iat: 1234567890, exp: 1234568790, roles: ['ADMIN']}\n3. Signature: RSA-Sign(Base64(header)+'.'+Base64(payload), privateKey)\n\nKey properties:\n→ Self-contained: validated without DB lookup (stateless)\n→ Tamper-evident: signature catches any modification\n→ NOT encrypted: payload is Base64 encoded — readable by anyone\n\nAlgorithm choice:\n→ HS256 (symmetric): same secret signs and verifies\n   Risk: any service that can verify can also create tokens\n→ RS256 (asymmetric): private key signs, public key verifies\n   Microservices can verify without holding signing key\n   Always use RS256 in production\n\nSecurity rules:\n→ Short expiry: 15 minutes for access tokens\n→ Refresh token rotation: new refresh token on every use\n→ Access token in memory — not localStorage (XSS risk)\n→ Refresh token in httpOnly Secure SameSite=Strict cookie\n→ Never store PII, passwords, or sensitive data in payload",
    key_points: [
      "Structure: Header.Payload.Signature — Base64URL encoded",
      "Payload NOT encrypted — never put sensitive data in it",
      "RS256 (asymmetric) preferred over HS256 for microservices",
      "Access token: 15min, JS memory only (not localStorage)",
      "Refresh token: httpOnly Secure SameSite=Strict cookie",
      "Always validate: signature + exp + iss + aud claims"
    ],
    hint: "Go to jwt.io and paste any JWT. You can read the entire payload. Base64 is encoding, not encryption. What does this mean for what you can store in a JWT?",
    common_trap: "Storing JWTs in localStorage — vulnerable to XSS attacks. Any injected script can read localStorage and exfiltrate tokens silently. Store access token in a JS variable (memory) and refresh token in an httpOnly cookie.",
    follow_up_questions: [
      {
        text: "How do you invalidate a JWT before it expires?",
        type: "linked",
        links_to: "7.2.02"
      },
      {
        text: "What is the difference between OAuth2 and OIDC?",
        type: "linked",
        links_to: "7.1.01"
      }
    ],
    related: ["7.1.01", "7.2.02", "7.3.01"],
    has_diagram: false,
    has_code: true,
    code_language: "java",
    code_snippet: `// JWT Service — Spring Boot + RS256
@Service
public class JwtService {

    // ⚠️ Load from AWS Secrets Manager
    //    in production — never hardcode
    @Value("\${jwt.private-key}")
    private RSAPrivateKey privateKey;

    @Value("\${jwt.public-key}")
    private RSAPublicKey publicKey;

    public String generateAccessToken(UserDetails user) {
        return Jwts.builder()
            .setIssuer("keystone-api")        // iss claim
            .setSubject(user.getUsername())    // sub claim
            .setIssuedAt(new Date())
            .setExpiration(in(15, MINUTES))   // ← 15min only
            .claim("roles", getRoles(user))
            .signWith(privateKey, RS256)       // ← asymmetric
            .compact();
    }

    public Claims validateToken(String token) {
        return Jwts.parserBuilder()
            .setSigningKey(publicKey)         // ← public key
            .requireIssuer("keystone-api")    // ← validate iss
            .build()
            .parseClaimsJws(token)            // throws if invalid
            .getBody();
        // exp validated automatically
    }
}`,
    tags: ["JWT","authentication","RS256","security","spring-boot","tokens"]
  },

  {
    id: "7.2.02",
    section: 7,
    subsection: "7.2",
    level: "advanced",
    question: "How do you invalidate a JWT before it expires? What options exist when tokens are supposed to be stateless?",
    quick_answer: "→ Pure JWTs are hard to revoke early because validation is local and stateless\n→ Best default: short-lived access tokens + refresh token rotation\n→ For urgent revocation use deny-list, token versioning, or introspection gateway\n→ Revoke refresh token first — it is the long-lived credential\n→ Architecture choice: more stateless = less revocable",
    detailed_answer: "JWT revocation is the classic trade-off of stateless auth. If every service validates the token locally with a public key, no central authority is consulted on each request. That is fast and scalable, but it also means a stolen token remains valid until `exp` unless you add extra machinery.\n\nThe first control is not a deny-list. It is short access-token lifetime. If the access token lives for 5 to 15 minutes and refresh tokens are rotated aggressively, the exposure window becomes bounded. In many systems that is good enough.\n\nWhen you need stronger revocation, there are three common patterns. Pattern 1: deny-list by `jti` or token hash in Redis with TTL equal to token expiry. Pattern 2: user or session token version stored in the database; tokens carry `token_version`, and a mismatch invalidates all old tokens for that user. Pattern 3: move validation behind an introspection-capable gateway or auth service and treat the token more like a centrally checked credential.\n\nThe key design point is that you should revoke the refresh token first. Access tokens are supposed to be short and disposable. Refresh tokens are the durable credential that can mint more access tokens. If refresh-token reuse is detected, revoke the entire token family and force re-authentication.\n\nSo the honest interview answer is: you never get full early revocation for free with self-contained JWTs. You choose how much revocation you need, and then you deliberately pay for that control with cache lookups, version checks, or introspection.",
    key_points: [
      "Self-contained JWT validation makes early revocation difficult by design",
      "Short-lived access tokens are the first and most important control",
      "Refresh-token rotation limits blast radius and enables reuse detection",
      "Deny-lists, token versioning, and introspection are the main revocation patterns",
      "Revoke refresh tokens first because they are the long-lived credential",
      "Statelessness and revocability trade off against each other"
    ],
    hint: "If every microservice can validate the token with only a public key, where would it learn that the token was revoked five minutes ago?",
    common_trap: "Saying 'JWT cannot be revoked' as an absolute. They can be invalidated, but only by adding state somewhere else. The real question is where that state lives and what latency or complexity you will accept.",
    follow_up_questions: [
      {
        text: "When should you choose opaque tokens and introspection instead of JWTs?",
        type: "linked",
        links_to: "7.2.05"
      },
      {
        text: "What would you do after detecting refresh-token reuse?",
        type: "inline",
        mini_answer: "Treat it as a likely compromise: revoke the entire refresh-token family, invalidate active sessions for that device or account, alert the user if appropriate, and require re-authentication. Reuse means either theft or a client bug. Design for both."
      }
    ],
    related: ["7.2.01", "7.2.04", "7.2.05", "7.3.01"],
    has_diagram: true,
    diagram: `JWT revocation trade-off

  Self-contained JWT
  Service validates locally with public key
          |
          v
    Fast, scalable
          |
          v
  Hard to revoke early

Revocation options:
  1. access token TTL = 5-15 min
  2. refresh token rotation
  3. deny-list in Redis keyed by jti
  4. token_version check per user/session
  5. central introspection at gateway`,
    has_code: false,
    tags: ["jwt", "revocation", "refresh-token", "introspection", "stateless-auth"]
  },

  {
    id: "7.2.03",
    section: 7,
    subsection: "7.2",
    level: "intermediate",
    question: "JWS vs JWE — what is the difference, and when do you actually need encryption for a token?",
    quick_answer: "→ JWS = signed token; integrity and authenticity\n→ JWE = encrypted token; confidentiality as well\n→ Most access tokens are JWS, not JWE\n→ JWT payload is readable unless encrypted\n→ Use JWE only when claims are too sensitive for intermediaries to see",
    detailed_answer: "JWS and JWE solve different problems. JWS signs the token so receivers can verify that the issuer created it and that the payload was not modified. It does not hide the payload. Anyone holding the token can base64-decode the claims.\n\nJWE adds encryption. The token content is encrypted for the intended recipient, so intermediaries and clients cannot inspect the claims. That gives you confidentiality in addition to integrity, but it adds key-management complexity, more CPU work, bigger tokens, and harder debugging.\n\nMost production access tokens are JWS. That is enough because access tokens should contain minimal claims anyway: subject, issuer, audience, expiry, maybe scopes or roles. If you find yourself reaching for JWE because your token includes highly sensitive business or personal data, the better answer is usually to remove those claims, not encrypt the whole token.\n\nJWE becomes reasonable when the token truly must carry confidential claims across untrusted hops, such as business-to-business federation with privacy-sensitive identity assertions. But it is not the default. The clean rule is: sign by default, encrypt only when confidentiality is a real requirement that cannot be handled by claim minimization.",
    key_points: [
      "JWS provides integrity and authenticity, not secrecy",
      "JWE adds confidentiality through encryption",
      "Most access tokens in real systems are signed JWS",
      "Readable payload is why sensitive data should stay out of JWT claims",
      "JWE increases size, latency, and key-management complexity",
      "Prefer minimal claims over encrypted bloated tokens"
    ],
    hint: "If an attacker cannot change the payload but can still read it, which property do you have and which one do you still lack?",
    common_trap: "Assuming JWT means encrypted by default. It does not. Signed and encrypted are different operations with different threat models.",
    follow_up_questions: [
      {
        text: "How do you decide between JWT and opaque tokens in a distributed system?",
        type: "linked",
        links_to: "7.2.05"
      },
      {
        text: "If a claim is confidential, should you put it in the token at all?",
        type: "inline",
        mini_answer: "Usually no. Prefer a small token plus a backend lookup. Encryption should not become an excuse to overstuff tokens with sensitive or fast-changing data."
      }
    ],
    related: ["7.2.01", "7.2.05", "7.3.02"],
    has_diagram: false,
    has_code: false,
    tags: ["jws", "jwe", "jwt", "token-encryption", "identity"]
  },

  {
    id: "7.2.04",
    section: 7,
    subsection: "7.2",
    level: "advanced",
    question: "How should refresh-token rotation work in a browser-based system, and what attack does it help detect?",
    quick_answer: "→ Refresh token is the durable credential; protect it harder than access token\n→ Every refresh returns a NEW refresh token and invalidates the old one\n→ Store refresh token in httpOnly Secure SameSite cookie\n→ Reuse of an old refresh token signals theft or replay\n→ On reuse: revoke token family and force re-authentication",
    detailed_answer: "Refresh-token rotation exists because long-lived bearer tokens are dangerous. In a browser-based system the access token should be short-lived and disposable, while the refresh token is what extends the session. If that refresh token is stolen, the attacker can keep minting access tokens silently for days.\n\nWith rotation, each successful refresh request returns a new access token and a new refresh token. The server marks the previous refresh token as used and invalid. If the old token ever appears again, that is a replay event. Either the token was stolen, or the client has a serious concurrency bug.\n\nA robust design tracks token families. When reuse is detected, do not merely reject that one request. Revoke the entire family derived from that login, invalidate active sessions as needed, and require the user to authenticate again. That is how you turn rotation from a hygiene step into a compromise-detection mechanism.\n\nFor browser apps, the refresh token belongs in an `httpOnly`, `Secure`, `SameSite` cookie, usually with a backend-for-frontend or auth endpoint handling refresh. Do not expose it to JavaScript. And remember that rotation does not fix XSS in general; it reduces the value of a stolen long-lived token if you keep that token out of script reach in the first place.",
    key_points: [
      "Refresh token is the high-value credential in a browser session",
      "Rotation means new refresh token on every successful refresh",
      "Old token reuse is a replay signal, not just a failed request",
      "Track token families so you can revoke all descendants on compromise",
      "Keep refresh tokens in httpOnly Secure cookies, not JavaScript storage",
      "Rotation helps detect theft; it does not replace XSS or CSRF defenses"
    ],
    hint: "If a stolen refresh token and the legitimate client both try to use the same old token, what interesting signal does that create for the server?",
    common_trap: "Thinking rotation is useful only for shortening lifetime. Its bigger value is reuse detection and family-wide revocation when compromise is suspected.",
    follow_up_questions: [
      {
        text: "How do you invalidate access tokens before they expire if compromise is detected?",
        type: "linked",
        links_to: "7.2.02"
      },
      {
        text: "Why is a BFF pattern often recommended for browser OAuth flows?",
        type: "linked",
        links_to: "4.4.01"
      }
    ],
    related: ["7.2.01", "7.2.02", "7.3.06", "4.4.01"],
    has_diagram: true,
    diagram: `Refresh-token rotation

Login
  -> refresh_token R1

Refresh with R1
  -> access_token A2 + refresh_token R2
  -> R1 marked used

Replay with old R1
  -> reuse detected
  -> revoke token family
  -> force re-authentication`,
    has_code: false,
    tags: ["refresh-token", "rotation", "browser-security", "session-management", "oauth2"]
  },

  {
    id: "7.2.05",
    section: 7,
    subsection: "7.2",
    level: "advanced",
    question: "Opaque tokens vs JWTs in a distributed system — when does each win?",
    quick_answer: "→ JWT wins for low-latency local validation across many services\n→ Opaque token wins when revocation, privacy, or claim minimization matters more\n→ JWT reduces auth-server dependency but spreads validation logic everywhere\n→ Opaque token centralizes control via introspection or gateway\n→ Choose based on latency, revocation needs, and trust boundaries",
    detailed_answer: "JWTs and opaque tokens are not 'old vs modern.' They are different architectural trade-offs. JWTs are self-contained, so services can validate locally using issuer metadata and keys. That reduces auth-server dependency on the hot path and works well for large service meshes or globally distributed APIs where every millisecond matters.\n\nOpaque tokens are reference tokens. They carry no useful meaning to the client or resource server until introspected or resolved through a gateway. That means every decision can depend on central state: session status, revocation, risk score, or policy changes. It also means better privacy because the token itself reveals nothing.\n\nJWTs win when claims are stable, latency is critical, and you can tolerate bounded revocation via short TTL. Opaque tokens win when you need immediate revocation, want to hide claims from clients and intermediaries, or expect authorization context to change frequently. Many real systems are hybrid: external clients get opaque tokens validated at the API gateway, while internal service-to-service calls use JWTs minted from trusted workload identity.\n\nThe good architect answer is to tie the decision to control points. If you already have a gateway in front of every API, opaque tokens become more attractive because introspection can be centralized there. If your services need to validate independently at scale, JWTs are often a better fit.",
    key_points: [
      "JWT favors stateless local validation and lower per-request latency",
      "Opaque tokens favor centralized revocation and dynamic policy checks",
      "Opaque tokens reveal no claims to the client or intermediaries",
      "JWTs work best with short TTL and stable claims",
      "Gateway-centric architectures make opaque tokens more appealing",
      "Hybrid token strategies are common in mature platforms"
    ],
    hint: "If a user's access should be revoked immediately everywhere, would you rather every service validate locally or ask a central authority?",
    common_trap: "Choosing JWT because it sounds more scalable without asking whether immediate revocation, privacy, or dynamic authorization matters more for the system.",
    follow_up_questions: [
      {
        text: "How would you design a token strategy for an external SPA plus internal microservices?",
        type: "linked",
        links_to: "7.2.06"
      },
      {
        text: "How do you revoke a JWT before expiry if you still choose JWT?",
        type: "linked",
        links_to: "7.2.02"
      }
    ],
    related: ["7.2.02", "7.2.03", "7.2.06", "7.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["opaque-token", "jwt", "introspection", "gateway", "distributed-systems"]
  },

  {
    id: "7.2.06",
    section: 7,
    subsection: "7.2",
    level: "advanced",
    question: "How would you choose a token strategy for a real architecture with a browser SPA, API gateway, and internal microservices?",
    quick_answer: "→ Start from trust boundaries, not token fashion\n→ Browser should hold as little as possible; BFF or secure session cookie preferred\n→ Gateway is the best choke point for authn, introspection, and coarse authz\n→ Internal services often use short-lived JWTs or workload identity\n→ Separate external-user tokens from internal service identity",
    detailed_answer: "A real token strategy starts with system boundaries. The browser is the least trusted environment, the gateway is your control point, and internal services are where you want least privilege and strong service identity.\n\nFor the browser, the safest mainstream approach is a backend-for-frontend. The browser keeps a session cookie, not raw OAuth tokens. The BFF handles Authorization Code + PKCE, stores refresh tokens server-side or in hardened cookies, and calls downstream APIs on the user's behalf. That avoids exposing bearer tokens directly to JavaScript and simplifies refresh handling.\n\nAt the edge, the API gateway or BFF should enforce authentication, validate issuer and audience, apply coarse-grained authorization, and add trusted identity context downstream. For external access tokens, opaque tokens plus introspection can work well here because the gateway is already the natural enforcement point.\n\nInside the platform, use short-lived JWTs or workload identity for service-to-service traffic. Internal services care more about low-latency machine verification and less about exposing token contents to browsers, because the browser never sees those tokens. This gives you different token choices for different zones, which is usually the right answer.\n\nThe main principle is separation: user session management, external API access, and internal service identity should not all be forced into one token model. Good systems use the simplest trustworthy strategy at each boundary.",
    key_points: [
      "Choose token design per trust boundary, not one-size-fits-all",
      "BFF pattern reduces token exposure in the browser",
      "Gateway is the natural place for validation and coarse authorization",
      "Internal services often prefer short-lived JWTs or workload identity",
      "External user tokens and internal service identity are different problems",
      "Hybrid strategies are usually better than forcing one token type everywhere"
    ],
    hint: "What token does the browser absolutely need to see, and which credentials could be kept off the client entirely?",
    common_trap: "Forcing the same token format and storage approach across browser, gateway, and internal services. Each boundary has a different threat model.",
    follow_up_questions: [
      {
        text: "Why is BFF such a strong pattern for browser-based authentication?",
        type: "linked",
        links_to: "4.4.01"
      },
      {
        text: "When would opaque tokens at the gateway be better than JWTs everywhere?",
        type: "linked",
        links_to: "7.2.05"
      }
    ],
    related: ["7.2.05", "7.3.01", "7.4.01", "4.4.01"],
    has_diagram: true,
    diagram: `Recommended split

Browser
  -> session cookie / BFF

BFF or API Gateway
  -> validates external identity
  -> coarse authorization
  -> token exchange / propagation

Internal Services
  -> short-lived JWT or workload identity
  -> service-to-service auth

Different boundaries, different credentials`,
    has_code: false,
    tags: ["token-strategy", "bff", "gateway", "jwt", "opaque-token", "microservices"]
  },

  // 7.3 API Security

  {
    id: "7.3.01",
    section: 7,
    subsection: "7.3",
    level: "intermediate",
    question: "How should you design rate limiting for a public API, and what are the trade-offs between common algorithms?",
    quick_answer: "→ Rate limiting protects availability, fairness, and abuse budget\n→ Token bucket handles bursts well; fixed window is simplest but spiky\n→ Sliding window/log is fairer but heavier\n→ Limit by identity first, IP second, endpoint third\n→ Return 429 + Retry-After and make limits observable",
    detailed_answer: "Rate limiting is not just a DDoS feature. It is how you enforce fairness, protect downstream systems, and keep one tenant or client from consuming everyone else's capacity. The key is to decide who the budget belongs to: user, API key, tenant, IP, or endpoint.\n\nAlgorithm choice matters. Fixed window counters are easy and cheap, but they allow burstiness at window boundaries. Sliding window approaches are fairer because they smooth behavior across time, but they cost more state and computation. Token bucket is a strong default because it allows controlled bursts while enforcing a sustained average rate. Leaky bucket is similar when you want a steadier outflow.\n\nOperationally, limit by the strongest identity you have. An authenticated tenant or API key is better than IP address, because IP-based limits punish NATed users and are easier to rotate around. You often still keep IP-based safety rails for anonymous traffic. Return `429 Too Many Requests` with `Retry-After`, publish current budget headers if helpful, and observe which clients are throttled most.\n\nThe architectural trade-off is placement. Gateway-level limits are easiest to centralize and protect downstreams early. Service-level limits can protect expensive operations more precisely. Mature systems often do both: coarse limits at the edge and tighter quotas on sensitive endpoints.",
    key_points: [
      "Rate limiting protects fairness and downstream capacity, not just security",
      "Token bucket is a strong default because it allows bounded bursts",
      "Fixed window is simple but bursty at boundaries",
      "Use tenant, user, or API key identity before IP when possible",
      "Return 429 with Retry-After and instrument throttling behavior",
      "Edge and service-level limits are often combined"
    ],
    hint: "If 1,000 users share the same NAT IP, is an IP-only limit actually measuring the thing you care about?",
    common_trap: "Treating rate limiting as a single global per-IP counter. That is usually unfair, easy to evade, and blind to tenant-level abuse or expensive endpoint hotspots.",
    follow_up_questions: [
      {
        text: "How do you secure service-to-service APIs with client certificates instead of bearer tokens?",
        type: "linked",
        links_to: "7.3.02"
      },
      {
        text: "How would you rate-limit a login endpoint differently from a read-only search endpoint?",
        type: "inline",
        mini_answer: "Use tighter, identity-plus-IP aware limits for login and OTP endpoints because brute force is the main threat. Read-heavy search endpoints can allow larger burst budgets but still need tenant and global protections to avoid denial of service."
      }
    ],
    related: ["4.2.11", "4.4.07", "7.2.05", "7.3.04"],
    has_diagram: true,
    diagram: `Rate limiting layers

Client
  -> API Gateway
       - global safety limit
       - tenant/API key budget
       - anonymous IP limit
  -> Service
       - endpoint-specific budget
       - expensive operation protection`,
    has_code: false,
    tags: ["rate-limiting", "api-security", "token-bucket", "availability", "abuse-control"]
  },

  {
    id: "7.3.02",
    section: 7,
    subsection: "7.3",
    level: "advanced",
    question: "When should you use mTLS for API security, and what problems does it solve better than bearer tokens?",
    quick_answer: "→ mTLS gives both server auth and client auth via certificates\n→ Strong fit for service-to-service and B2B APIs with managed identities\n→ Prevents token theft from being the only line of trust\n→ Harder operationally: PKI, issuance, rotation, revocation\n→ Often combine mTLS for transport identity with JWT for user context",
    detailed_answer: "Mutual TLS means both sides authenticate with certificates during the TLS handshake. That makes it excellent for service-to-service traffic and tightly governed partner integrations, because the connection itself is bound to an identity before any HTTP header is processed.\n\nBearer tokens prove possession of a string. If the string leaks, the attacker can replay it from anywhere unless you add sender-constrained mechanisms. mTLS raises the bar because the client must also possess the private key corresponding to its certificate. That is why mTLS is stronger for machine identity and transport trust.\n\nWhere mTLS shines: internal east-west traffic, zero-trust service meshes, and B2B APIs where clients can manage certificates responsibly. Where it struggles: public consumer browsers and mobile apps, because certificate distribution and lifecycle management are awkward there.\n\nA common mature design is layered. Use mTLS to authenticate the calling workload or partner connection, then use JWT or headers to carry end-user claims or authorization context. Transport identity and application identity are related but different. mTLS solves the first exceptionally well.",
    key_points: [
      "mTLS authenticates both client and server during TLS handshake",
      "Stronger than plain bearer tokens for machine identity",
      "Best for service-to-service and managed B2B integrations",
      "Operational cost is PKI lifecycle: issuance, rotation, revocation",
      "mTLS and JWT often complement each other rather than compete",
      "Poor fit for uncontrolled consumer clients"
    ],
    hint: "If a token leaks, what else proves that the caller is the same trusted workload you originally issued it to?",
    common_trap: "Pitching mTLS as a total replacement for authorization. Certificates prove who connected. They do not by themselves express what that caller may do inside the application.",
    follow_up_questions: [
      {
        text: "How does Zero Trust apply to service-to-service traffic inside the platform?",
        type: "linked",
        links_to: "7.4.01"
      },
      {
        text: "What is a practical way to rotate mTLS certificates without downtime?",
        type: "inline",
        mini_answer: "Use short-lived certs issued automatically by the platform or mesh, overlap old and new trust bundles during rotation, and rely on automated reload rather than manual certificate replacement. Human-driven cert rotation does not scale."
      }
    ],
    related: ["7.1.07", "7.3.05", "7.4.01", "7.6.04"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `# Istio PeerAuthentication + DestinationRule example
apiVersion: security.istio.io/v1beta1
kind: PeerAuthentication
metadata:
  name: payments-mtls
spec:
  selector:
    matchLabels:
      app: payments
  mtls:
    mode: STRICT
---
apiVersion: networking.istio.io/v1beta1
kind: DestinationRule
metadata:
  name: payments-dr
spec:
  host: payments.default.svc.cluster.local
  trafficPolicy:
    tls:
      mode: ISTIO_MUTUAL`,
    tags: ["mtls", "api-security", "service-mesh", "certificates", "zero-trust"]
  },

  {
    id: "7.3.03",
    section: 7,
    subsection: "7.3",
    level: "intermediate",
    question: "What does secure input validation for APIs actually mean, and why is JSON schema alone not enough?",
    quick_answer: "→ Validate syntax, type, range, format, and business invariants\n→ Reject unexpected fields where possible\n→ Canonicalize before validating security-sensitive input\n→ Schema validation catches shape, not intent or authorization\n→ Validation must happen server-side even if clients validate too",
    detailed_answer: "Secure input validation has layers. The first layer is structural: is the payload valid JSON, does it match expected types, are required fields present, are lengths and numeric ranges sane. A JSON schema or framework validator is useful there.\n\nBut schema is only the start. Security-sensitive inputs also need semantic checks. Example: a field may be a valid UUID syntactically, but the caller may not be authorized to reference that resource. An amount may be a valid decimal, but negative or outside business policy. A sort field may be a string, but still dangerous if you pass it unchecked into SQL or dynamic query builders.\n\nCanonicalization matters too. If two encodings or representations of the same value are treated differently by different layers, you can create bypasses. Normalize before validating when dealing with paths, hostnames, Unicode usernames, or signed content.\n\nThe crisp interview answer is that secure validation means reject malformed, unexpected, out-of-range, and semantically invalid input as close to the boundary as possible, while remembering that authorization and business rules are part of validation too. Schema helps with structure. It does not eliminate injection, broken object-level authorization, or logic abuse on its own.",
    key_points: [
      "Validation includes structure, semantics, and authorization-sensitive checks",
      "JSON schema is necessary but not sufficient",
      "Reject unknown or extraneous fields when feasible",
      "Normalize input before validation for security-sensitive values",
      "Validation must occur server-side even if clients pre-validate",
      "Never pass user-controlled fields directly into queries or downstream commands"
    ],
    hint: "If a request body is perfectly shaped JSON but asks for someone else's `accountId`, is that a validation problem, an authorization problem, or both?",
    common_trap: "Equating 'schema valid' with 'safe.' Many API breaches come from well-formed requests that target objects the caller should never have been allowed to touch.",
    follow_up_questions: [
      {
        text: "How do broken object-level authorization bugs show up in real APIs?",
        type: "linked",
        links_to: "7.3.04"
      },
      {
        text: "What is a good pattern for validating complex requests in code?",
        type: "inline",
        mini_answer: "Split validation into boundary validation, domain validation, and authorization checks. Keep structural schema checks near the controller, business invariants in the service layer, and ownership or policy checks next to the resource access path."
      }
    ],
    related: ["7.3.04", "7.3.06", "4.4.07"],
    has_diagram: false,
    has_code: false,
    tags: ["input-validation", "api-security", "schema-validation", "authorization", "injection"]
  },

  {
    id: "7.3.04",
    section: 7,
    subsection: "7.3",
    level: "advanced",
    question: "OWASP API Top 10 sounds broad. Which risks matter most architecturally, and how do you design against them?",
    quick_answer: "→ Top architectural risks: BOLA, broken auth, excessive data exposure, mass assignment, rate-limit gaps\n→ BOLA is the big one: valid user, wrong object\n→ Secure defaults at gateway are helpful, but app-layer authz is decisive\n→ Minimize data returned and explicitly map writeable fields\n→ Treat abuse controls as part of design, not a later patch",
    detailed_answer: "The OWASP API Top 10 is a useful checklist, but a few items dominate real architectural damage. Broken Object Level Authorization, often called BOLA or IDOR in older language, is the most important. That is when the caller is authenticated but can read or modify another user's resource by changing an ID. It is not stopped by TLS, JWTs, or schema validation alone.\n\nThe next big class is broken authentication or authorization flow: trusting unsigned headers, weak session binding, or missing audience and issuer checks. Excessive data exposure is another repeat offender; teams return giant domain objects and assume the client will hide fields it should not show. Mass assignment is similar on writes: the API accepts fields that should never be client-controlled, such as `role`, `status`, or `tenantId`.\n\nDesign defenses are straightforward but must be systematic. Object access must always be filtered by identity and tenant context, not just by object ID. Response DTOs should be explicit, not raw entities. Write models should whitelist allowed fields. Abuse protection such as rate limits and anomaly detection belongs at the edge and at sensitive endpoints.\n\nThe architect answer is to recognize that the dangerous API bugs are usually logic bugs, not crypto bugs. They happen because systems authenticate correctly but authorize or shape data poorly.",
    key_points: [
      "BOLA is the most important architectural API risk",
      "Authenticated users can still be unauthorized for specific objects",
      "Explicit read and write DTOs reduce excessive data exposure and mass assignment",
      "Issuer, audience, and signature checks matter for token-bearing APIs",
      "Rate limiting and anomaly detection are core API controls, not extras",
      "Most serious API failures are logic flaws rather than encryption failures"
    ],
    hint: "If a user can call `GET /orders/123` successfully, what must the system prove besides 'this token is valid'?",
    common_trap: "Treating API security as gateway config only. Gateways help, but BOLA and mass assignment are usually fixed in application design and data access patterns.",
    follow_up_questions: [
      {
        text: "How do you design API input handling to reduce mass assignment and logic abuse?",
        type: "linked",
        links_to: "7.3.03"
      },
      {
        text: "Why do retries and idempotency keys matter for secure APIs too?",
        type: "linked",
        links_to: "4.4.07"
      }
    ],
    related: ["7.3.01", "7.3.03", "7.3.05", "4.4.07"],
    has_diagram: false,
    has_code: false,
    tags: ["owasp-api", "bola", "mass-assignment", "data-exposure", "authorization"]
  },

  {
    id: "7.3.05",
    section: 7,
    subsection: "7.3",
    level: "basic",
    question: "API key vs JWT — what is the difference, and when is an API key still acceptable?",
    quick_answer: "→ API key identifies the caller application; JWT can carry richer identity and expiry\n→ API keys are usually static bearer secrets with coarse access\n→ JWTs support expiry, issuer, audience, scopes, and signature validation\n→ API keys are acceptable for simple server-to-server or low-risk usage with strict limits\n→ Never confuse authentication of an app with authorization of a user",
    detailed_answer: "API keys are the simplest form of client credential: a static secret string sent on requests. They are easy to issue and consume, which is why they still exist. But they are blunt instruments. They usually identify an application or integration, not an end user, and they are harder to scope, rotate, and audit than modern token systems.\n\nJWTs are richer. They can expire quickly, carry issuer and audience context, include scopes or claims, and be verified cryptographically. That makes them better for user-facing APIs or machine identities that need stronger policy and observability.\n\nAPI keys are still acceptable when the integration is simple, low risk, and strongly rate-limited, such as internal tooling, read-only analytics endpoints, or early-stage partner integrations. Even then, treat them as secrets: hash them at rest, show them once, rotate them, and pair them with quotas and IP or mTLS controls where possible.\n\nThe conceptual difference to emphasize is identity granularity. An API key usually tells you which application is calling. A JWT can tell you which user or workload is calling, under which issuer, for which audience, and until when.",
    key_points: [
      "API keys are simple static bearer secrets, usually app-level identity",
      "JWTs provide richer identity, expiry, and validation semantics",
      "API keys are acceptable only for carefully bounded use cases",
      "Hash API keys at rest and support rotation and revocation",
      "Combine API keys with quotas and other controls if you must use them",
      "Do not use API keys as a stand-in for end-user authorization"
    ],
    hint: "If a request comes with only an API key, what can you usually know about the human behind the request?",
    common_trap: "Using one long-lived API key as the only security control for a broad production API. That leaves you with weak revocation, poor auditability, and no user-level context.",
    follow_up_questions: [
      {
        text: "When do opaque tokens or JWTs become a better fit than API keys?",
        type: "linked",
        links_to: "7.2.05"
      },
      {
        text: "How would you harden an API-key-based integration if you had to keep it?",
        type: "inline",
        mini_answer: "Scope each key narrowly, hash it at rest, show it once, rotate it regularly, rate-limit it, monitor usage anomalies, and prefer pairing it with IP allowlists or mTLS for high-value integrations."
      }
    ],
    related: ["7.2.01", "7.2.05", "7.3.01"],
    has_diagram: false,
    has_code: false,
    tags: ["api-key", "jwt", "api-security", "authentication", "partner-integration"]
  },

  {
    id: "7.3.06",
    section: 7,
    subsection: "7.3",
    level: "intermediate",
    question: "CORS confuses people. What problem does it solve, what does it not solve, and what are the dangerous misconfigurations?",
    quick_answer: "→ CORS is a browser-enforced policy for cross-origin web requests\n→ It protects users from malicious websites abusing browser credentials\n→ It is not a server-to-server security control\n→ Never use `*` with credentials\n→ Treat allowed origins as an explicit trust list, not convenience config",
    detailed_answer: "CORS exists because the browser automatically carries ambient authority such as cookies, client certs, and sometimes saved credentials. Without a same-origin policy and controlled exceptions, any site a user visits could silently make privileged requests to another site in the background.\n\nCORS lets the server declare which origins may read responses and, for credentialed requests, which origins may send them with cookies or other browser credentials. That makes it a browser policy negotiation. It does not protect your API from curl, Postman, backend services, or attackers who directly call the API outside a browser.\n\nThe dangerous configuration is convenience-driven allow-all. `Access-Control-Allow-Origin: *` is fine only for truly public, non-credentialed resources. The moment you allow credentials, you must enumerate trusted origins explicitly. Reflecting any `Origin` header dynamically is also dangerous unless the value is checked against an allowlist.\n\nThe sharp interview answer is: CORS is about browser trust boundaries, not authentication. It helps prevent one website from abusing another website's user session, but it does not replace CSRF protection, authentication, or authorization.",
    key_points: [
      "CORS is enforced by browsers, not by the network at large",
      "It controls which origins may read or send credentialed cross-origin requests",
      "It is not a substitute for authentication, authorization, or CSRF defenses",
      "Wildcard origin is unsafe for credentialed endpoints",
      "Dynamic origin reflection must be backed by an allowlist",
      "Public APIs still need auth and abuse protection even if CORS is strict"
    ],
    hint: "If an attacker uses curl from their own machine, will the browser's CORS policy help you at all?",
    common_trap: "Treating CORS failure as proof that an API is secure. CORS only constrains browsers. Attackers calling the API directly are unaffected.",
    follow_up_questions: [
      {
        text: "How does a backend-for-frontend reduce browser token exposure and CORS complexity?",
        type: "linked",
        links_to: "4.4.01"
      },
      {
        text: "What should you do if you must support multiple customer origins?",
        type: "inline",
        mini_answer: "Maintain an explicit allowlist per tenant or environment, validate the `Origin` header against it, and return that exact origin only when it is trusted. Never blindly reflect arbitrary origins."
      }
    ],
    related: ["7.2.04", "7.2.06", "4.4.01"],
    has_diagram: false,
    has_code: false,
    tags: ["cors", "browser-security", "api-security", "csrf", "bff"]
  },

  // 7.4 Zero Trust Architecture

  {
    id: "7.4.01",
    section: 7,
    subsection: "7.4",
    level: "intermediate",
    question: "What does Zero Trust actually mean in practice for modern architecture?",
    quick_answer: "→ Zero Trust means no implicit trust from network location alone\n→ Every request should be authenticated, authorized, and context-aware\n→ Verify user identity, device/workload identity, and policy on each access path\n→ Internal traffic is treated as hostile until proven otherwise\n→ It is a design model, not a single product",
    detailed_answer: "Zero Trust is often summarized as 'never trust, always verify,' but the practical meaning is more specific: a request coming from the corporate network, private subnet, or Kubernetes cluster should not automatically be treated as trustworthy. Access decisions should be based on verified identity, device or workload posture, requested resource, and context.\n\nIn architecture terms, that means identity becomes the new perimeter. Users authenticate strongly, services identify themselves cryptographically, and access to applications or APIs is mediated by policy rather than broad network reachability. Microsegmentation, short-lived credentials, mTLS, continuous session evaluation, and least privilege are all implementation patterns under that umbrella.\n\nZero Trust does not mean every packet triggers a full heavyweight policy engine from scratch. It means your system avoids implicit trust assumptions that say 'inside is safe.' In practice, you centralize policy where useful, but you still authenticate and authorize explicitly at boundaries that matter.\n\nThe best interview answer points out that Zero Trust is not a SKU. It is an architectural posture built from identity, segmentation, device or workload trust signals, and continuous verification.",
    key_points: [
      "Zero Trust removes implicit trust based only on network position",
      "Identity becomes the primary control plane for access decisions",
      "Users, devices, and workloads all need verifiable identity",
      "mTLS, segmentation, and short-lived credentials are common building blocks",
      "Least privilege applies to east-west traffic too",
      "Zero Trust is a design model implemented through multiple controls"
    ],
    hint: "If an attacker gets inside your VPC or cluster, which assumptions in your design should already have failed safe rather than open?",
    common_trap: "Reducing Zero Trust to 'we use SSO' or 'we turned on VPN MFA.' Those are useful controls, but Zero Trust is broader and includes internal service trust boundaries too.",
    follow_up_questions: [
      {
        text: "How do you apply Zero Trust specifically to internal service-to-service traffic?",
        type: "linked",
        links_to: "7.3.02"
      },
      {
        text: "How does microsegmentation support Zero Trust?",
        type: "linked",
        links_to: "7.4.03"
      }
    ],
    related: ["7.3.02", "7.4.02", "7.4.03", "7.5.04"],
    has_diagram: true,
    diagram: `Zero Trust posture

Old model:
  inside network => trusted

Zero Trust model:
  request
    -> authenticate identity
    -> verify device/workload
    -> evaluate policy
    -> grant least privilege

Trust is earned per access, not inherited from location`,
    has_code: false,
    tags: ["zero-trust", "identity", "service-security", "segmentation", "least-privilege"]
  },

  {
    id: "7.4.02",
    section: 7,
    subsection: "7.4",
    level: "advanced",
    question: "What is continuous verification in a Zero Trust system, and why is one-time login not enough?",
    quick_answer: "→ Zero Trust is not just login-time trust; risk can change mid-session\n→ Re-evaluate identity, device posture, location, and behavior over time\n→ Short-lived sessions and token renewal create policy checkpoints\n→ Step-up auth or session revocation should happen on risk changes\n→ High-value actions deserve stronger checks than low-value reads",
    detailed_answer: "One-time authentication assumes the world is stable after login. Zero Trust rejects that assumption. Users roam networks, devices become unhealthy, tokens get stolen, and behavior changes. A session that was low risk at 9:00 AM may be suspicious at 2:00 PM.\n\nContinuous verification means the system revisits trust over time and at sensitive actions. That can be done through short-lived tokens, conditional access policies, device posture signals from endpoint management, anomaly detection, and step-up authentication for high-risk operations like wire transfers or privilege escalation.\n\nYou do not need to prompt the user constantly. The point is not friction for its own sake. The point is that authorization decisions remain conditional rather than permanent. Token renewal becomes a natural checkpoint. Gateways and identity providers can re-check policy, and sensitive applications can demand stronger proof when the context changes.\n\nThis is a subtle but important interview answer: Zero Trust is dynamic. It is not simply MFA at login plus a long-lived trusted session after that.",
    key_points: [
      "Risk can change during a session, so trust must be re-evaluated",
      "Short-lived tokens create recurring policy checkpoints",
      "Device posture and location can influence access decisions",
      "Step-up auth is appropriate for higher-risk actions",
      "Continuous verification balances security with usability by targeting context",
      "Zero Trust sessions are conditional, not permanently trusted"
    ],
    hint: "If a user logs in from a managed laptop and later the same session starts acting from a Tor exit node, should the system behave exactly the same?",
    common_trap: "Confusing short session timeouts with continuous verification. Short timeouts help, but the bigger idea is conditional re-evaluation when risk or action changes.",
    follow_up_questions: [
      {
        text: "How does BeyondCorp-style access differ from a VPN-centric model?",
        type: "linked",
        links_to: "7.4.04"
      },
      {
        text: "What triggers should cause step-up authentication?",
        type: "inline",
        mini_answer: "Examples include unusual location, unmanaged device, privilege escalation, payout changes, password reset, token reuse signals, or high-value transactions. The trigger set should follow business risk, not just technical novelty."
      }
    ],
    related: ["7.2.04", "7.4.01", "7.4.04"],
    has_diagram: false,
    has_code: false,
    tags: ["continuous-verification", "zero-trust", "conditional-access", "step-up-auth"]
  },

  {
    id: "7.4.03",
    section: 7,
    subsection: "7.4",
    level: "intermediate",
    question: "What is microsegmentation, and how does it reduce lateral movement risk?",
    quick_answer: "→ Microsegmentation limits which workloads can talk to which other workloads\n→ Default deny + explicit allow shrinks blast radius\n→ Segmentation should align to service trust boundaries, not just IP ranges\n→ Prevents one compromised workload from freely exploring the network\n→ Strong identity-aware policy beats coarse subnet rules alone",
    detailed_answer: "Microsegmentation means breaking internal connectivity into small trust zones with explicit policy between them. In the old flat-network model, once an attacker lands on one host, east-west movement is often easy. Microsegmentation makes that movement noisy and difficult.\n\nGood microsegmentation is not just VLAN math. It maps to application roles, data sensitivity, and service relationships. For example, a web frontend should reach an API tier, but not the database administration plane. A reporting job may read from analytics storage, but should never initiate connections to payment processing services.\n\nImplementation can happen with cloud security groups, Kubernetes network policies, service-mesh authorization, host firewalls, or dedicated segmentation products. The best versions become identity-aware rather than purely IP-based, because workloads move and scale dynamically.\n\nThe important architectural point is blast radius. Segmentation rarely prevents the first compromise. It prevents that compromise from turning into full-environment traversal.",
    key_points: [
      "Microsegmentation restricts east-west communication paths",
      "Default deny plus explicit allow reduces lateral movement",
      "Policies should reflect service relationships and data sensitivity",
      "Identity-aware controls are better than static IP assumptions alone",
      "Cloud SGs, K8s policies, and meshes can all implement segmentation",
      "Main benefit is blast-radius reduction after initial compromise"
    ],
    hint: "If the reporting service is compromised, what should it still be physically unable to reach?",
    common_trap: "Calling any network ACL strategy microsegmentation. Real segmentation is fine-grained and based on trust relationships, not just a few large subnets.",
    follow_up_questions: [
      {
        text: "How does Zero Trust change the way you think about internal network access?",
        type: "linked",
        links_to: "7.4.01"
      },
      {
        text: "What is the biggest operational risk when introducing segmentation?",
        type: "inline",
        mini_answer: "Breaking legitimate flows because dependencies were poorly mapped. Start in observe mode where possible, capture real traffic, then tighten toward least privilege iteratively."
      }
    ],
    related: ["7.4.01", "7.6.03", "7.6.04"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `apiVersion: networking.k8s.io/v1
kind: NetworkPolicy
metadata:
  name: payments-api-allow-only-frontend
spec:
  podSelector:
    matchLabels:
      app: payments-api
  policyTypes:
    - Ingress
  ingress:
    - from:
        - podSelector:
            matchLabels:
              app: web-frontend
      ports:
        - protocol: TCP
          port: 8443`,
    tags: ["microsegmentation", "zero-trust", "network-policy", "lateral-movement", "kubernetes"]
  },

  {
    id: "7.4.04",
    section: 7,
    subsection: "7.4",
    level: "advanced",
    question: "What is BeyondCorp-style access, and why is it different from a traditional VPN model?",
    quick_answer: "→ VPN trusts network entry; BeyondCorp trusts verified identity and device context per app\n→ Users connect to applications, not broad internal networks\n→ Fine-grained policy replaces blanket network reachability\n→ Better fit for cloud, remote work, and SaaS-heavy environments\n→ Requires strong IdP, device posture, and app-aware proxying",
    detailed_answer: "The traditional VPN model says: authenticate once, enter the corporate network, and from there many internal resources become reachable. That improves confidentiality over the internet, but it still treats network placement as a major trust signal.\n\nBeyondCorp-style access flips that. Users do not get broad network access by default. They authenticate to an identity-aware proxy or access layer, which evaluates identity, device posture, risk signals, and application policy before granting access to a specific service. The employee connects to the app, not to the whole subnet.\n\nThis fits modern environments better because applications are spread across clouds and SaaS platforms, employees work remotely, and internal networks are no longer the clean security boundary they once pretended to be. It also limits blast radius because compromise of one session does not automatically create broad lateral network visibility.\n\nThe price is maturity. You need a solid identity platform, device inventory or posture data, application-aware proxies, and careful policy design. But the security model is cleaner: access is granted to a named resource under explicit policy, not because the user is 'inside.'",
    key_points: [
      "VPN grants network entry; BeyondCorp grants app-specific access",
      "Identity-aware proxy becomes the enforcement plane",
      "Device posture and context influence access decisions",
      "Better aligned with remote work and cloud-native architectures",
      "Reduces overbroad internal network exposure",
      "Depends on strong identity and policy infrastructure"
    ],
    hint: "Would you rather let a contractor onto your entire office floor, or escort them only to the one meeting room they need?",
    common_trap: "Thinking BeyondCorp just means 'SSO in front of apps.' The distinctive shift is away from broad network access toward per-application access under continuous context-aware policy.",
    follow_up_questions: [
      {
        text: "Why is continuous verification important in a BeyondCorp-style system?",
        type: "linked",
        links_to: "7.4.02"
      },
      {
        text: "How do you handle legacy systems that only understand network trust?",
        type: "inline",
        mini_answer: "Put them behind an identity-aware proxy, isolate them aggressively, and progressively wrap them with stronger auth and segmentation controls rather than leaving them exposed on a broad internal network."
      }
    ],
    related: ["7.4.01", "7.4.02", "7.6.04"],
    has_diagram: false,
    has_code: false,
    tags: ["beyondcorp", "zero-trust", "vpn", "identity-aware-proxy", "remote-access"]
  },

  // 7.5 Secrets Management

  {
    id: "7.5.01",
    section: 7,
    subsection: "7.5",
    level: "intermediate",
    question: "What is the right way to manage secrets in a modern platform, and why are environment variables not the full answer?",
    quick_answer: "→ Secrets need secure storage, controlled delivery, rotation, and audit\n→ Env vars are a delivery mechanism, not a secrets-management strategy\n→ Use a secrets manager or vault as source of truth\n→ Prefer short-lived dynamic credentials where possible\n→ Limit who can read secrets and avoid spreading them everywhere",
    detailed_answer: "A good secrets strategy answers four questions: where secrets are stored, how they are delivered, how they rotate, and how access is audited. Environment variables only answer a small part of delivery. They do not give you rotation workflows, fine-grained access policies, or strong audit trails by themselves.\n\nModern platforms use a dedicated secret store such as Vault, AWS Secrets Manager, GCP Secret Manager, or Azure Key Vault. Applications fetch secrets at startup or through sidecars, CSI drivers, or platform integrations. The secret manager becomes the source of truth, with IAM policies determining which workload may read which secret.\n\nThe best case is to avoid long-lived secrets entirely. Dynamic database credentials, cloud workload identity, and short-lived certificates reduce the amount of static secret material you must protect. When you do need static secrets, rotate them, scope them tightly, and keep them out of source control, container images, and logs.\n\nThe architectural habit to build is minimization. Fewer secrets in fewer places, with shorter lifetimes and clearer ownership, is almost always safer than trying to harden a sprawling secret footprint.",
    key_points: [
      "Secrets management includes storage, delivery, rotation, and audit",
      "Environment variables are only one delivery mechanism",
      "Use Vault or cloud secret managers as the source of truth",
      "Prefer dynamic or short-lived credentials over static passwords",
      "Least-privilege access to secrets matters as much as encryption at rest",
      "Keep secrets out of code, images, logs, and tickets"
    ],
    hint: "If your app reads a database password from an env var, where did that password come from, who rotated it, and who can audit access to it?",
    common_trap: "Saying 'we store it in an env var' as if that solves secrets management. It only describes where the process sees the value, not how it is governed.",
    follow_up_questions: [
      {
        text: "When would you choose Vault over a cloud-native secrets manager?",
        type: "linked",
        links_to: "7.5.02"
      },
      {
        text: "How do workload identity and short-lived credentials reduce secret sprawl?",
        type: "linked",
        links_to: "7.5.04"
      }
    ],
    related: ["7.1.03", "7.5.02", "7.5.03", "7.5.04"],
    has_diagram: false,
    has_code: false,
    tags: ["secrets-management", "vault", "aws-secrets-manager", "env-vars", "credential-rotation"]
  },

  {
    id: "7.5.02",
    section: 7,
    subsection: "7.5",
    level: "advanced",
    question: "HashiCorp Vault vs cloud-native secrets managers — how do you decide?",
    quick_answer: "→ Vault wins for multi-cloud, dynamic secrets, PKI, and advanced workflows\n→ Cloud-native managers win for simplicity and tight platform integration\n→ Decision depends on portability, secret types, ops maturity, and scale\n→ Dynamic credentials are a major reason to choose Vault\n→ Prefer simpler managed options if they meet your needs",
    detailed_answer: "Vault is a broader secret and identity platform. It supports dynamic database credentials, PKI, transit encryption, leasing, response wrapping, and a consistent interface across environments. That makes it powerful for multi-cloud or hybrid estates, or for organizations that need richer secret workflows than simple key-value storage.\n\nCloud-native secret managers are narrower but operationally easier. AWS Secrets Manager, GCP Secret Manager, and Azure Key Vault integrate naturally with their IAM systems, audit logs, and runtime platforms. If most of your workloads live in one cloud and you mainly need storage, retrieval, and rotation hooks, the managed option is often enough.\n\nThe real decision is not brand preference. It is whether you need advanced secret issuance and cross-platform consistency badly enough to justify operating Vault or paying for that extra complexity. If dynamic credentials, PKI issuance, or multi-cloud consistency are central, Vault is compelling. If not, the managed service usually has a better operational profile.\n\nA senior answer also mentions failure mode ownership. Managed services shift availability and upgrades to the provider. Vault gives you more control and more responsibility.",
    key_points: [
      "Vault offers dynamic secrets, PKI, transit, and multi-environment consistency",
      "Cloud-native managers offer simpler operations and strong cloud integration",
      "Dynamic credentials are a major differentiator for Vault",
      "Single-cloud environments often do well with managed secret stores",
      "Operational overhead is part of the architectural decision",
      "Choose based on capability need, not on tool prestige"
    ],
    hint: "If your biggest problem is issuing short-lived Postgres credentials dynamically, does a simple key-value secret store really solve that?",
    common_trap: "Choosing Vault because it feels more 'enterprise' even when the platform only needs straightforward managed secret storage.",
    follow_up_questions: [
      {
        text: "How should secret rotation work without taking applications down?",
        type: "linked",
        links_to: "7.5.03"
      },
      {
        text: "How can workload identity remove the need for many static secrets entirely?",
        type: "linked",
        links_to: "7.5.04"
      }
    ],
    related: ["7.5.01", "7.5.03", "7.5.04", "7.6.04"],
    has_diagram: false,
    has_code: false,
    tags: ["vault", "secrets-manager", "multi-cloud", "dynamic-secrets", "platform-design"]
  },

  {
    id: "7.5.03",
    section: 7,
    subsection: "7.5",
    level: "intermediate",
    question: "How do you rotate secrets safely in production without breaking live systems?",
    quick_answer: "→ Rotation needs overlap, staged rollout, and observability\n→ Support dual credentials during transition where possible\n→ Rotate producers and consumers deliberately, not all at once blindly\n→ Short-lived credentials reduce rotation pain dramatically\n→ Test the rollback path before calling rotation 'automated'",
    detailed_answer: "Secret rotation is easy to say and hard to operationalize. The main problem is dependency coordination: one side starts using the new credential before the other side accepts it, and production falls over.\n\nThe safe pattern is overlap. Where the system allows it, create a second valid credential, deploy consumers to use it gradually, watch for successful adoption, then retire the old one. This is common for API client secrets, database passwords with dual-user cutovers, signing keys, and TLS trust bundles.\n\nFor systems that cannot support overlap, you need controlled orchestration and short blast radius. That may mean draining traffic, rotating a subset of instances, or using dynamic credentials so rotation becomes routine rather than exceptional. Observability matters: you should know which version of a secret each workload is using, and whether auth failures spike after rotation.\n\nThe best strategic answer is to reduce reliance on long-lived shared secrets in the first place. Workload identity, mTLS, and dynamic credentials make rotation far less painful because the platform is already built for frequent credential changes.",
    key_points: [
      "Rotation fails when dependency coordination is ignored",
      "Dual-valid overlap is the safest general pattern",
      "Instrumentation is needed to know adoption and failure rates during rotation",
      "Rollback path matters as much as rollout path",
      "Dynamic or short-lived credentials make rotation easier by design",
      "Rotation should be rehearsed, not only performed during emergencies"
    ],
    hint: "If you rotate the password in the secret store first, what happens to all the app instances still using the old value?",
    common_trap: "Calling periodic password replacement 'rotation' when there is no safe overlap strategy, no telemetry, and no rollback path.",
    follow_up_questions: [
      {
        text: "Why are short-lived workload credentials better than rotating static secrets forever?",
        type: "linked",
        links_to: "7.5.04"
      },
      {
        text: "How would you rotate a JWT signing key safely?",
        type: "inline",
        mini_answer: "Publish the new public key in JWKS before using the private key to sign, support overlap while old tokens expire, then retire the old key only after the maximum token lifetime passes. Key rotation is a trust-bundle rollout problem."
      }
    ],
    related: ["7.2.01", "7.5.01", "7.5.02", "7.5.04"],
    has_diagram: false,
    has_code: false,
    tags: ["rotation", "secrets", "production-operations", "key-management", "availability"]
  },

  {
    id: "7.5.04",
    section: 7,
    subsection: "7.5",
    level: "advanced",
    question: "How do you inject secrets into containers securely, and when should you avoid static secrets entirely?",
    quick_answer: "→ Do not bake secrets into images or source control\n→ Use runtime delivery: sidecar, CSI driver, platform secret mount, or startup fetch\n→ Restrict file/env visibility to the workload identity that needs it\n→ Prefer workload identity and dynamic creds to eliminate static secrets\n→ Secret injection is good; secret elimination is better",
    detailed_answer: "Container secret handling starts with one absolute rule: never put secrets in the image. Images are replicated, cached, scanned, and often broadly readable. Once a secret is baked in, revocation becomes painful and accidental leakage becomes likely.\n\nSecure delivery happens at runtime. Common patterns include mounting secrets as files via CSI or platform integrations, sidecar agents that renew and write credentials, or startup fetch through workload identity. Mounted files are often better than environment variables because they are less likely to appear in crash dumps or process listings, though both require careful process isolation and logging hygiene.\n\nThe stronger move is to avoid static secrets where possible. In Kubernetes or cloud platforms, workload identity can let the app authenticate as itself to AWS, GCP, or Azure without storing long-lived cloud keys. Vault can issue short-lived database credentials on demand. Service meshes can mint short-lived certificates. These approaches reduce the secret inventory entirely.\n\nSo the goal is not merely to hide static secrets better. It is to redesign authentication so fewer long-lived shared secrets exist at all.",
    key_points: [
      "Never embed secrets in container images",
      "Deliver secrets at runtime through controlled platform mechanisms",
      "Mounted files are often safer operationally than plain env vars",
      "Workload identity can remove the need for cloud access keys entirely",
      "Dynamic credentials reduce secret lifetime and blast radius",
      "The long-term goal is secret elimination where possible"
    ],
    hint: "If someone can pull your image from the registry, what should they definitely not be able to learn from it?",
    common_trap: "Treating Kubernetes Secrets or env vars as secure enough by themselves. They are transport and storage primitives, not complete governance or identity solutions.",
    follow_up_questions: [
      {
        text: "How does Zero Trust rely on workload identity instead of static shared secrets?",
        type: "linked",
        links_to: "7.4.01"
      },
      {
        text: "When would Vault be especially useful for container secret injection?",
        type: "linked",
        links_to: "7.5.02"
      }
    ],
    related: ["7.3.02", "7.4.01", "7.5.01", "7.5.02"],
    has_diagram: false,
    has_code: true,
    code_language: "yaml",
    code_snippet: `apiVersion: v1
kind: Pod
metadata:
  name: billing-api
spec:
  serviceAccountName: billing-api
  containers:
    - name: app
      image: billing-api:1.0.0
      volumeMounts:
        - name: db-creds
          mountPath: /var/run/secrets/db
          readOnly: true
  volumes:
    - name: db-creds
      csi:
        driver: secrets-store.csi.k8s.io
        readOnly: true
        volumeAttributes:
          secretProviderClass: billing-db-creds`,
    tags: ["container-security", "secrets-injection", "workload-identity", "vault", "kubernetes"]
  },

  // 7.6 Network Security

  {
    id: "7.6.01",
    section: 7,
    subsection: "7.6",
    level: "intermediate",
    question: "What does a WAF actually protect against, and what are its limits?",
    quick_answer: "→ WAF filters HTTP/S requests for known malicious patterns and policy violations\n→ Good for basic injection payloads, bot control, virtual patching, and coarse rules\n→ It does not understand all business logic or object-level auth bugs\n→ Best placed in front of public web apps and APIs, not as your only control\n→ WAF buys time; app fixes still matter",
    detailed_answer: "A web application firewall inspects HTTP traffic and blocks or challenges requests based on signatures, anomaly detection, or configured rules. It is useful for blocking obvious attack payloads, common injection attempts, malformed requests, bot traffic, and emergency virtual patches when a code fix is not yet deployed.\n\nIts limitation is context. A WAF does not understand your business model deeply enough to catch every logic flaw. If a valid authenticated user asks for another tenant's invoice and your application returns it, a WAF will often see a normal request. That is why WAF is additive, not foundational.\n\nArchitecturally, WAF belongs near the edge in front of public web apps and APIs, often combined with CDN and DDoS protections. It should be tuned carefully, monitored for false positives, and treated as one layer in defense in depth.\n\nThe strong answer is: use WAF for coarse pattern-based defense and emergency shielding, but never confuse it with secure application design, authorization, or safe data handling.",
    key_points: [
      "WAF inspects HTTP requests for malicious patterns and policy violations",
      "Useful for injection signatures, bot control, and virtual patching",
      "Cannot reliably catch business-logic flaws like BOLA",
      "Best deployed at the public edge with monitoring and tuning",
      "False positives are a practical operational concern",
      "WAF complements application security; it does not replace it"
    ],
    hint: "If your API leaks another customer's data through a valid request path, would a regex-based edge filter necessarily recognize that as malicious?",
    common_trap: "Claiming a WAF solves API security. It helps against known bad traffic, but logic-level application flaws still sail right through if the app allows them.",
    follow_up_questions: [
      {
        text: "How is DDoS protection different from WAF, and how do they work together?",
        type: "linked",
        links_to: "7.6.02"
      },
      {
        text: "When is virtual patching a reasonable WAF use case?",
        type: "inline",
        mini_answer: "When a known exploit path exists and a code fix cannot be safely shipped immediately. Use the WAF rule as a temporary shield, not as the permanent remediation."
      }
    ],
    related: ["7.3.04", "7.6.02", "7.6.03"],
    has_diagram: false,
    has_code: false,
    tags: ["waf", "network-security", "api-security", "edge-security", "defense-in-depth"]
  },

  {
    id: "7.6.02",
    section: 7,
    subsection: "7.6",
    level: "intermediate",
    question: "How should you think about DDoS protection architecturally rather than as a single product checkbox?",
    quick_answer: "→ DDoS defense is layered: absorb, filter, and degrade gracefully\n→ CDN/Anycast handles volume; WAF and rate limits handle app-layer abuse\n→ Protect origins by hiding them and scaling the edge first\n→ Have runbooks for brownout modes and feature shedding\n→ Goal is survivability, not perfect blocking",
    detailed_answer: "DDoS protection is not one control because attacks happen at multiple layers. Volumetric attacks target bandwidth and routing. Protocol attacks exhaust connection state or infrastructure behavior. Application-layer attacks mimic legitimate usage but at abusive scale.\n\nThat is why the defense stack is layered. CDN and Anycast distribution absorb and spread volumetric load. Cloud DDoS services and edge firewalls filter known abusive traffic patterns. Rate limiting, challenge pages, caching, and request shaping help with application-layer abuse. Origin protection matters too: if attackers can bypass the CDN and hit the origin directly, much of your edge investment is wasted.\n\nArchitecturally, you should also plan degraded modes. If the system is under attack, can you cache more aggressively, disable expensive personalized features, or shed low-priority traffic? Resilience patterns from Section 4 matter here because availability under attack is partly a graceful-degradation problem.\n\nThe goal is not to promise that no malicious packet reaches you. The goal is to keep critical user journeys alive under hostile load and to understand which layers absorb which kind of attack.",
    key_points: [
      "DDoS attacks happen at volumetric, protocol, and application layers",
      "CDN and Anycast are key for absorbing large edge traffic floods",
      "Rate limiting and challenges help with app-layer abuse",
      "Hide and protect origins so attackers cannot bypass the edge",
      "Graceful degradation and brownout planning are part of defense",
      "Survivability is the architectural goal"
    ],
    hint: "If your CDN survives but your origin is directly reachable and unauthenticated, where will the attack go next?",
    common_trap: "Talking about DDoS only as a bandwidth problem. Many painful attacks look like 'normal' requests at hostile scale and need application-aware controls too.",
    follow_up_questions: [
      {
        text: "How do rate limits fit into application-layer DDoS defense?",
        type: "linked",
        links_to: "7.3.01"
      },
      {
        text: "What is a useful degraded mode during API abuse?",
        type: "inline",
        mini_answer: "Cache aggressively, disable expensive aggregation or secondary features, lower per-tenant quotas for anonymous traffic, and protect write paths or critical read paths first. The goal is to preserve core functionality under stress."
      }
    ],
    related: ["4.2.09", "7.3.01", "7.6.01", "7.6.03"],
    has_diagram: false,
    has_code: false,
    tags: ["ddos", "availability", "cdn", "anycast", "graceful-degradation", "edge-security"]
  },

  {
    id: "7.6.03",
    section: 7,
    subsection: "7.6",
    level: "intermediate",
    question: "What does secure VPC or cloud network design look like for a modern application?",
    quick_answer: "→ Separate public entry points from private application and data tiers\n→ Default deny with least-privilege SGs/NACLs where possible\n→ Keep databases and internal services off the public internet\n→ Use egress controls and logging, not just ingress rules\n→ Network design should mirror trust boundaries and blast-radius goals",
    detailed_answer: "A secure cloud network starts by limiting what is internet-facing. Load balancers, CDN origins, bastion alternatives, or controlled access proxies may be public. Application services, worker nodes, and databases should generally live in private subnets with explicit inbound paths only from trusted layers.\n\nSecurity groups and equivalent constructs should express least privilege between tiers: frontend to API, API to database, operations plane to managed services, and so on. Flat 'allow all internal traffic' policies defeat much of the value of private networking. Egress controls matter too, especially for high-trust workloads that should not call arbitrary external destinations.\n\nObservability is part of secure network design. Flow logs, DNS logs, security group change monitoring, and route visibility help you detect both mistakes and abuse. High-value environments also separate workloads across accounts, VPCs, or projects to reduce blast radius.\n\nThe architectural idea is that topology should reinforce trust assumptions. Public, private, management, and data planes should not all blur together just because the cloud makes connectivity easy.",
    key_points: [
      "Expose only the layers that must be internet-facing",
      "Private subnets and least-privilege SGs reduce unnecessary reachability",
      "Databases and internal services should stay off the public internet",
      "Egress controls are important for data exfiltration risk",
      "Network logs and change visibility support detection and response",
      "Topology should reflect trust zones and blast-radius boundaries"
    ],
    hint: "If an application server is compromised, what outbound paths would you regret having left wide open?",
    common_trap: "Believing 'private subnet' alone equals secure. If east-west access and egress are broad, a compromise can still spread or exfiltrate freely.",
    follow_up_questions: [
      {
        text: "How does microsegmentation refine cloud network design further?",
        type: "linked",
        links_to: "7.4.03"
      },
      {
        text: "Why is PrivateLink or private service connectivity useful for managed services?",
        type: "linked",
        links_to: "7.6.04"
      }
    ],
    related: ["7.4.03", "7.6.01", "7.6.02", "7.6.04"],
    has_diagram: true,
    diagram: `Internet
  |
  v
Public edge / LB
  |
  v
Private app tier
  |
  v
Private data tier

Separate:
  - management access
  - egress controls
  - logs / flow visibility`,
    has_code: false,
    tags: ["vpc", "cloud-networking", "private-subnet", "security-groups", "egress-control"]
  },

  {
    id: "7.6.04",
    section: 7,
    subsection: "7.6",
    level: "advanced",
    question: "Why use PrivateLink-style private connectivity, and what security problem does it solve better than public endpoints plus IP allowlists?",
    quick_answer: "→ Private connectivity keeps traffic on provider backbone, not public internet\n→ Reduces exposed surface for managed services and partner access\n→ Stronger than IP allowlists because identity is tied to private attachment, not just source IP\n→ Helps with data exfiltration control and simpler trust boundaries\n→ Still need authz; private path alone is not enough",
    detailed_answer: "PrivateLink-style connectivity lets one VPC or tenant consume a service over private provider networking without exposing that service publicly. The big win is surface-area reduction: your database, internal API, or managed service endpoint no longer needs to sit on the public internet with broad firewall and IP-allowlist rules.\n\nIP allowlists are better than nothing, but they are weak identity. NAT changes, shared egress, and operational sprawl make them brittle. Private connectivity binds access more tightly to specific network attachments, accounts, or service consumers, which is cleaner and easier to reason about.\n\nThis matters for B2B, regulated workloads, and managed-service consumption where you want the traffic path, DNS model, and access scope to stay private. It also helps data-exfiltration control because workloads can be forced toward private service endpoints rather than arbitrary public destinations.\n\nThe caveat is familiar: private connectivity narrows exposure, but it does not replace authentication and authorization. A privately reachable service can still be abused by a compromised internal workload if higher-level controls are missing.",
    key_points: [
      "Private connectivity reduces public attack surface for service endpoints",
      "Provider backbone traffic avoids exposing services broadly on the internet",
      "Stronger and cleaner than large IP allowlists for many use cases",
      "Useful for managed-service access, B2B, and regulated environments",
      "Supports exfiltration control by preferring private service paths",
      "Application authn and authz are still required on top"
    ],
    hint: "Would you rather protect a high-value internal service with 'only these public IPs may call me' or with a private attachment that never exposes the service publicly at all?",
    common_trap: "Treating private connectivity as a complete security solution. It reduces exposure, but compromised allowed workloads can still misuse the service unless identity and authorization checks exist too.",
    follow_up_questions: [
      {
        text: "How does strong machine identity like mTLS complement private network paths?",
        type: "linked",
        links_to: "7.3.02"
      },
      {
        text: "How does secure VPC design set the stage for private connectivity patterns?",
        type: "linked",
        links_to: "7.6.03"
      }
    ],
    related: ["7.3.02", "7.5.02", "7.6.03", "7.4.04"],
    has_diagram: false,
    has_code: false,
    tags: ["privatelink", "private-connectivity", "network-security", "managed-services", "exfiltration"]
  },

  // 7.7 Threat Modeling

  {
    id: "7.7.01",
    section: 7,
    subsection: "7.7",
    level: "intermediate",
    question: "What is STRIDE, and how do you use it in a practical threat-modeling session?",
    quick_answer: "→ STRIDE = Spoofing, Tampering, Repudiation, Information disclosure, DoS, Elevation of privilege\n→ Use it against data flows and trust boundaries, not in the abstract\n→ Ask each category per component or interaction\n→ Output should be prioritized threats and mitigations, not a pretty diagram only\n→ Threat modeling is about design decisions early, not paperwork late",
    detailed_answer: "STRIDE is a mnemonic for six common threat categories: Spoofing, Tampering, Repudiation, Information Disclosure, Denial of Service, and Elevation of Privilege. Its value is not the acronym itself; it is the discipline of walking through each system boundary and asking what could go wrong there.\n\nIn practice, start with a simple data-flow diagram: users, services, data stores, third-party systems, admin paths, and trust boundaries. Then inspect each component and flow through a STRIDE lens. Can identity be spoofed here? Can messages be modified? Is there enough auditability to prevent repudiation? Could this flow leak sensitive data? Could it be exhausted? Could a lower-privilege actor gain more privilege?\n\nThe output should be concrete. List the top threats, likelihood or impact, current controls, and missing mitigations. A useful threat model drives design changes such as adding mTLS, narrowing permissions, improving audit logging, or changing where sensitive data lives.\n\nThe interview signal is that you treat threat modeling as a practical design tool, not a ceremonial document created after architecture is already fixed.",
    key_points: [
      "STRIDE is a structured way to scan common threat classes",
      "Use it against real components, flows, and trust boundaries",
      "Threat modeling should produce mitigations and priorities",
      "Simple diagrams are enough if they capture the important boundaries",
      "Do it early enough to influence design, not after implementation is frozen",
      "Security architecture improves when threats are tied to concrete flows"
    ],
    hint: "If a diagram has no trust boundaries on it, is it detailed enough to support useful threat modeling?",
    common_trap: "Running STRIDE as a checklist divorced from the actual architecture. The method is only useful when grounded in real assets, actors, and data flows.",
    follow_up_questions: [
      {
        text: "How do you identify and shrink attack surface before deep threat analysis?",
        type: "linked",
        links_to: "7.7.02"
      },
      {
        text: "How is PASTA different from STRIDE?",
        type: "linked",
        links_to: "7.7.04"
      }
    ],
    related: ["7.3.04", "7.4.01", "7.7.02", "7.7.04"],
    has_diagram: true,
    diagram: `STRIDE on a data flow

User -> API Gateway -> Service -> Database

Ask per hop:
  S: can identity be spoofed?
  T: can data be modified?
  R: is action auditable?
  I: can data leak?
  D: can flow be exhausted?
  E: can privilege be raised?`,
    has_code: false,
    tags: ["stride", "threat-modeling", "security-design", "trust-boundaries", "risk"]
  },

  {
    id: "7.7.02",
    section: 7,
    subsection: "7.7",
    level: "intermediate",
    question: "What is attack surface, and how do architects actually reduce it?",
    quick_answer: "→ Attack surface is every reachable path an attacker can interact with\n→ Reduce it by removing unnecessary endpoints, permissions, data exposure, and connectivity\n→ Private by default beats public and filtered later\n→ Simpler architectures often have smaller attack surfaces\n→ Attack-surface reduction is often the cheapest security improvement",
    detailed_answer: "Attack surface is the sum of places an attacker can poke: public endpoints, admin consoles, partner integrations, credentials, dependencies, data stores, message brokers, and even overly broad internal connectivity. The more exposed edges and privileged pathways you create, the more opportunities an attacker has.\n\nArchitects reduce attack surface by subtraction first. Remove unused endpoints, disable default accounts, avoid public exposure for internal services, limit outbound internet access, collapse unnecessary permissions, and return less data. This is why secure design often feels like simplification.\n\nThe concept matters because many controls add complexity while attack-surface reduction removes it. Closing a forgotten admin API or deleting an overprivileged integration account can do more than a fancy new detection system.\n\nA strong answer also connects attack surface to system evolution. Every feature, integration, and convenience endpoint adds surface. Security architecture means asking whether that surface is worth it before adding another layer around it.",
    key_points: [
      "Attack surface includes reachable interfaces, privileges, and exposure paths",
      "The best reduction move is often removal, not filtering",
      "Private-by-default architectures expose fewer paths to attackers",
      "Least privilege is attack-surface reduction for identity",
      "Data minimization is attack-surface reduction for information disclosure",
      "Security often improves when architecture gets simpler"
    ],
    hint: "Which is safer: an endpoint that is perfectly filtered, or an endpoint that does not exist anymore?",
    common_trap: "Thinking only about internet-facing URLs. Internal admin endpoints, overbroad IAM, and unnecessary outbound access are also part of the attack surface.",
    follow_up_questions: [
      {
        text: "How does microsegmentation reduce attack surface inside the platform?",
        type: "linked",
        links_to: "7.4.03"
      },
      {
        text: "How do you use STRIDE once you have identified the key exposed paths?",
        type: "linked",
        links_to: "7.7.01"
      }
    ],
    related: ["7.4.03", "7.5.04", "7.6.03", "7.7.01"],
    has_diagram: false,
    has_code: false,
    tags: ["attack-surface", "threat-modeling", "least-privilege", "exposure", "design"]
  },

  {
    id: "7.7.03",
    section: 7,
    subsection: "7.7",
    level: "advanced",
    question: "What does a practical threat-modeling process look like on a real engineering team?",
    quick_answer: "→ Trigger on new systems, major changes, sensitive data, or trust-boundary shifts\n→ Use lightweight diagrams and focused workshops, not giant documents\n→ Involve engineers, product, and security where needed\n→ Prioritize top threats, owners, and mitigation deadlines\n→ Revisit the model when architecture changes",
    detailed_answer: "A useful threat-modeling process is lightweight, repeatable, and tied to delivery. Typical triggers are new products, new external integrations, sensitive-data flows, auth changes, or major architecture changes such as adopting queues, public APIs, or new cloud patterns.\n\nThe session itself should be short and concrete. Bring the engineers who know the system, plus security or platform people when needed. Draw the real request and data paths, mark trust boundaries, identify assets, and walk through the highest-risk flows. Use STRIDE or another method as a prompt, but keep the discussion grounded in actual design choices.\n\nMost importantly, the output must land in normal engineering workflow. Threats need owners, mitigation tasks, and prioritization. If the result lives only in a slide deck, the process failed. You also need a re-entry rule: when the architecture changes materially, the threat model should be updated.\n\nThe best process answer sounds operational, not ceremonial. Threat modeling should feel like design review plus risk thinking, not like a compliance side quest.",
    key_points: [
      "Threat modeling should be event-driven and tied to design changes",
      "Small workshops with the right engineers beat giant static documents",
      "Trust boundaries, assets, and key flows matter more than exhaustive diagrams",
      "Output must translate into tracked engineering work",
      "Ownership and revisiting criteria make the process sustainable",
      "Good threat modeling fits naturally into architecture review and planning"
    ],
    hint: "If the threat model identified three serious issues but none became backlog items, was the process actually successful?",
    common_trap: "Treating threat modeling as a one-time security-team artifact instead of a recurring engineering practice that changes design and backlog decisions.",
    follow_up_questions: [
      {
        text: "How does PASTA differ if you want a more risk-driven threat-modeling method?",
        type: "linked",
        links_to: "7.7.04"
      },
      {
        text: "When should a team re-run a threat model?",
        type: "inline",
        mini_answer: "When trust boundaries change, new external integrations appear, authentication changes, sensitive data scope expands, or an incident reveals assumptions were wrong. Re-run on architecture change, not on a fixed calendar alone."
      }
    ],
    related: ["7.7.01", "7.7.02", "7.7.04", "10.6.01"],
    has_diagram: false,
    has_code: false,
    tags: ["threat-modeling-process", "security-review", "architecture-review", "risk-management"]
  },

  {
    id: "7.7.04",
    section: 7,
    subsection: "7.7",
    level: "advanced",
    question: "PASTA vs STRIDE — how are they different, and when would you choose one over the other?",
    quick_answer: "→ STRIDE is a threat-category lens; PASTA is a broader risk-driven process\n→ STRIDE is faster for design workshops and component analysis\n→ PASTA adds business impact, attacker goals, and attack simulation thinking\n→ Use STRIDE for lightweight recurring modeling; PASTA for high-stakes systems\n→ They can complement each other rather than compete",
    detailed_answer: "STRIDE and PASTA are different kinds of tools. STRIDE is mainly a categorization framework that helps teams ask good questions about a system: spoofing, tampering, repudiation, information disclosure, denial of service, and elevation of privilege. It is fast, teachable, and great for recurring engineering workshops.\n\nPASTA is more of a process model. It pushes you through stages such as business objective definition, technical scope, decomposition, threat analysis, weakness analysis, attack modeling, and risk-driven mitigation. That makes it heavier, but also better aligned to high-impact systems where attacker objectives, business consequences, and layered scenarios matter a lot.\n\nIn practice, teams often use STRIDE more often because it is easier to operationalize. PASTA is useful when the system is high stakes, regulated, or exposed enough that a deeper, scenario-driven analysis is justified. They are not mutually exclusive. A team may use PASTA for a major platform or payment redesign and still use STRIDE within workshops for specific flows.\n\nThe mature answer is to choose the method that fits the decision you need. If you need a quick but structured engineering threat review, STRIDE is excellent. If you need a richer risk analysis tied to attacker behavior and business impact, PASTA is worth the extra effort.",
    key_points: [
      "STRIDE is a threat-class framework; PASTA is a broader risk-driven methodology",
      "STRIDE is lighter and easier to use frequently",
      "PASTA emphasizes attacker goals and business impact more explicitly",
      "High-stakes systems may justify PASTA's extra structure",
      "Teams can combine them rather than choosing only one forever",
      "Method choice should match the depth of decision required"
    ],
    hint: "Do you need a fast architecture workshop, or a deeper scenario-driven risk study tied to business impact?",
    common_trap: "Answering this as a vocabulary question only. The real difference is not the acronym expansion; it is the depth and style of analysis each method supports.",
    follow_up_questions: [
      {
        text: "How would you run a practical STRIDE workshop on a new service?",
        type: "linked",
        links_to: "7.7.01"
      },
      {
        text: "What makes a threat-modeling process actually stick on a team?",
        type: "linked",
        links_to: "7.7.03"
      }
    ],
    related: ["7.7.01", "7.7.03", "10.1.01"],
    has_diagram: false,
    has_code: false,
    tags: ["pasta", "stride", "threat-modeling", "risk-analysis", "security-methodology"]
  }

];
