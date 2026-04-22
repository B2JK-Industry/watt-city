# Terms of Service — DRAFT (Phase 4.3.4)

> **STATUS: DRAFT FOR LEGAL REVIEW.** Not in force. This file is scaffolding
> for a lawyer to edit. Do not publish or link to it. External counsel must
> sign off before `/terms` ships.

## Scope

These Terms of Service ("Terms") govern access to and use of the Watt City
educational game ("Service"), operated by [OPERATOR LEGAL ENTITY — TBD] in
partnership with PKO Bank Polski S.A. ("PKO") when running under the PKO
Junior skin.

## 1. Eligibility

- Polish GDPR-K sets the digital-consent threshold at 16
  (`GDPR_K_AGE_THRESHOLD` in `lib/gdpr-k.ts`). Users under 16 (both the
  `under-13` and `13-15` age buckets per `ageBucketFromBirthYear`)
  require documented parental consent via one of the two flows
  described in `docs/legal/PRIVACY-PKO.md` §3.3.
- Users 16+ may register without additional consent.

## 2. In-game currency

- Watt City uses an in-game currency displayed as "W$" or "W-coin". These
  tokens are NOT legal tender, NOT exchangeable for PLN, EUR or any other
  currency, NOT redeemable for goods or services outside the Service.
- The "Mirror to PKO Junior" feature (Phase 4.2) does NOT convert in-game
  currency into real money. It optionally copies a percentage of the
  player's in-game cashflow as a top-up into a real PKO Junior account,
  using funds the linked parent has pre-authorised from their own account.

## 3. Loans in the game

- The mortgage, leasing, kredyt obrotowy and kredyt konsumencki products in
  Watt City are educational models. They do NOT constitute offering of
  financial services under Polish or EU law (in particular, they do NOT
  fall under Directive 2014/17/EU on mortgage credit).
- Game loan terms (APR, RRSO) are set for educational illustration only.
  They do NOT reflect real PKO BP products.

## 4. Acceptable use

Users must not:
- Use automation, bots, or scripts to earn in-game resources.
- Impersonate another player, teacher or parent.
- Post abusive, offensive or illegal content in comments.
- Attempt to bypass the content moderation filter (Phase 5.2).

## 5. Accounts

- Username must not contain personally identifiable information.
- Display name (Phase 2.9.5) may be a real first name only if the user has
  parental permission.
- Players can delete their account at any time; see
  `docs/legal/PRIVACY-PKO.md` §5 for GDPR Art. 17 handling.

## 6. Termination

- We may suspend or terminate accounts that violate §4.
- Banned players lose access to cheers, comments, and marketplace. Their
  in-game city remains visible to linked parents for 30 days per GDPR Art. 20.

## 7. Liability

THE SERVICE IS PROVIDED "AS IS" WITHOUT WARRANTY. [OPERATOR] IS NOT LIABLE
FOR LOSS OF IN-GAME PROGRESS, ACCOUNT DATA, OR FOR FINANCIAL DECISIONS THE
USER OR THEIR PARENT MAKES BASED ON EDUCATIONAL CONTENT IN THE SERVICE.

## 8. Changes

[OPERATOR] reserves the right to modify these Terms. Material changes will
be announced in-app with a 14-day notice period for users aged 16+ and via
parent-linked accounts for younger users.

## 9. Governing law

Polish law applies. Disputes fall under the jurisdiction of the Warsaw
district courts.

---

## Open questions for counsel

1. Does the "Mirror to PKO Junior" feature (Phase 4.2.3) — even when
   parent-authorised — trigger regulated financial-service rules under PSD2?
2. Is the in-game mortgage illustration (APR, RRSO display, amortization
   schedule) treated as "financial advice" under MiFID II when shown to a
   minor? Does a permanent "GRA EDUKACYJNA" disclaimer suffice?
3. Is a 30-day soft-delete retention window compliant with GDPR Art. 17
   for minor accounts, or must we harden to 0 days on request?
4. What insurance coverage do we need if a player's parent top-ups a real
   PKO Junior account and the kid later disputes the amount?
5. Do classroom-mode teacher dashboards (Phase 3.3) need school district
   data-controller agreements, or can the school treat each teacher as an
   independent controller?
