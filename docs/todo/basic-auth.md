# TODO: Re-enable Basic Auth (with IIIF Exceptions)

The goal is to re-secure the NIIIFTY dashboard and administrative UI using Basic Authentication, while ensuring that the critical IIIF/IPNS proxy layer remains public for compatibility with external viewers.

## 📋 Implementation Checklist

- [ ] **Phase 1: Configuration Update**
    - [ ] Modify `niiifty.config.ts` to set `basicAuthDisabled: false` for the `default` (production) environment.
    - [ ] Ensure `staging` also has the correct flag if needed.

- [ ] **Phase 2: Middleware Hardening (`src/proxy.ts`)**
    - [ ] Update `src/proxy.ts` (Next.js 16 middleware) matcher to hit all routes: `matcher: ['/:path*']`.
    - [ ] Ensure the **`!isProduction` guard** is strictly maintained (Next.js `dev` mode should bypass auth).
    - [ ] Implement a `PUBLIC_PATHS` whitelist:
        - [ ] `/_next/` (Static assets)
        - [ ] `/favicon.ico`
        - [ ] `/api/ipns/` (Crucial for Universal Viewer compatibility)
    - [ ] Integrate environment variables `BASIC_AUTH_USER` and `BASIC_AUTH_PASS`.
    - [ ] Fallback to current hashing logic if environment variables are missing (for local dev safety).

- [ ] **Phase 3: Store Verification Guard (`route.ts`)**
    - [ ] Import Firestore `db` into `src/app/api/ipns/[ipnsKey]/[...path]/route.ts`.
    - [ ] Implement lookup: Verify the URL parameter **`ipnsKey`** exists in the `files` collection (**`ipnsName`** field).
    - [ ] Reject unknown keys with `401 Unauthorized`.
    - [ ] Ensure this check preserves the 300s cache headers to avoid over-querying Firestore.

- [ ] **Phase 4: Documentation**
    - [ ] Update `README.md` with instructions for setting Basic Auth secrets in Firebase App Hosting.

---

## 🔒 Security Posture
- **Site-wide protection:** Applied to all dashboard routes and the homepage.
- **REST APIs:** Protected by default, except for the explicit IPNS whitelist.
- **Environment Driven:** Credentials managed via encrypted secrets, not hardcoded.

## ✅ Verification
1. **Challenge Check:** Visit `/` and verify `401 Unauthorized` / Browser Prompt in production.
2. **Localhost Check:** Verify `localhost:3000/` still loads without a prompt.
3. **Proxy Bypass:** Fetch a valid `/api/ipns/[key]/index.json` via `curl` and verify `200 OK`.
4. **Proxy Lock:** Fetch a random/fake IPNS key via the proxy and verify `401 Unauthorized` (Verification Guard).
5. **Static Assets:** Verify `/_next/static/...` CSS/JS loads without auth challenge.
