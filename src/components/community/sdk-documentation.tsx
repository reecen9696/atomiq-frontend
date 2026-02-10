/**
 * SDK Documentation Component
 * Displays SDK endpoints and usage examples for developers
 */

'use client';

import { Code, Copy, Check } from 'lucide-react';
import { useState } from 'react';
import { SDK_ENDPOINTS } from '@/sdk/community-game-sdk';

export function SDKDocumentation() {
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);

  const handleCopy = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-lg border border-casino-border bg-casino-card p-6">
        <div className="mb-4 flex items-center gap-2">
          <Code size={20} className="text-primary-purple" />
          <h2 className="text-2xl font-bold text-white">SDK Reference</h2>
        </div>
        <p className="text-white/70">
          Use these SDK methods to interact with the Atomiq platform. All randomness
          must come from the platform's VRF system.
        </p>
      </div>

      {SDK_ENDPOINTS.map((endpoint, index) => (
        <div
          key={endpoint.name}
          className="rounded-lg border border-casino-border bg-casino-card p-6"
        >
          <div className="mb-4">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="text-xl font-semibold text-white">{endpoint.name}</h3>
              <span className="rounded-sm bg-primary-purple/20 px-2 py-0.5 text-xs font-medium text-primary-purple">
                {endpoint.method}
              </span>
            </div>
            <p className="text-white/70">{endpoint.description}</p>
          </div>

          {/* Parameters */}
          {endpoint.parameters.length > 0 && (
            <div className="mb-4">
              <h4 className="mb-2 text-sm font-semibold text-white">Parameters</h4>
              <div className="space-y-2">
                {endpoint.parameters.map((param) => (
                  <div
                    key={param.name}
                    className="rounded-sm border border-casino-border bg-casino-bg p-3"
                  >
                    <div className="mb-1 flex items-center gap-2">
                      <code className="text-sm font-mono text-primary-purple">
                        {param.name}
                      </code>
                      <span className="text-xs text-white/60">{param.type}</span>
                      {param.required && (
                        <span className="rounded-sm bg-red-500/20 px-1.5 py-0.5 text-xs text-red-400">
                          Required
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-white/60">{param.description}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Returns */}
          <div className="mb-4">
            <h4 className="mb-2 text-sm font-semibold text-white">Returns</h4>
            <code className="text-sm text-primary-purple">{endpoint.returns}</code>
          </div>

          {/* Example */}
          <div>
            <div className="mb-2 flex items-center justify-between">
              <h4 className="text-sm font-semibold text-white">Example</h4>
              <button
                onClick={() => handleCopy(endpoint.example, index)}
                className="flex items-center gap-1 rounded-sm bg-casino-bg px-2 py-1 text-xs text-white/70 transition-colors hover:bg-white/5"
              >
                {copiedIndex === index ? (
                  <>
                    <Check size={14} />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy size={14} />
                    <span>Copy</span>
                  </>
                )}
              </button>
            </div>
            <pre className="overflow-x-auto rounded-sm bg-casino-bg p-4">
              <code className="text-sm text-green-400">{endpoint.example}</code>
            </pre>
          </div>
        </div>
      ))}
    </div>
  );
}
