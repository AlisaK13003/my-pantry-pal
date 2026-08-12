# My Pantry Pal

My Pantry Pal is a pantry inventory and recipe idea app built with Next.js, TypeScript, Firebase, Material UI, and OpenAI. Users can sign up, manage pantry items in a persistent Firestore-backed inventory, track quantities and expiration dates, and generate recipe ideas from the ingredients they already have.

## Why this project matters

This project is more than a starter Next.js app. It demonstrates a full-stack React workflow with authentication, cloud persistence, authenticated user data modeling, API routes, third-party AI integration, and a polished Material UI interface.

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

## Environment variables

Firebase web app configuration is safe to expose to the browser, but keeping it in environment variables makes the project easier to configure across local, preview, and production environments.

```text
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=
NEXT_PUBLIC_FIREBASE_APP_ID=
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=
OPENAI_API_KEY=
```

## Firestore data model

User data is organized under each Firebase Auth user:

```text
users/{uid}
  email
  createdAt

users/{uid}/inventory/{itemId}
  date
  type
  quantity
  updatedAt
```

Recommended Firestore security posture:

- Users should only be able to read and write their own `users/{uid}` document.
- Users should only be able to read and write inventory documents under their own UID.
- The OpenAI API key should remain server-only in `.env.local` and should never be exposed with a `NEXT_PUBLIC_` prefix.

Example rule shape:

```js
rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;

      match /inventory/{itemId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

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
