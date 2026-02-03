"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useCallback } from "react";
import { useAuthStore } from "@/stores/auth-store";
import { useWallet } from "@solana/wallet-adapter-react";
import { useBalance } from "@/hooks/useBalance";
import { useVaultBalance } from "@/hooks/useVaultBalance";
import { PlayTimerModal } from "@/components/wallet/play-timer-modal";
import { WalletManageModal } from "@/components/wallet/wallet-manage-modal";
import { walletToast } from "@/lib/toast";

export function TopNavbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isPlayTimerModalOpen, setIsPlayTimerModalOpen] = useState(false);
  const [isWalletManageModalOpen, setIsWalletManageModalOpen] = useState(false);
  const {
    isConnected,
    user,
    isConnecting,
    disconnect: authDisconnect,
    openWalletModal,
  } = useAuthStore();
  const { disconnect: walletDisconnect } = useWallet();
  const { balance, loading: balanceLoading } = useBalance();
  const { vaultBalance, hasVault, loading: vaultLoading } = useVaultBalance();

  // Reset dropdown when connection state changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [isConnected]);

  const formatBalance = useCallback((balance?: number | null) => {
    return balance ? balance.toFixed(9) : "0.000000000";
  }, []);

  const formatAddress = useCallback((publicKey: string) => {
    return `${publicKey.slice(0, 4)}....${publicKey.slice(-4)}`;
  }, []);

  const handleWalletClick = useCallback(() => {
    setIsWalletManageModalOpen(true);
  }, []);

  const handleDropdownEnter = useCallback(() => {
    setIsDropdownOpen(true);
  }, []);

  const handleDropdownLeave = useCallback(() => {
    setIsDropdownOpen(false);
  }, []);

  const handlePlayTimerClick = useCallback(() => {
    setIsPlayTimerModalOpen(true);
    setIsDropdownOpen(false);
  }, []);

  const closePlayTimerModal = useCallback(() => {
    setIsPlayTimerModalOpen(false);
  }, []);

  const closeWalletManageModal = useCallback(() => {
    setIsWalletManageModalOpen(false);
  }, []);

  const handleDisconnect = useCallback(async () => {
    try {
      await walletDisconnect();
      authDisconnect();
      walletToast.disconnected();
      setIsDropdownOpen(false);
    } catch (error) {
      console.error("Failed to disconnect:", error);
    }
  }, [walletDisconnect, authDisconnect]);

  return (
    <header className="sticky top-0 z-50 flex h-18 w-full items-center justify-between border-b border-[#1E2938] bg-[#0F0E11] px-4 sm:px-6 lg:px-10 2xl:px-12">
      <div className="flex items-center gap-3">
        <Link
          href="/"
          className="inline-flex items-center gap-2 text-white/90 hover:opacity-80 transition-opacity"
          aria-label="Go to dashboard"
        >
          <Image
            src="/brand/logo.svg"
            alt="Atomik"
            width={112}
            height={32}
            className="block"
            priority
            style={{ width: "auto", height: "auto" }}
          />
        </Link>
      </div>

      {/* Center Section - Conditional Based on Auth State */}
      <div className="flex items-center gap-3">
        {isConnected ? (
          <>
            {/* Currency Selector - Only when connected AND vault exists */}
            {hasVault && (
              <div className="flex items-center justify-between w-[172px] h-[48px] px-3 border border-[#1E2938] hover:border-[#5C41E1] hover:bg-white/10 rounded-sm transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-2">
                  <Image
                    src="/icons/sol.svg"
                    alt="SOL"
                    width={14}
                    height={14}
                    style={{ width: "auto", height: "auto" }}
                  />
                  <span className="text-[14px] font-normal text-white font-['DM_Sans']">
                    {vaultLoading ? "..." : formatBalance(vaultBalance)}
                  </span>
                </div>
                <Image
                  src="/icons/downArrow.svg"
                  alt="Dropdown"
                  width={16}
                  height={16}
                  style={{ width: "auto", height: "auto" }}
                />
              </div>
            )}

            {/* Wallet Button - Connected State */}
            <button
              onClick={handleWalletClick}
              className="flex items-center gap-1 bg-[#674AE5] hover:bg-[#8B75F6] px-4 py-3 rounded-sm transition-colors duration-200"
            >
              <Image
                src="/icons/wallet.svg"
                alt="Wallet"
                width={18}
                height={18}
              />
              <span className="text-[14px] font-medium text-white">Wallet</span>
            </button>
          </>
        ) : (
          /* Connect Button - Not Connected State */
          <button
            onClick={openWalletModal}
            disabled={isConnecting}
            className="flex items-center gap-1 bg-[#674AE5] hover:bg-[#8B75F6] disabled:opacity-50 disabled:cursor-not-allowed px-4 py-3 rounded-sm transition-colors duration-200"
          >
            <Image
              src="/icons/wallet.svg"
              alt="Connect"
              width={18}
              height={18}
            />
            <span className="text-[14px] font-medium text-white">
              {isConnecting ? "Connecting..." : "Connect"}
            </span>
          </button>
        )}
      </div>

      {/* Right Section - Only when connected AND vault exists */}
      {isConnected && hasVault && (
        <div className="flex items-center gap-3">
          {/* Crown Icon - Only when connected */}
          <div
            className="hidden h-10 w-10 items-center justify-center rounded-full bg-[#211F28] sm:flex"
            aria-hidden
          >
            <Image
              src="/brand/crown.svg"
              alt=""
              width={20}
              height={20}
              className="opacity-95"
              style={{ width: "auto", height: "auto" }}
            />
          </div>

          {/* Profile Menu - Only when connected */}
          <div className="relative">
            <div
              className="relative h-10 w-10 overflow-hidden rounded-full cursor-pointer"
              onMouseEnter={handleDropdownEnter}
              onMouseLeave={handleDropdownLeave}
            >
              <Image
                src="/brand/pfp.png"
                alt="Profile"
                fill
                sizes="40px"
                className="object-cover"
                priority
              />
            </div>

            {/* Dropdown - Updated with real user data */}
            {isDropdownOpen && (
              <div
                className="absolute top-10 right-0 w-58 bg-[#131216] border border-[#1E2938] rounded-md p-4 shadow-lg z-50"
                onMouseEnter={handleDropdownEnter}
                onMouseLeave={handleDropdownLeave}
              >
                {/* User Info Section */}
                <div className="bg-[#211F28] p-4 rounded-sm mb-4">
                  <div className="flex items-center gap-3">
                    <div className="relative w-8 h-8 overflow-hidden rounded-full">
                      <Image
                        src="/brand/pfp.png"
                        alt="Profile"
                        fill
                        sizes="32px"
                        className="object-cover"
                      />
                    </div>
                    <span className="text-white text-[14px]">
                      {user?.publicKey
                        ? formatAddress(user.publicKey)
                        : "Unknown"}
                    </span>
                  </div>
                </div>

                {/* Menu Items */}
                <div className="">
                  <button
                    onClick={handlePlayTimerClick}
                    className="w-full flex items-center gap-3 p-2 py-3 rounded-sm hover:bg-[#211F28] transition-colors"
                  >
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      height="20px"
                      viewBox="0 -960 960 960"
                      width="20px"
                      fill="#FFFFFF"
                    >
                      <path d="M360-840v-80h240v80H360Zm80 440h80v-240h-80v240Zm40 320q-74 0-139.5-28.5T226-186q-49-49-77.5-114.5T120-440q0-74 28.5-139.5T226-694q49-49 114.5-77.5T480-800q62 0 119 20t107 58l56-56 56 56-56 56q38 50 58 107t20 119q0 74-28.5 139.5T734-186q-49 49-114.5 77.5T480-80Z" />
                    </svg>
                    <span className="text-white text-[14px]">Play Session</span>
                  </button>

                  <a
                    href="https://explorer.atomiq.network/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-2 py-3 rounded-sm hover:bg-[#211F28] transition-colors"
                  >
                    <Image
                      src="/icons/faq.svg"
                      alt="FAQ"
                      width={20}
                      height={20}
                    />
                    <span className="text-white text-[14px]">FAQ</span>
                  </a>

                  <button
                    onClick={handleDisconnect}
                    className="w-full flex items-center gap-3 p-2 py-3 rounded-sm hover:bg-[#211F28] transition-colors"
                  >
                    <Image
                      src="/icons/logout.svg"
                      alt="Logout"
                      width={20}
                      height={20}
                    />
                    <span className="text-white text-[14px]">Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Play Timer Modal */}
      <PlayTimerModal
        isOpen={isPlayTimerModalOpen}
        onClose={closePlayTimerModal}
      />

      {/* Wallet Management Modal */}
      <WalletManageModal
        isOpen={isWalletManageModalOpen}
        onClose={closeWalletManageModal}
      />
    </header>
  );
}
