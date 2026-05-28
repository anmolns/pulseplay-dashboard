# PulsePlay Client Dashboard

Next.js 14 client dashboard for the PulsePlay survey panel platform.

## Setup

1. Install dependencies:

```bash
npm install
```

2. Ensure `.env.local` contains:

```
NEXT_PUBLIC_API_URL=http://localhost:8000/api/v1
```

3. Start the PulsePlay API backend on port 8000.

4. Run the dashboard:

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Demo login

- Email: `jonn@inqvita.se`
- Password: `demo1234`

## Features

- Projects list and creation
- Target groups per project with live stats
- Target group detail: overview, profiling, sessions, changelog
- CPI lookup from rate card
- Reports request and listing
