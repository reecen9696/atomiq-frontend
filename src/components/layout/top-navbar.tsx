"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { useAuthStore } from "@/stores/auth-store";

export function TopNavbar() {
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const { isConnected, user, isConnecting, disconnect, openWalletModal } =
    useAuthStore();

  // Reset dropdown when connection state changes
  useEffect(() => {
    setIsDropdownOpen(false);
  }, [isConnected]);

  const formatBalance = (balance?: number) => {
    return balance ? balance.toFixed(9) : "0.000000000";
  };

  const formatAddress = (publicKey: string) => {
    return `${publicKey.slice(0, 4)}....${publicKey.slice(-4)}`;
  };
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
            {/* Currency Selector - Only when connected */}
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
                  {formatBalance(user?.balance)}
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

            {/* Wallet Button - Connected State */}
            <button className="flex items-center gap-1 bg-[#674AE5] hover:bg-[#8B75F6] px-4 py-3 rounded-sm transition-colors duration-200">
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

      {/* Right Section - Only when connected */}
      {isConnected && (
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
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
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
                onMouseEnter={() => setIsDropdownOpen(true)}
                onMouseLeave={() => setIsDropdownOpen(false)}
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
                  <a
                    href="https://explorer.atomiq.network/about"
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full flex items-center gap-3 p-2 rounded-md hover:bg-white/10 transition-colors"
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
                    onClick={disconnect}
                    className="w-full flex items-center gap-3 p-2 py-4 rounded-sm hover:bg-[#211F28] transition-colors"
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
    </header>
  );
}
