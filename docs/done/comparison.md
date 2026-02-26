# Project Comparison: Exhibit vs. NIIIFTY

This report compares two projects located in your workspace: `exhibit-so/exhibit` and `NIIIFTY`.

## Overview

- **Exhibit**: A modern, actively maintained Next.js application designed for creating and sharing digital exhibits using IIIF (International Image Interoperability Framework) and other media formats. It has a complex feature set, including extensive custom integrations for IIIF presentation and rendering.
- **NIIIFTY**: An older Next.js application, seemingly originating as a Filecoin/IPFS dev grant project (linked to filecoin-project/devgrants#504). It handles similar overarching ideas but is built on an older stack and appears to have a simpler, more limited scope or was a proof-of-concept.

## Technology Stack Comparison

| Category             | Exhibit (`exhibit-so/exhibit`)               | NIIIFTY                                         |
| :------------------- | :------------------------------------------- | :---------------------------------------------- |
| **Framework**        | Next.js 16 (App Router)                      | Next.js 12/13 (Pages Router)                    |
| **React Version**    | React 19.2.0                                 | React 18.1.0                                    |
| **Styling**          | Tailwind CSS v4, Radix UI Primitives         | Tailwind CSS v3, Headless UI                    |
| **State Management** | Zustand                                      | React Hooks (`react-use`)                       |
| **Form Handling**    | React Hook Form + Zod                        | Formik                                          |
| **Backend/DB**       | Firebase v12 (Firestore, Functions, Storage) | Firebase v9.9.0 (Firestore, Functions, Storage) |
| **Language**         | TypeScript v5.9                              | TypeScript v4.7                                 |
| **Testing**          | Jest, Testing Library                        | None configured in `package.json`               |
| **Email/Comms**      | Resend, SendGrid, Mailchimp                  | None configured                                 |

## Architecture & Structure

### Exhibit

- **Routing**: Uses the modern Next.js App Router (`src/app`), with complex nested routes (`/admin`, `/exhibits`, `/docs`, etc.).
- **IIIF Integration**: Deeply integrates with the IIIF ecosystem using `@iiif/parser`, `@iiif/presentation-3`, and `@iiif/vault-helpers`.
- **Media Viewers**: Uses `openseadragon` for deep-zoom IIIF images and `@google/model-viewer` for 3D models.
- **Infrastructure**: Highly robust setup structure. Includes Firebase emulators, detailed deployment documentation for Firebase App Hosting, and automation scripts (`setup.sh`).

### NIIIFTY

- **Routing**: Uses the older Next.js Pages Router (`src/pages`), with basic routes (`/admin`, `/enter`, `/docs`).
- **Dependencies**: Relies on older versions of libraries (e.g., `react-select`, `react-quill`).
- **Infrastructure**: Standard Next.js + Firebase setup without the extensive tooling and emulators seen in Exhibit.

## Summary

`Exhibit` is clearly the evolution or a significantly more mature and fully-featured product compared to `NIIIFTY`.

`Exhibit` uses state-of-the-art Next.js 16 features (App Router), React 19, Tailwind v4, and comprehensive IIIF libraries for building advanced digital exhibits. `NIIIFTY` appears to be an earlier iteration or a separate, simpler project built on Next.js 12 with the Pages Router and older Firebase SDKs.
