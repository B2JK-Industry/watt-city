# Zadanie pre vývoj — Web3 Base track (ETHSilesia 2026)

**Klient**: B2JK Industry (Watt City)
**Projekt**: Watt City — gamifikovaná finančná edukácia pre deti 10–16
**Termín**: ETHSilesia 2026 (17–19 apríl 2026, Katowice)
**Rozpočet**: ~8 vývojových hodín + ~0,5 h operátorského času klienta
**Externé náklady**: 0 € (testnet + free-tier služby)

> **Status (2026-04-22)**: W1..W7 dodané (dc40def → 046c120). Watt City vyhral **1. miesto v PKO Gaming tracku**. Web3/Base submission package je v `docs/web3/SUBMISSION.md`; Base Sepolia deploy ostáva operator-blocked na funding faucetu — demo flow bežal proti lokálnemu anvil nodu per `docs/web3/DEPLOYMENTS.md`.

---

## 1. Čo treba vyvinúť (1 veta)

Aktivovať na-chain medaily (achievementy) v aplikácii Watt City tak, aby deti (s písomným súhlasom rodiča) mohli získať verejne overiteľný certifikát svojich úspechov v hre — na blockchaine Base Sepolia (testnet).

## 2. Prečo to robíme (biznis kontext)

Watt City ide na hackathon ETHSilesia 2026 s primárnym pitch na **PKO Gaming track** (~10,000 PLN). Tento update **neruší** primárny pitch — **pridáva druhú kategóriu**: **Web3/Base track** (ďalšia prize, rovnaké repo, rovnaká demo).

**Diferenciátor pre obe kategórie naraz:**
Tento úpravou sa stávame **prvým kid-safe on-chain achievement systémom v PL bankovníctve**. Každá fintech zinscenuje "na chain" — väčšinou nebezpečne (deti + seedphrase + spekulácia). My to riešime jediným správnym spôsobom:

- Rodič musí dať **explicitný súhlas** (V4.6 observer už existuje)
- Medaily sú **soulbound** — nedajú sa predať/trade-nuť (nie je to spekulatívny asset, je to certifikát)
- **GDPR "právo na zabudnutie"** funguje — zrušenie súhlasu = medaily sa spália (burn)
- **Coinbase Smart Wallet + passkey** — dieťa sa prihlási cez Face ID/Touch ID, žiadne 12-slovné hesla

## 3. Čo uvidí používateľ po nasadení

| Persona | Pred úpravou | Po úprave |
|---|---|---|
| **Dieťa (bez rodičovského súhlasu)** | Zbiera medaily v hre | **Rovnaké** — nič sa pre neho nezmení |
| **Dieťa (s rodičovským súhlasom)** | — | V `/profile` nová sekcia "Moje medale NFT". Pripojí peňaženku (Face ID). Klikne "Zamintuj". Medaila sa objaví na BaseScan (verejný register) s jeho menom a linkom na overenie. |
| **Rodič** | Vidí progresy dieťaťa na `/rodzic` | + nový checkbox "Dieťa môže získať on-chain medaily (opcionálne)". Môže kedykoľvek zrušiť → všetky medaily sa spália automaticky. |
| **Učiteľ** | Vidí dashboard triedy | **Rovnaké** — web3 ho sa netýka |
| **Judge ETHSilesia** | — | Otvorí `docs/web3/SUBMISSION.md`, pozrie 2-min demo video, klikne BaseScan link → vidí overený kontrakt + naše Transfer eventy |

## 4. Rozsah prác (7 úloh, W1 → W7)

Vývojár dodrží striktné poradie. Jeden commit na úlohu.

### W1 — Inštalácia web3 knižníc + feature flag
Pridať RainbowKit, wagmi, viem (štandardné EVM knižnice). Celá web3 funkcionalita je **vypnutá by default** cez environment flag `NEXT_PUBLIC_WEB3_ENABLED`. Bez flagu sa žiadna z týchto knižníc ani nenačíta — 99% používateľov ich nikdy neuvidí.

