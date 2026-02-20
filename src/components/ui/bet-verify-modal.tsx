"use client";

import React, { useEffect } from "react";
import Image from "next/image";
import type { LiveBet } from "@/hooks/use-live-bets";

interface Props {
  bet: LiveBet;
  onClose: () => void;
}

function CopyBtn({ text }: { text: string }) {
  const [copied, setCopied] = React.useState(false);
  return (
    <button
      onClick={() =>
        navigator.clipboard.writeText(text).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 1500);
        })
      }
      className="ml-2 shrink-0 text-[11px] text-[#7717ff] hover:text-white transition-colors"
    >
      {copied ? "Copied!" : "Copy"}
    </button>
  );
}

function Row({
  label,
  value,
  copyable,
  mono,
  children,
}: {
  label: string;
  value?: string;
  copyable?: boolean;
  mono?: boolean;
  children?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col gap-1 py-2.5 border-b border-[#1e2938] last:border-0">
      <span className="text-[10px] font-semibold uppercase tracking-wider text-[#828998]">
        {label}
      </span>
      {children ?? (
        <div className="flex items-start justify-between gap-2">
          <span
            className={`text-[12px] text-white break-all leading-relaxed ${mono ? "font-mono" : "font-medium"}`}
          >
            {value || "—"}
          </span>
          {copyable && value && <CopyBtn text={value} />}
        </div>
      )}
    </div>
  );
}

function Section({ label }: { label: string }) {
  return (
    <p className="mt-5 mb-0.5 text-[10px] font-bold uppercase tracking-widest text-[#7717ff]">
      {label}
    </p>
  );
}

function CodeBlock({ children }: { children: string }) {
  return (
    <pre className="mt-1 rounded-md bg-[#0f0e11] border border-[#1e2938] px-3 py-2.5 text-[10px] font-mono text-[#828998] whitespace-pre-wrap leading-relaxed">
      {children}
    </pre>
  );
}

export function BetVerifyModal({ bet, onClose }: Props) {
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onClose]);

  const derivation = (() => {
    switch (bet.gameType) {
      case "Coin Flip":
        return [
          "1. sha256(vrf_proof_bytes) → vrf_output (32 bytes)",
          "2. vrf_output[0] % 2",
          "   0 (even) → Heads",
          "   1 (odd)  → Tails",
          bet.coinResult ? `\nResult:  ${bet.coinResult}` : "",
          bet.playerChoice ? `Chose:   ${bet.playerChoice}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      case "Dice":
        return [
          "1. sha256(vrf_proof_bytes) → vrf_output (32 bytes)",
          "2. u32::from_le_bytes(vrf_output[0..4]) % 100 + 1",
          "   → roll value (1–100)",
          bet.playerChoice ? `\nPlayer choice: ${bet.playerChoice}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      case "Slots":
        return [
          "1. sha256(vrf_proof_bytes) → vrf_output (32 bytes)",
          "2. vrf_output segments → symbol indices for 3×5 grid",
          "3. Evaluate active paylines left → right",
          "4. Sum winning multipliers",
          bet.playerChoice ? `\nPlayer choice: ${bet.playerChoice}` : "",
        ]
          .filter(Boolean)
          .join("\n");
      default:
        return "See blockchain source for derivation algorithm.";
    }
  })();

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/75" />

      {/* Card — matches app design system */}
      <div
        className="relative z-10 flex flex-col w-full max-w-lg max-h-[88vh] rounded-xlg bg-casino-card border border-casino-border shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="shrink-0 flex items-center justify-between px-5 py-4 border-b border-[#1e2938]">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-md bg-[#211f28] flex items-center justify-center overflow-hidden">
              <Image
                src={bet.gameImage}
                alt={bet.gameType}
                width={26}
                height={26}
                className="object-cover rounded-sm"
              />
            </div>
            <div>
              <p className="text-[15px] font-semibold text-white leading-tight">
                Provable Fairness
              </p>
              <p className="text-[12px] text-[#828998]">{bet.gameType}</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium ${
                bet.isWin
                  ? "bg-[#03BD6C]/10 text-[#03BD6C]"
                  : "bg-white/5 text-[#828998]"
              }`}
            >
              <span
                className={`w-1.5 h-1.5 rounded-full ${
                  bet.isWin ? "bg-[#03BD6C]" : "bg-[#828998]"
                }`}
              />
              {bet.isWin ? "Win" : "Loss"}
            </span>

            <button
              onClick={onClose}
              className="w-7 h-7 flex items-center justify-center rounded-md text-[#828998] hover:text-white hover:bg-white/5 transition-colors"
            >
              <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                <path
                  d="M1 1L11 11M11 1L1 11"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                />
              </svg>
            </button>
          </div>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 pb-5">
          {/* ── Transaction ── */}
          <Section label="Transaction" />
          <Row label="Transaction ID" value={bet.txId} copyable mono />
          <Row label="Allowance Nonce" value={bet.allowanceNonce || "—"} mono />
          <Row
            label="Block Height"
            value={bet.blockHeight ? String(bet.blockHeight) : "—"}
          />
          <Row label="Block Hash" value={bet.blockHash} copyable mono />
          <Row
            label="Timestamp (unix s)"
            value={bet.timestamp ? String(bet.timestamp) : "—"}
          />
          {bet.solanaExplorerUrl && (
            <div className="mt-3 mb-1">
              <a
                href={bet.solanaExplorerUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-center gap-2 w-full rounded-xlg bg-[#674AE5] hover:bg-[#8B75F6] transition-colors px-4 py-2.5 text-[13px] font-semibold text-white"
              >
                <svg width="14" height="14" viewBox="0 0 14 14" fill="none">
                  <path d="M5.5 2.5H2.5C1.948 2.5 1.5 2.948 1.5 3.5V11.5C1.5 12.052 1.948 12.5 2.5 12.5H10.5C11.052 12.5 11.5 12.052 11.5 11.5V8.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M8.5 1.5H12.5M12.5 1.5V5.5M12.5 1.5L6.5 7.5" stroke="currentColor" strokeWidth="1.3" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                View on Solscan
              </a>
            </div>
          )}

          {/* ── Bet Details ── */}
          <Section label="Bet Details" />
          <Row label="Player Address" value={bet.playerAddress} copyable mono />
          <Row label="Token" value={bet.token} />
          <Row
            label="Bet Amount"
            value={bet.betAmountRaw > 0 ? `${bet.betAmount} ${bet.token}` : "—"}
          />
          <Row label="Payout" value={`${bet.payout} ${bet.token}`} />
          <Row label="Multiplier" value={bet.multiplier} />

          {/* ── VRF Proof ── */}
          <Section label="VRF Cryptographic Proof" />

          <Row label="Signing Context" value="substrate" mono />

          <Row
            label="Input Message (what was signed)"
            value={bet.vrf.inputMessage}
            copyable={!!bet.vrf.inputMessage}
            mono
          />

          <Row label="Input Message Format">
            <CodeBlock>{`tx-{tx_id}:{game_type}:{player_address}:\n  block_hash:{block_hash},tx:{tx_id},\n  height:{block_height},time:{timestamp}`}</CodeBlock>
          </Row>

          <Row
            label="VRF Proof — schnorrkel signature (96 bytes)"
            value={bet.vrf.vrfProof}
            copyable={!!bet.vrf.vrfProof}
            mono
          />
          <Row
            label="VRF Output — sha256(proof bytes) (32 bytes)"
            value={bet.vrf.vrfOutput}
            copyable={!!bet.vrf.vrfOutput}
            mono
          />
          <Row
            label="Node Public Key (32 bytes)"
            value={bet.vrf.publicKey}
            copyable={!!bet.vrf.publicKey}
            mono
          />

          <Row label="Verification Steps">
            <CodeBlock>{`1. Reconstruct input_message from fields above\n2. schnorrkel::verify(\n     public_key,\n     context  = "substrate",\n     message  = input_message,\n     proof    = vrf_proof_bytes\n   ) → must pass\n3. sha256(vrf_proof_bytes) == vrf_output`}</CodeBlock>
          </Row>

          {/* ── Outcome Derivation ── */}
          <Section label="Outcome Derivation" />
          <Row label={`How ${bet.gameType} result was computed`}>
            <CodeBlock>{derivation}</CodeBlock>
          </Row>
        </div>
      </div>
    </div>
  );
}
