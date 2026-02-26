# NIIIFTY Upgrade Plan

The aim of this structural upgrade is to modernize the `NIIIFTY` repository so its tech stack entirely mirrors `exhibit` while **adding no new functionality**. This includes migrating to the Next.js App Router, updating Firebase SDKs, switching to modern React state management/form handling libraries, and ensuring the app can be deployed to Firebase App Hosting.

## 🌟 Core Guiding Principle: "Copy Over, Don't Recreate"

**CRITICAL INSTRUCTION**: Do not invent new solutions for this upgrade. The primary goal is to align with the `exhibit` repository perfectly. Whenever configuring a new tool (e.g., Tailwind v4, Zustand, React Hook Form, Firebase SDKs), look at how `exhibit` has implemented it and copy their code, configuration files, and architectural patterns directly into `niiifty`.

---

## Tech Stack Target

| Category             | Current (`niiifty`)                      | Target (`exhibit` equivalent) |
| :------------------- | :--------------------------------------- | :---------------------------- |
| **Framework**        | Next.js 12/13 (Pages Router)             | Next.js 16 (App Router)       |
| **React Version**    | React 18                                 | React 19                      |
| **Styling**          | Tailwind CSS v3                          | Tailwind CSS v4               |
| **Forms/Validation** | Formik                                   | React Hook Form + Zod         |
| **State Management** | React Context + hooks (`react-use`)      | Zustand + Server Components   |
| **Firebase SDK**     | Firebase v9                              | Firebase v12                  |
| **Cloud Functions**  | JavaScript (Node 18)                     | TypeScript (Node 20)          |
| **Hosting target**   | Firebase Hosting (Static export assumed) | Firebase App Hosting          |

---

## 🏗️ Phase 1: Core Framework & Typescript Defaults Upgrade

**Goal:** Establish the new foundation by copying configuration files and updating NIIIFTY's existing dependencies to match `exhibit`'s versions. **Do NOT bulk-copy `exhibit/package.json`** as this would introduce unwanted feature bloat (e.g., 3D viewers, Mailchimp).

1. **Targeted Dependency Updates**: Update NIIIFTY's _existing_ dependencies (Next.js, React, Tailwind, Firebase) to the exact versions specified in `exhibit/package.json`. Add _only_ the new structural tools required by the stack (Zustand, React Hook Form, Zod).
2. **TypeScript & Configs**: Copy the structural configuration files verbatim from `exhibit`: `tsconfig.json`, `eslint.config.mjs`, `.prettierrc`, `postcss.config.mjs`, `next.config.ts`, `components.json`, `next-env.d.ts`, and `global.d.ts`.
3. **Tailwind Migration**: Copy `exhibit`'s `src/app/globals.css` and `src/app/docs.css` directly to replace `niiifty`'s old Tailwind v3 setup. Adopt Radix UI primitives exactly as they appear in `exhibit`. Remove the legacy `tailwind.config.js` and `postcss.config.js`.

---

## ⚡️ Phase 2: Firebase SDK Migration

**Goal:** Modernize database interactions by copying `exhibit`'s implementations.

1. **Client SDK Update**: Bump `firebase` from `v9` to `v12`. Rip out `niiifty`'s old `lib/firebase.ts` entirely and copy `exhibit`'s initialization, environment config wrappers, and module usage exactly.
2. **Firebase Rules**: Overwrite the existing `firestore.rules` and `storage.rules` with the structures found in `exhibit`, carefully modifying only what is strictly necessary to retain NIIIFTY's data integrity.

---

## ☁️ Phase 3: Cloud Functions TypeScript Rewrite

**Goal:** Transition the `functions/` directory to strictly typed TypeScript on Node 20.

1. **Node Runtime**: Change `functions/package.json` engines to `{ "node": "20" }`.
2. **TypeScript Init**: Run `npx tsc --init` in the functions directory. Install `typescript` and `@types/node` as dev dependencies.
3. **Rewrite & Refactor**:
   - Rename existing `.js` files to `.ts`.
   - Implement strict type interfaces for all HTTP request payloads, Firestore triggers, and background tasks.
   - Refactor imports to standard TS behavior (e.g. `import * as admin from 'firebase-admin'`).
4. **Firebase Functions SDK**: Upgrade `firebase-functions` and `firebase-admin` to their latest versions matching `exhibit`. Ensure the use of Firebase Functions v2 API.

---

## 🗂️ Phase 4: App Router Migration (`src/pages` -> `src/app`)

**Goal:** Incrementally adopt the React Server Components paradigm.

1. **Directory Setup**: Create a new `src/app` directory alongside `src/pages`.
2. **Root Layout**: Create `src/app/layout.tsx` to handle the global HTML headers, contexts, and providers that previously lived in `src/pages/_app.tsx` and `src/pages/_document.tsx`.
3. **Page by Page Rewrite**: Move each page route (e.g., `src/pages/index.tsx` to `src/app/page.tsx`).
   - Convert data fetching logic: Move `getServerSideProps` / `getStaticProps` into Server Component async data fetching inside `page.tsx`.
   - Preserve interactivity by nesting "Client Components" inside "Server Components" where hooks are needed (`'use client'`).

---

## 📝 Phase 5: Form & Component Library Refactoring

**Goal:** Swap out deprecated tools for the target stack across the UI, copying patterns from `exhibit`.

1. **Forms**: Strip out `Formik`. Introduce `react-hook-form` and `zod`. Find similar forms in the `exhibit` codebase and copy their Hook Form implementation and styling patterns directly.
2. **State Management**: Replace generic layout context and convoluted `react-use` state hooks with `Zustand` stores. Map the needed state to the exact same store patterns and architecture used across `/src/store` in `exhibit`.

---

## 🧪 Phase 6: Local Development & Testing

**Goal:** Establish a fast, robust local development environment mirroring Exhibit's emulator setup.

1. **Firebase Emulators Setup**: Copy the exact `firebase.json` emulator configurations from `exhibit`.
2. **Environment Variables**: Adopt `exhibit`'s `NEXT_PUBLIC_USE_FIREBASE_EMULATORS` pattern.
3. **Testing Scripts**: Copy package.json scripts (`pnpm emulate`) from `exhibit` directly.

---

## 🚀 Phase 7: Firebase App Hosting Integration

**Goal:** Ensure the project can be seamlessly built and deployed on Firebase's new Next.js-native App Hosting.

1. **Configuration**: Create `apphosting.yaml` in the root configuring the Node 20 runtime and required environments.
2. **Build Verification**: Run `next build` to ensure all static and server pages build perfectly. Verify no memory leaks or circular dependancies.
3. **Deploy**: Setup App Hosting via the Firebase Console pointing to the main git branch and test the deployment.
