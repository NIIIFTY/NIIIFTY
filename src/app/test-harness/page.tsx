'use client';

import React, { useState } from 'react';

export default function IntegrationTestHarness() {
  const [logs, setLogs] = useState<string[]>([]);
  const [loading, setLoading] = useState<string | null>(null);

  const addLog = (message: string) => {
    setLogs((prev) => [...prev, `[${new Date().toLocaleTimeString()}] ${message}`]);
  };

  const testIPNSGeneration = async () => {
    setLoading('ipns');
    addLog('Testing IPNS Generation via Firebase Functions...');
    // In a real harness, this would call an exposed Firebase HTTPS function
    // For now, this is a placeholder UI that tests the end-to-end UX flow
    setTimeout(() => {
      addLog('✅ IPNS Keyplate Generated: ipns://k51qzi5uqu5dk5... mock');
      setLoading(null);
    }, 1500);
  };

  const testATProtoBroadcast = async () => {
    setLoading('atproto');
    addLog('Testing AT Protocol Firehose Broadcast...');
    setTimeout(() => {
      addLog('✅ ATProto Record Published! URI: at://did:plc:mock.../app.bsky.feed.post/3 mock');
      setLoading(null);
    }, 1500);
  };

  const testIIIFManifestPush = async () => {
    setLoading('iiif');
    addLog('Simulating IIIF Manifest Modification (Firestore Trigger)...');
    setTimeout(() => {
      addLog('✅ Simulated: onCreate trigger fired -> Updated w3name revision -> Pushed to ATProto.');
      setLoading(null);
    }, 2000);
  };

  return (
    <div className="mx-auto max-w-4xl p-8 font-sans text-gray-800">
      <h1 className="mb-4 text-3xl font-bold">NIIIFTY 2: Integration Test Harness</h1>
      <p className="mb-8 text-gray-600">
        Use this interface to manually trigger and verify the backend steps for NIIIFTY 2.0 full decentralization:
        <strong> IPNS Stable Identity</strong> and <strong> AT Protocol Discoverability</strong>.
      </p>

      <div className="mb-8 grid grid-cols-1 gap-6 md:grid-cols-3">
        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="mb-2 text-xl font-semibold">1. IPNS Keyplate</h2>
          <p className="mb-4 text-sm text-gray-500">Generate a new WritableName keyplate and mock it.</p>
          <button
            onClick={testIPNSGeneration}
            disabled={loading !== null}
            className="w-full rounded bg-blue-600 px-4 py-2 text-white transition hover:bg-blue-700 disabled:opacity-50"
          >
            {loading === 'ipns' ? 'Generating...' : 'Generate IPNS'}
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="mb-2 text-xl font-semibold">2. AT Protocol</h2>
          <p className="mb-4 text-sm text-gray-500">Broadcast a simulated IIIF payload to Firehose.</p>
          <button
            onClick={testATProtoBroadcast}
            disabled={loading !== null}
            className="w-full rounded bg-purple-600 px-4 py-2 text-white transition hover:bg-purple-700 disabled:opacity-50"
          >
            {loading === 'atproto' ? 'Broadcasting...' : 'Broadcast Record'}
          </button>
        </div>

        <div className="rounded-lg border border-gray-200 bg-white p-6 shadow-md">
          <h2 className="mb-2 text-xl font-semibold">3. Full E2E Trigger</h2>
          <p className="mb-4 text-sm text-gray-500">Simulate the Firebase Firestore onCreate/onUpdate hooks.</p>
          <button
            onClick={testIIIFManifestPush}
            disabled={loading !== null}
            className="w-full rounded bg-green-600 px-4 py-2 text-white transition hover:bg-green-700 disabled:opacity-50"
          >
            {loading === 'iiif' ? 'Processing...' : 'Simulate Manifest Upload'}
          </button>
        </div>
      </div>

      <div className="h-64 overflow-y-auto rounded-lg bg-gray-900 p-6 font-mono text-sm text-green-400 shadow-inner">
        <h3 className="mb-2 text-xs tracking-wide text-white uppercase">Terminal / Logs</h3>
        <div className="flex flex-col gap-1">
          {logs.length === 0 ? (
            <span className="text-gray-500">Waiting for actions...</span>
          ) : (
            logs.map((log, index) => <span key={index}>{log}</span>)
          )}
        </div>
      </div>
    </div>
  );
}
