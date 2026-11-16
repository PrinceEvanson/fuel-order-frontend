# Fuel Order Desk - Frontend

The web interface for the Fuel Order Automation demo. Clients upload fuel purchase-order PDFs, an AI reads them, and reviewers check, correct and approve each order before it is posted to Sage Accounting as a sales quote.

This repository is the React frontend. It needs the companion backend repository (`fuel-order-backend`) to run.

## What the app does

Two roles, two completely different dashboards.

**Client portal**
- Drop, browse for or paste a purchase-order PDF.
- See a preview of the PDF next to what the AI extracted (customer, PO number, date, address, currency, lines, totals) and any problems it found.
- Either send the document to the review team, discard it, or ask for a redo and say what went wrong (wrong customer, wrong quantity or price, unreadable scan and so on). That feedback is passed to the AI for the next attempt.
- Follow the status of every submission: awaiting review, posted to Sage, or rejected with the reviewer's reason.

**Reviewer desk**
- A searchable queue split into All pending, Passed AI check, Flagged, Posted to Sage and Rejected.
- Opening a document slides a review panel in from the right while the list shrinks to a compact column.
- Documents the AI has not read yet are read automatically (several at once), with a step-by-step loading sequence before the extracted data appears.
- Four tabs per document: Checks (flags), Details (editable fields and Sage customer and product matches), Currency and units, History (audit log).
- Currency and units: the AI detects the document's currency and units. The reviewer can view the values in another currency, volume unit or weight unit. Conversion runs in the browser with animated number changes. It is display only; the quote posted to Sage keeps the document's own values.
- Approve and post to Sage (blocked while there are errors, and when there are warnings the reviewer must tick "I have reviewed the warnings", offered for fewer than 5 warnings), reject with a required reason, or re-read the document with the AI.
- A Sage notice under the user's name in the navbar shows whether Sage is connected, with a Connect button.

## Tech stack

- React 18 with React Router 6
- Vite 5
- Tailwind CSS 4 (`@tailwindcss/vite`), with the navy and jungle-green palette defined in `src/index.css`
- JWT authentication: the token is stored in `localStorage` and sent as a Bearer header; routes are protected by role (client or reviewer)
- Plain `fetch` through a small API wrapper in `src/lib/api.js`
- No UI library, no state library

## Project structure

```
src/
  App.jsx                      routes and role-based guards
  main.jsx
  index.css                    Tailwind import, theme colours, animations
  context/AuthContext.jsx      login, signup, logout, current user
  lib/
    api.js                     all backend calls
    metrics.js                 currency and unit tables and conversion maths
    useAnalysis.js             automatic AI reading queue for the reviewer
  pages/
    LoginPage.jsx
    SignupPage.jsx
    ClientDashboard.jsx
    ReviewerDashboard.jsx
  components/
    auth/                      login and signup forms, layout, route guard
    client/                    upload zone, scan preview, redo panel, submissions
    reviewer/                  queue, review screen, form, metrics, audit, Sage notice
    common/                    app shell, PDF viewer, flags, pills, animated number
```

## Getting started

Requirements: Node.js 18 or newer, and the backend running on port 8000.

```bash
npm install
npm run dev
```

The dev server runs on the port set in `vite.config.js` and proxies every `/api` request to `http://localhost:8000`, so no environment variable is needed locally. Open the address Vite prints, for example `http://localhost:5174`.

Make sure the backend `.env` allows that origin in `ALLOWED_ORIGINS` and uses it for `FRONTEND_URL`.

### Environment variable

| Name | Purpose |
| --- | --- |
| `VITE_API_URL` | Base URL of the backend. Leave empty locally (the proxy is used). Set it in production if the backend is on another domain. |

### Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Start the development server |
| `npm run build` | Build for production into `dist/` |
| `npm run preview` | Serve the production build locally |

## How to use it

1. Start the backend, then `npm run dev`.
2. Open the site and sign in with a demo account from the backend `.env` (`SEED_CLIENT_EMAIL` and `SEED_REVIEWER_EMAIL`), or choose Create an account. Reviewer sign-up needs the invite code set in the backend `.env` as `REVIEWER_INVITE_CODE`.
3. As a client, upload a PDF, check the preview and send it to review.
4. As a reviewer, open a document from the queue, read the Checks tab, fix anything in Details, optionally compare values in the Currency and units tab, then approve or reject.
5. To post for real, click Connect in the navbar to link Sage Accounting (see the backend README).

## Deployment

The repository includes a `vercel.json` that rewrites every route to `index.html` for client-side routing. Set `VITE_API_URL` to the deployed backend URL. The backend limits uploads to 4 MB on Vercel.

## Troubleshooting

- Blank page: check that the `src` folder exists and the terminal running `npm run dev` shows no red errors.
- Sign-in fails with 401: wrong email or password for that account.
- Network errors on every call: the backend is not running on port 8000.
- After connecting Sage you land on the wrong port: set `FRONTEND_URL` in the backend `.env` to the address shown by Vite.