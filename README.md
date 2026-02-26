# NIIIFTY

## Local Development

You can run the full NIIIFTY stack locally using `pnpm`.

1. **Start the Firebase Emulators**
   This will spin up local versions of Firestore, Cloud Functions, Auth, Storage, and Hosting. The Emulator UI will be available at [http://127.0.0.1:4000](http://127.0.0.1:4000).

   ```bash
   pnpm emulate
   ```

2. **Start the Next.js Development Server**
   This will start the frontend web application.
   ```bash
   pnpm dev
   ```

## Storacha Network Setup

To deploy the functions or run full integration tests, you need a decentralized NIIIFTY Space registered on the Storacha network.

1. **Install the CLI and Authenticate**

   ```bash
   npm install -g @storacha/cli
   w3 login <your_email@domain.com>
   ```

2. **Provision a New Space**

   ```bash
   # Create a space (you will be prompted to backup a recovery phrase)
   w3 space create "NIIIFTY Production"
   ```

3. **Generate a Headless Sub-Agent Key**
   Run the helper script to create an Ed25519 identity for your backend. Note the `KEY_STRING` output.

   ```bash
   cd functions && node generate-key.js
   ```

4. **Delegate Capabilities to the Sub-Agent**
   Using the `DID:` output from Step 3, generate a wildcard delegation proof for the new identity.

   ```bash
   w3 delegation create <DID_STRING> -o proof.ucan
   ```

5. **Update Environment**
   Run the injection script to automatically parse the `proof.ucan` blob and update your `.env` variables with the base64 encoded capability.
   ```bash
   node inject-proof.js
   ```
   Finally, copy the `KEY_STRING` from Step 3 into your `.env` as `STORACHA_KEY`.

> [!WARNING]
> **Preserve in your Password Manager!**
> You must securely save the 24-word **Space Recovery Phrase** generated in Step 2. You should also backup the exact base64 strings for `STORACHA_KEY` and `STORACHA_PROOF` from your `.env` file since they cannot be recovered easily if lost.
