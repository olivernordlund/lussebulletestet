# 🟠 Lussebulletestet

Blindtest av 8 lussebullar. Gästerna röstar i mobilen på **utseende, smak och konsistens** (1–10) och gissar vilken bulle det är. Resultatet visas på en stor skärm när du avslöjar det.

| Sida | Vem | Vad |
|---|---|---|
| `/` | Gästerna (mobil) | Skriv namn, betygsätt bulle 1–8, gissa vilken det är |
| `/resultat` | Storskärm / TV | Visar antal röster live, sedan avslöjande plats 8 → 1, facit och bästa gissare |
| `/admin` | Du | Fyll i alternativ och facit, avslöja, nollställ |

**Betyg:** snitt utseende + snitt smak + snitt konsistens = max 30 poäng. Lika poäng avgörs på smak.

---

## Publicera (ca 10 min)

### 1. Lägg upp på GitHub
```bash
cd lussebulletest
git init && git add . && git commit -m "Lussebulletestet"
gh repo create lussebulletest --private --source=. --push
```
(eller skapa ett tomt repo på github.com och följ instruktionerna där)

### 2. Importera i Vercel
1. Gå till [vercel.com/new](https://vercel.com/new) och välj repot. Next.js upptäcks automatiskt – klicka **Deploy**.

### 3. Koppla databasen (Upstash Redis – gratis)
1. I projektet på Vercel: **Storage** → **Create Database** → välj **Upstash → Redis** (Marketplace).
2. Välj gratisplanen och koppla den till projektet. Vercel lägger då automatiskt till `KV_REST_API_URL` och `KV_REST_API_TOKEN`.

### 4. Sätt admin-lösenord
**Settings → Environment Variables** → lägg till `ADMIN_PASSWORD` med valfritt lösenord. (Utan den är lösenordet `lussekatt`.)

### 5. Deploya om
**Deployments** → ⋯ → **Redeploy**, så att variablerna kommer med.

---

## Under kvällen

1. **Före:** gå till `/admin`, skriv in de 8 alternativen (t.ex. bagerier/butiker) och fyll i facit. Spara.
   *Ändra inte ordningen på alternativen efter att folk börjat rösta – gissningarna sparas per position.*
2. Numrera bullarna 1–8 och dela länken till startsidan (t.ex. som QR-kod).
3. Öppna `/resultat` på TV:n – den visar hur många som röstat per bulle.
4. Gästerna kan ändra sina betyg ända tills du avslöjar.
5. Tryck **🎉 Avslöja resultatet** i admin. Röstningen stängs.
6. På resultatskärmen: klicka / mellanslag / → för att avslöja plats 8, 7, … 1 och sist facit + bästa gissare. ← backar, "Visa allt" hoppar till slutet.

Vill du köra igen nästa år: **Radera alla röster** i admin.

## Köra lokalt
```bash
npm install
npm run dev
```
Utan Redis-variabler sparas rösterna i minnet (fungerar lokalt men inte på Vercel). Lägg in variablerna i `.env.local` för att testa mot riktig databas.
