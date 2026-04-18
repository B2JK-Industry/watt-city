# Legal drafts — external-review gate

Everything in `docs/legal/` is a DRAFT. None of it has been reviewed by
counsel and none of it is in production. It exists so that when external
review begins, the lawyer has a starting document rather than a blank page.

## Files

- `TERMS-DRAFT.md` — Terms of Service skeleton (Phase 4.3.4).
- `PRIVACY-PKO.md` — privacy policy extension for the PKO skin (Phase 4.3.5).
- `DISCLAIMERS.md` — candidate disclaimer copy for loan dialogs, footer,
  mirror flow, bankructwo, etc. (Phase 4.3.3).

## Blocking items (4.3.1, 4.3.2, 4.3.3)

These are external tasks that code cannot execute:

### 4.3.1 — KNF review of in-game financial product depictions
- **Questions to raise**:
  - Does the mortgage amortization display require a KNF-approved template?
  - Is the bankructwo flow allowable as an educational feature for minors?
  - Does the "Mirror to PKO Junior" suggestion fall under PSD2?
- **Contacts needed**: KNF Departament Ochrony Klientów.

### 4.3.2 — Children's marketing + GDPR-K review
- **Questions to raise**:
  - Does our parental-consent handshake (kid-generated 24h one-shot code +
    parent POST) satisfy UODO's 2026 interpretation of GDPR-K art. 8?
  - Is the 30-day soft-delete window acceptable for minors or must we
    offer immediate erasure?
  - Do we need separate consent for: in-app notifications, push
    notifications (Phase 2.7 gated), OAuth to PKO Junior?
- **Contacts needed**: UODO (PL supervisory authority), external children-
  media lawyer.

### 4.3.3 — Disclaimer copy review with PKO compliance
- See `DISCLAIMERS.md` for the 6 candidate locations.
- **Contacts needed**: PKO Department of Legal & Compliance.

## How code interacts with this

None of these documents are imported by any code file. The persistent
in-app disclaimer ribbon uses `theme.disclaimer` (lib/theme.ts) which
currently points at the short form. When legal review completes, update
the theme file — no other code change required.
