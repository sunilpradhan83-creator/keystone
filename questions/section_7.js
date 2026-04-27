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
  }

];