**Deliverable**: `pnpm build` prejde s flagom aj bez. Zero bundle size impact pre non-web3 path.

### W2 — Deploy smart contractu na Base Sepolia testnet
Contract `WattCityMedal.sol` je už **napísaný a staticky otestovaný** (~200 riadkov). Task je len:
1. Nastaviť Hardhat toolchain
2. Spustiť deploy script
3. Overiť na BaseScan (public registry — judges si musia vedieť kliknúť)
4. Zapísať deployed address do dokumentácie

**Blocker**: treba Base Sepolia ETH z faucetu (operator action — klient musí sfundovať deployer wallet z https://www.coinbase.com/faucets/base-ethereum-sepolia-faucet). Ak blocker trvá, fallback je lokálny Hardhat node pre demo.

**Deliverable**: verified contract na BaseScan s linkom v `docs/web3/DEPLOYMENTS.md`.

### W3 — Metadata pre medaily (obrázky + popisy) na IPFS
Pre každý z ~20 achievementov v hre vygenerovať metadata JSON (názov, popis, ikona, attributes) a uploadnúť na IPFS cez NFT.Storage (free-tier).

**Deliverable**: mapping achievement → ipfs:// URI, overiteľné cez verejný IPFS gateway.

### W4 — Mint API endpoint
Serverový endpoint `POST /api/web3/mint` ktorý:
1. Overí session používateľa + CSRF token
2. Overí, že používateľ skutočne má daný achievement (nie je to podvod)
3. Overí rodičovský súhlas (`web3OptIn === true`)
4. Overí že používateľ vlastní peňaženku (cez podpis správy — SIWE protokol)
5. Zavolá `mint()` na deployed kontrakte cez relayer wallet (platí gas za používateľa)
6. Vráti transaction hash + BaseScan link

**Idempotency**: druhý pokus o tú istú medailu vráti "už máte" — nie chybu.
**Guard**: ak má relayer menej ako 0.001 ETH, endpoint vráti 503 namiesto tichého zlyhania.

**Deliverable**: end-to-end curl POST → real transakcia na Sepolia.

### W5 — UI "Moje medale" na profile stránke
Nová sekcia na `/profile` (pod existujúcou V4.6 ParentInviteCard):
- Ak feature flag off → nerenderuje sa
- Ak `web3OptIn !== true` → zobrazí opt-in CTA (pre deti pod 16 dodatok "vyžaduje súhlas rodiča")
- Inak → tlačidlo "Connect Wallet" (RainbowKit)
- Po pripojení → galéria medaili: ikona + názov + BaseScan link + IPFS link
- Pre každý off-chain achievement ktorý používateľ má ale ešte nezamintoval → tlačidlo "Zamintuj medailu"

**Deliverable**: kliknutím sa medaila objaví do 30 sekúnd v galérii aj na BaseScane.

### W6 — Rodičovský súhlas + burn-on-revocation
1. Rozšírenie `profile.onboarding` o pole `web3OptIn: boolean`
2. Pre deti pod 16 rokov: checkbox na `/profile` je **disabled** — aktivuje sa keď rodič klikne "schvaľujem" na svojom `/rodzic` dashboarde
3. Pri zrušení súhlasu (dieťa uncheckne alebo rodič revokuje alebo GDPR Art. 17 request): server automaticky zavolá `burn(tokenId)` pre každú medailu zamintovanú počas platnosti súhlasu

**Deliverable**: test scenár — deaktivácia súhlasu → všetky medaily zmizú z BaseScanu (burned) do 60 sekúnd.

### W7 — Submission package pre judges
1. **`docs/web3/SUBMISSION.md`** — 1 strana pre ETHSilesia judges: problem statement, prečo soulbound, parent-consent story, deployed address, demo URL, GitHub link. Self-contained — judge číta len tento súbor.
2. **README update** — sekcia "Web3 surface" s contract address, BaseScan link, video link
3. **2-min demo video** (klient nahrá): kid path → parent approve → mint → BaseScan

**Deliverable**: judge prečíta SUBMISSION.md (5 minút), pozrie video (2 minúty), klikne 3 linky → rozumie celému pitchu.

## 5. Čo NIE JE v rozsahu (explicit)

| Vylúčené | Prečo |
|---|---|
| Deploy na Base **mainnet** | Nutnosť security auditu (10–20k EUR, ~4 týždne) — post-pilot |
| Paymaster / gasless UX | Phase 8.1.6, nie je pre hackathon pitch potrebné |
| NFT skiny / cosmetics | Explicitne odmietnuté v `docs/decisions/003-web3-scope.md` (spekulatívne) |
| DAO governance / theme voting | Pridáva governance komplexitu, nie je biznis value |
| Cross-chain bridges | Deferred per backlog |
| Secondary marketplace | Soulbound = irrelevantné |
| Multi-wallet support nad rámec RainbowKit defaults | Zbytočná komplikácia |

## 6. Čo potrebujeme od klienta (operator actions)

| Úloha | Kedy | Trvanie |
|---|---|---|
| Sfundovať deployer wallet Base Sepolia ETH z faucetu | Pred W2 | 5 min |
| Vytvoriť NFT.Storage účet + získať API key | Pred W3 | 5 min |
| Vygenerovať alebo dodať WalletConnect Project ID | Pred W1 | 5 min |
| Nastaviť 4 env vars na Vercel (WEB3_CONTRACT_ADDRESS, WEB3_RELAYER_PRIVATE_KEY, NEXT_PUBLIC_WEB3_ENABLED, NEXT_PUBLIC_WEB3_CHAIN_ID) | Po W2 | 10 min |
| Nahrať 2-min demo video na YouTube (unlisted) | Po W5 | 15 min |

**Spolu**: ~30–40 minút pre klienta.

## 7. Časový plán

| Fáza | Čas | Kto |
|---|---|---|
| W1 — deps + flag | 30 min | vývojár |
| W2 — deploy | 60–90 min | vývojár + klient (faucet) |
| W3 — metadata | 45 min | vývojár |
| W4 — mint API | 90 min | vývojár |
| W5 — UI galéria | 120 min | vývojár |
| W6 — parent consent | 60 min | vývojár |
| W7 — submission docs | 60 min | vývojár + klient (video) |
| **Spolu** | **~8 hodín práce** | |

**Odhad s blockerami**: pol dňa (faucet delays, Vercel env propagation).

## 8. Rozpočet

| Položka | Náklad |
|---|---|
| Vývoj (~8h) | per hodinovú sadzbu vývojára |
| Base Sepolia testnet gas | 0 € (zadarmo z faucetu) |
| NFT.Storage hosting | 0 € (free tier do 5 GB) |
| WalletConnect projectId | 0 € (free tier) |
| BaseScan verify | 0 € |
| Demo video hosting (YouTube unlisted) | 0 € |
| **Externé náklady** | **0 €** |

**Pre-mainnet náklady (post-hackathon, ak sa rozhodneme produkčne nasadiť):**
- Security audit kontraktu: 10–20k EUR
- Relayer gas (Base mainnet): ~50–100 €/mesiac
- Bug bounty pool: 500–5000 USD (voliteľné)

## 9. Riziká + zmierňovanie

| Riziko | Pravdepodobnosť | Impact | Zmierňovanie |
|---|---|---|---|
| Faucet nedá dostatok ETH | Stredná | Stredný | Fallback: lokálny Hardhat node, demo na localhost s poznámkou |
| Node 25+ incompatible s Hardhat 2.x | Nízka | Nízky | Swap na Foundry (rýchlejší anyway) |
| NFT.Storage rate-limituje bulk upload | Nízka | Nízky | Upload po jednom s sleepom, alebo data URIs inline |
| Vercel env var propagácia stagne | Nízka | Nízky | Reviewer flipuje flag v preview deploy-i sám |
| Contract deployment revertuje | Veľmi nízka | Stredný | Statické testy zachytili invarianty; constructor args check |
| Demo break počas hackathon pitchu | Nízka | **Vysoký** | Primárny pitch (PKO Gaming) ostáva plne funkčný bez web3; web3 je opt-in bonus slide |

## 10. Akceptačné kritériá (Definition of Done)

Odovzdaná práca bude akceptovaná ak:

- [ ] `pnpm vitest run` zelené — všetkých 635 testov (80 súborov, stav 2026-04-22) vrátane web3 sady
- [ ] `pnpm exec tsc --noEmit` zelené — strict TypeScript
- [ ] `pnpm build` zelené — production build
- [ ] `WattCityMedal` kontrakt deployed + verified na Base Sepolia, link dostupný
- [ ] End-to-end demo: visit `/profile` (ako demo-teacher-pl) → pripojiť Coinbase Smart Wallet → zamintuj medailu → vidieť ju na BaseScan do 30 sekúnd
- [ ] Parent-consent gate funguje: pod 16 bez rodičovského súhlasu **nemôže** zamintovať (HTTP 403)
- [ ] Burn-on-revocation funguje: deaktivácia súhlasu → všetky medaily zmizli z galérie do 60 sekúnd
- [ ] Feature flag `NEXT_PUBLIC_WEB3_ENABLED=false` (default) → žiadny web3 UI visible, bundle size nezvýšený
- [ ] **Demo-polish funkcie (D1–D8) nezregredovali** — PKO pitch flow stále funguje (overí sa smoke testom)
- [ ] `docs/web3/SUBMISSION.md` self-contained — nová osoba to pochopí za 5 minút

## 11. Deliverables (čo sa fyzicky odovzdá)

- **PR** proti `watt-city-demo-polish` branchu (alebo merged do `main`)
- **Verified contract address** na BaseScan — link v PR description
- **Demo video** (2 min, YouTube unlisted) — link v PR description + v `SUBMISSION.md`
- **Dokumentácia** v `docs/web3/`:
  - `DEPLOYMENTS.md` (NEW) — kde je čo deployed
  - `SUBMISSION.md` (NEW) — pre ETHSilesia judges
- **Session summary** v `docs/progress/SESSION-SUMMARY-WEB3.md` — rekapitulácia W1..W7

## 12. Odkazy pre vývojára

Tento brief je **biznis-level**. Technické detaily sú v:

- **`docs/progress/2026-04-19-web3-base-kickoff.md`** — plný technický kickoff so scope, acceptance criteria, hard constraints, failure modes per W-item
- **`docs/web3/PLAN.md`** — architektúra (chain choice, mint flow, wallet UX, paymaster)
- **`docs/web3/DEPLOY.md`** — deployment runbook (Hardhat/Foundry, env vars, key rotation)
- **`docs/decisions/003-web3-scope.md`** — prečo soulbound, prečo Base, prečo nie NFT skiny
- **`contracts/WattCityMedal.sol`** — smart contract zdrojový kód (~200 LOC, statické testy v `contracts/test/`)

## 13. Kontakt

Technické otázky: `docs/progress/2026-04-19-web3-base-kickoff.md` má failure-mode tabuľku pre bežné problémy.

Eskalácia: klient (B2JK Industry).

---

**TL;DR pre projekt manažéra:**

> 8 hodín vývoja, 0 € externých nákladov, kvalifikuje nás na druhý prize track (~3–10k PLN) z toho istého produktu, zakladá "first kid-safe on-chain achievement systém v PL bankovníctve" príbeh pre PKO pitch. Nerozbije existujúcu funkcionalitu — všetko opt-in, default off.
