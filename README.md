# My Pantry Pal

My Pantry Pal helps users keep track of what is in their kitchen and get recipe ideas from ingredients they already have. I built it with Next.js, TypeScript, Firebase, Material UI, and the OpenAI API.

## About the project

I started this as a pantry inventory manager, then added authentication, Firestore-backed user data, and an API route that asks OpenAI for recipe ideas based on the current pantry list. The goal was to make something practical while getting more comfortable connecting a React frontend to real backend services.

## Features

- Email/password sign up and sign in with Firebase Authentication
- Per-user pantry inventories stored in Cloud Firestore
- Add, edit, delete, search, and merge matching pantry items
- Expiration date and quantity tracking
- OpenAI-powered recipe generation from the current pantry
- Light and dark mode support with a custom MUI theme
- Responsive landing page and authenticated inventory experience

## Tech stack

- **Framework:** Next.js 14, React 18, TypeScript
- **UI:** Material UI, Emotion, MUI Icons
- **Backend:** Next.js API routes
- **Auth and data:** Firebase Authentication, Cloud Firestore
- **AI:** OpenAI API
- **Other dependencies:** Axios, Google Cloud AI Platform package

## Project structure

```text
src/
  components/
    sections/       Landing page sections
    ui/             Sign-in/sign-up modal
  pages/
    api/recipe.ts   OpenAI recipe-generation endpoint
    index.tsx       Marketing/landing page
    inventory.tsx   Authenticated pantry inventory UI
  styles/           Global CSS and MUI theme
  firebase.ts       Firebase client setup and inventory data helpers
```

## Getting started

1. Install dependencies.

```bash
npm install
```

2. Create a local environment file.

```bash
cp .env.example .env.local
```

3. Fill in the Firebase and OpenAI values in `.env.local`.

4. Start the development server.

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000).

## Available scripts

```bash
npm run dev
npm run build
npm run start
npm run lint
```

## Future improvements

- Persist generated recipe history per user
- Add image upload or camera-based item entry
- Store item units in Firestore instead of defaulting to `units`
- Add stricter form validation and loading/error states
- Add automated tests for inventory helpers and the recipe API route
