# Privacy policy extension — PKO partnership skin (Phase 4.3.5)

> **STATUS: DRAFT FOR LEGAL REVIEW.** Lives on top of the general Watt City
> privacy policy at `/ochrana-sukromia`. When the PKO skin is active
> (SKIN=pko), this extension applies; the base privacy policy still
> applies in the core skin.

## 1. Parties

- **Data controller (core)**: [OPERATOR LEGAL ENTITY — TBD], Poland.
- **Data controller (PKO skin)**: jointly [OPERATOR] and PKO Bank Polski
  S.A. per the joint-controller agreement (Phase 4.3.1).

## 2. Data categories

| Category | Example | Retention | Lawful basis |
|---|---|---|---|
| Account identifiers | username, hashed password | Until account deletion + 30 days | Contract |
| Progress state | resources, buildings, loans | Same | Contract |
| Ledger entries | score / tick / loan payment log | 12 months rolling | Contract |
| Notifications | in-app bell feed | 200-entry cap, auto-pruned | Contract |
| Parent link | kid↔parent code pairs | Until unlink | Consent + parental responsibility |
| Classroom link | teacher↔student pairs | Until class archive | Consent (teacher + parent) |
| Marketplace trades | listing + sale records | 24 months | Legitimate interest (fraud investigation) |
| PKO Junior audit log | mock or real top-ups + mirror txs | 5 years (legal retention for financial records) | Legal obligation |

## 3. Processing operations specific to the PKO skin

### 3.1 Mirror to PKO Junior

- When a user (or their linked parent) triggers "Mirror to PKO Junior":
  - Watt City sends a top-up request to the PKO Junior API with the
    mirror amount and audit identifier.
  - No in-game resources leave Watt City — the feature is a signal, not
    a transfer of value.
- Processor: PKO BP (for the real API in Phase 4.2.4; until then, the
  mock is in-process and PKO has no data access).

### 3.2 OAuth linking (Phase 4.2.5 — blocked)

- If the user opts into OAuth-based account linking, we receive a short-
  lived token from PKO and store only a salted hash of the PKO customer
  ID, never the full ID.

### 3.3 Children's data (GDPR-K)

- Users under 16 can only enable Mirror / OAuth features with documented
  parental consent via the parent dashboard (Phase 3.4).
- Parental consent records are retained for 5 years per GDPR Art. 7 §1
  evidencing obligation.

## 4. Data subject rights

All GDPR rights apply (access, rectification, erasure, portability,
objection, restriction). Requests can be submitted via `/api/me` for
automated responses; complex requests (especially for minor accounts)
route to [DPO EMAIL — TBD].

## 5. Retention + soft delete

- Accounts flagged for deletion enter a 30-day soft-delete window.
  During this period, parent-linked accounts can restore via the parent
  dashboard.
- After 30 days the username is permanently released and all ledger /
  building / loan data is hard-deleted.
- PKO audit log is NOT deleted — financial-record retention obligations
  override the erasure request.

## 6. International transfers

Watt City infrastructure runs on Vercel (US-based CDN, EU regions for
compute). Upstash Redis instances are in eu-central-1 (Frankfurt). No
personal data is transferred outside the EEA except CDN-cached static
assets.

## 7. Complaints

Users may complain to the Polish supervisory authority:
Urząd Ochrony Danych Osobowych (UODO), ul. Stawki 2, 00-193 Warszawa.

---

## Open questions for legal + DPO

1. Is the 5-year PKO audit retention compatible with GDPR Art. 17 erasure
   requests from minors? Precedent needed.
2. What form does parental consent take? Wet signature, verified email,
   SMS OTP, or platform-UI checkbox + audit log — which satisfies UODO for
   an EU kids product in 2026?
3. Do we need a separate DPO for the PKO skin, or can the base-skin DPO
   cover both?
4. Does the "skarb miasta" pot (Phase 3.2 marketplace 5% fee) count as a
   financial asset under any regulation? If so, we need an accounting
   policy for it.
