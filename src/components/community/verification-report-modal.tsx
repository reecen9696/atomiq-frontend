/**
 * Verification Report Modal
 * Displays full math verification report details
 */

'use client';

import { X, Check, AlertCircle, BarChart3 } from 'lucide-react';
import type { MathVerificationReport } from '@/types/community-games';

interface VerificationReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  report: MathVerificationReport;
  gameName: string;
}

export function VerificationReportModal({
  isOpen,
  onClose,
  report,
  gameName,
}: VerificationReportModalProps) {
  if (!isOpen) return null;

  const rtpDeviation = Math.abs(report.actualRTP - report.declaredRTP);
  const rtpMatch = rtpDeviation <= 0.02; // Within 2% tolerance

  const securityChecksList = [
    { key: 'noLocalRNG', label: 'No Local RNG' },
    { key: 'noExternalNetwork', label: 'No External Network' },
    { key: 'noEvalUsage', label: 'No Eval Usage' },
    { key: 'noDOMAccess', label: 'No DOM Access' },
    { key: 'cspCompliant', label: 'CSP Compliant' },
    { key: 'dependenciesAudited', label: 'Dependencies Audited' },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm">
      <div className="relative mx-4 w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-lg border border-casino-border bg-casino-bg shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-casino-border bg-casino-card p-6">
          <div>
            <h2 className="text-2xl font-bold text-white">Verification Report</h2>
            <p className="mt-1 text-sm text-white/60">{gameName}</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-sm p-2 text-white/60 transition-colors hover:bg-white/10 hover:text-white"
            aria-label="Close"
          >
            <X size={24} />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Overall Status */}
          <div
            className={`rounded-lg border p-4 ${
              report.passed
                ? 'border-green-500/30 bg-green-500/10'
                : 'border-red-500/30 bg-red-500/10'
            }`}
          >
            <div className="flex items-center gap-3">
              {report.passed ? (
                <Check size={24} className="text-green-400" />
              ) : (
                <AlertCircle size={24} className="text-red-400" />
              )}
              <div>
                <h3
                  className={`text-lg font-semibold ${
                    report.passed ? 'text-green-400' : 'text-red-400'
                  }`}
                >
                  {report.passed ? 'Verification Passed ✓' : 'Verification Failed ✗'}
                </h3>
                <p className="text-sm text-white/60">
                  Verifier Version: {report.verifierVersion} •{' '}
                  {new Date(report.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          </div>

          {/* RTP Analysis */}
          <div className="rounded-lg border border-casino-border bg-casino-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <BarChart3 size={20} className="text-primary-purple" />
              <h3 className="text-lg font-semibold text-white">RTP Analysis</h3>
            </div>

            <div className="space-y-4">
              {/* Simulation Info */}
              <div>
                <p className="text-sm text-white/60">Simulation Rounds</p>
                <p className="text-xl font-bold text-white">
                  {report.simulationRounds.toLocaleString()}
                </p>
              </div>

              {/* RTP Comparison */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-white/60">Declared RTP</p>
                  <p className="text-xl font-bold text-white">
                    {(report.declaredRTP * 100).toFixed(2)}%
                  </p>
                </div>
                <div>
                  <p className="text-sm text-white/60">Actual RTP</p>
                  <p className="text-xl font-bold text-white">
                    {(report.actualRTP * 100).toFixed(2)}%
                  </p>
                </div>
              </div>

              {/* Deviation */}
              <div>
                <p className="text-sm text-white/60">Deviation</p>
                <div className="flex items-center gap-2">
                  <p
                    className={`text-xl font-bold ${
                      rtpMatch ? 'text-green-400' : 'text-yellow-400'
                    }`}
                  >
                    {(rtpDeviation * 100).toFixed(4)}%
                  </p>
                  {rtpMatch && (
                    <span className="text-xs text-green-400">Within tolerance</span>
                  )}
                </div>
              </div>

              {/* Visual RTP Bar */}
              <div>
                <div className="flex justify-between text-xs text-white/60 mb-2">
                  <span>0%</span>
                  <span>100%</span>
                </div>
                <div className="h-8 w-full rounded-sm bg-casino-bg overflow-hidden">
                  <div className="relative h-full">
                    {/* Declared RTP */}
                    <div
                      className="absolute top-0 left-0 h-full bg-primary-purple/30 border-r-2 border-primary-purple"
                      style={{ width: `${report.declaredRTP * 100}%` }}
                    />
                    {/* Actual RTP */}
                    <div
                      className="absolute top-0 left-0 h-full bg-green-500/50"
                      style={{ width: `${report.actualRTP * 100}%` }}
                    />
                  </div>
                </div>
                <div className="mt-1 flex gap-4 text-xs">
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-primary-purple/50" />
                    <span className="text-white/60">Declared</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <div className="h-3 w-3 rounded-sm bg-green-500/50" />
                    <span className="text-white/60">Actual</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Variance Analysis */}
          <div className="rounded-lg border border-casino-border bg-casino-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Variance Analysis</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <p className="text-sm text-white/60">Standard Deviation</p>
                <p className="text-lg font-bold text-white">
                  {report.varianceAnalysis.standardDeviation.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Max Drawdown</p>
                <p className="text-lg font-bold text-white">
                  {report.varianceAnalysis.maxDrawdown.toFixed(2)}
                </p>
              </div>
              <div>
                <p className="text-sm text-white/60">Max Payout Observed</p>
                <p className="text-lg font-bold text-white">
                  {report.maxPayoutObserved}x
                </p>
              </div>
            </div>
          </div>

          {/* Security Checks */}
          <div className="rounded-lg border border-casino-border bg-casino-card p-6">
            <h3 className="mb-4 text-lg font-semibold text-white">Security Checks</h3>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {securityChecksList.map(({ key, label }) => {
                const passed =
                  report.securityChecks[key as keyof typeof report.securityChecks];
                return (
                  <div
                    key={key}
                    className="flex items-center justify-between rounded-sm border border-casino-border bg-casino-bg p-3"
                  >
                    <span className="text-sm text-white/80">{label}</span>
                    {passed ? (
                      <Check size={18} className="text-green-400" />
                    ) : (
                      <X size={18} className="text-red-400" />
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 border-t border-casino-border bg-casino-card p-6">
          <button
            onClick={onClose}
            className="w-full rounded-sm bg-primary-purple py-3 font-semibold text-white transition-colors hover:bg-primary-purple-hover"
          >
            Close Report
          </button>
        </div>
      </div>
    </div>
  );
}
