# My Pantry Pal

My Pantry Pal helps users keep track of what is in their kitchen. I built it with Next.js, TypeScript, Firebase, and Material UI.

## About the project

I started this as a pantry inventory manager, then added authentication and Firestore-backed user data. The goal was to make something practical while getting more comfortable connecting a React frontend to real backend services.

## Features

- Email/password sign up and sign in with Firebase Authentication
- Per-user pantry inventories stored in Cloud Firestore
- Add, edit, delete, search, and merge matching pantry items
- Expiration date and quantity tracking
- Light and dark mode support with a custom MUI theme
- Responsive landing page and authenticated inventory experience

## Tech stack

- **Framework:** Next.js 14, React 18, TypeScript
- **UI:** Material UI, Emotion, MUI Icons
- **Backend:** Next.js API routes
- **Auth and data:** Firebase Authentication, Cloud Firestore
- **AI and media:** OpenAI API for recipe ideas, Pexels API for recipe photos
- **Other dependencies:** Axios, Google Cloud AI Platform package

## Project structure

```text
src/
  components/
    sections/       Landing page sections
    ui/             Sign-in/sign-up modal
  pages/
    api/recipe.ts   Recipe idea and photo endpoint
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

3. Fill in the Firebase values in `.env.local`. Add `OPENAI_API_KEY` for recipe generation and `PEXELS_API_KEY` for real recipe photos.

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
