# Sailing Events frontend

## Maanduitvragen en Mijn planning testen

Beide repositories gebruiken de branch `feature/monthly-invites-planning`.
Deze lokale werkmap staat in `sailing-events-local/feature-planning/`; de oorspronkelijke frontend en backend blijven op hun eigen branch.

Start de demo-backend in een terminal vanuit `feature-planning/backend`:

```powershell
../../backend/venv/Scripts/python.exe run_planning_demo.py
```

De demo gebruikt een eigen `planning-demo.db` met fictieve personen en events.
Alle e-mails (ook bestaande bevestigingsmails) worden onderschept en als HTML in
`feature-planning/backend/preview-mails` opgeslagen. Er wordt geen externe e-mail verstuurd.
Een nieuwe clone kan hiervoor een eigen virtualenv met `requirements.txt` gebruiken.

Start de frontend in een tweede terminal vanuit `feature-planning/frontend`:

```powershell
$env:VITE_API_URL='http://localhost:8001'
npm run dev -- --host 127.0.0.1 --port 5174 --strictPort
```

De lokale werkmap hergebruikt de bestaande `node_modules`. Voer op een nieuwe clone eerst `npm ci` uit.

1. Open `http://localhost:5174`, log in met `admin` / `planning-demo` en kies **Maanduitvragen**.
2. Selecteer een maand met demo-events, kies personen en rollen per event en klik **Uitvraag voorbereiden**.
3. Controleer de persoonlijke overzichten. Klik **Verstuur de persoonlijke mails**. Eén bestand per schipper verschijnt in `preview-mails`.
4. Open een HTML-mail lokaal en volg de link naar **Mijn planning**. Klik op **Mijn planning openen** om de eenmalige link te gebruiken.
5. Geef voor meerdere events Ja / Misschien / Nee door en sla de antwoorden op.
6. Bevestig een beschikbare schipper in het bestaande eventscherm. Na vernieuwen staat de opdracht bij **Definitief ingepland**.
7. Controleer ook de afmeldknop en de melding voor de planner. Een afmelding verwijdert de bevestigde indeling niet.
8. Via `http://localhost:5174/mijn-planning` kun je een nieuwe inloglink aanvragen voor `anna@example.com` of `bram@example.com`. Ook die mail verschijnt lokaal.

De demo onthoudt wijzigingen. Een voorbereide, nog niet verzonden bundel kan in het scherm worden verwijderd en opnieuw samengesteld.

### Werking en grenzen van deze eerste versie

- Maanduitvragen worden bewust handmatig voorbereid en verstuurd; aanvullingen kunnen in een nieuwe bundel.
- Een inloglink is 30 minuten geldig en eenmalig. De schipperssessie duurt 30 dagen en gebruikt een eigen httpOnly-cookie.
- Persoonlijke gegevens, interne notities en tarieven van andere schippers worden niet meegestuurd naar Mijn planning.
- Bestaande losse eventmails bevatten ook een link naar het vaste adres van Mijn planning; daar kan de schipper zo nodig een inloglink aanvragen.
- Het bestaande endpoint `POST /api/events/send-reminders` verstuurt nu gebundelde herinneringen per schipper. Het respecteert de bestaande instellingen; een bestaande scheduler of handmatige aanroep blijft nodig.
- Verzending wordt per persoonlijke mail geregistreerd. Een dubbelklik verstuurt een succesvolle mail niet opnieuw. Bij een onzekere providerfout of onderbroken verzending blijft de bundel zichtbaar met **Controle nodig** / **Verzending gestart**; controleer Resend voordat je handmatig herstelt. Alleen fouten vóór verzending kunnen via dezelfde knop opnieuw worden geprobeerd.
- De backend maakt extra tabellen bij het opstarten. Testen gebeurt met SQLite; productie/PostgreSQL en echte e-mailbezorging moeten vóór ingebruikname nog gecontroleerd worden.
- Frontend en backend moeten samen worden uitgerold. Gebruik in productie HTTPS en consistente `FRONTEND_URL`, `CORS_ORIGINS` en `VITE_API_URL`. Een frontend en API op hetzelfde site-domein voorkomen afhankelijkheid van third-party cookies.

### Validatie

Backend vanuit de backendwerkmap:

```powershell
$env:DATABASE_URL='sqlite:///:memory:'
../../backend/venv/Scripts/python.exe -m pytest tests/test_planning.py -q
```

Frontend: `npm run build`. De nieuwe pagina's en API-client zijn afzonderlijk met ESLint gecontroleerd.
Een volledige lokale API-flow met onderschepte mails is getest. Visuele browsercontrole is nog nodig.

## Vite template reference

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:

- [@vitejs/plugin-react](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react) uses [Babel](https://babeljs.io/) (or [oxc](https://oxc.rs) when used in [rolldown-vite](https://vite.dev/guide/rolldown)) for Fast Refresh
- [@vitejs/plugin-react-swc](https://github.com/vitejs/vite-plugin-react/blob/main/packages/plugin-react-swc) uses [SWC](https://swc.rs/) for Fast Refresh

## React Compiler

The React Compiler is not enabled on this template because of its impact on dev & build performances. To add it, see [this documentation](https://react.dev/learn/react-compiler/installation).

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```
