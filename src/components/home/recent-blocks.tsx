"use client";

import Image from "next/image";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { IconContainer } from "@/components/ui/icon-container";
import { useRecentBlocks } from "@/hooks";
import { Skeleton } from "@/components/ui/skeleton";
import { LiveStatusIndicator } from "@/components/ui/live-status-indicator";
import type { Block } from "@/mocks/blocks";

interface RecentBlocksProps {
  limit?: number;
}

export function RecentBlocks({ limit = 5 }: RecentBlocksProps) {
  const {
    data: blocks,
    isLoading,
    error,
    isLive,
    isConnecting,
  } = useRecentBlocks(limit);

  // Add debugging to see what data we're getting
  console.log("🔍 RecentBlocks component render:", {
    blocks,
    blocksLength: blocks?.length,
    isLoading,
    error: error?.message,
    isLive,
    isConnecting,
  });

  if (error) {
    return (
      <Card className="h-full">
        <CardContent className="flex items-center justify-center h-full">
          <p className="text-sm text-red-500">Failed to load recent blocks</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full flex flex-col p-6">
      <CardHeader className="flex-row justify-between items-center mb-4 ">
        <div className="flex items-center gap-3">
          <CardTitle>Recent Blocks</CardTitle>
        </div>
        <a
          href="https://explorer.atomiq.network/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-sm font-medium  hover:text-[#9485F5] transition-colors cursor-pointer"
        >
          See all
        </a>
      </CardHeader>

      <CardContent className="flex flex-col h-full justify-between ">
        {isLoading ? (
          <BlocksSkeleton count={limit} />
        ) : blocks && blocks.length > 0 ? (
          blocks.map((block, index) => (
            <BlockItem
              key={block.id}
              block={block}
              isNew={isLive && index === 0}
              isLive={isLive || false}
            />
          ))
        ) : (
          <p className="text-sm text-white/60 text-center">No blocks found</p>
        )}
      </CardContent>
    </Card>
  );
}

/**
 * Individual block item component
 */
function BlockItem({
  block,
  isNew = false,
  isLive = false,
}: {
  block: Block;
  isNew?: boolean;
  isLive?: boolean;
}) {
  return (
    <div className="flex flex-row justify-between">
      <div className="flex flex-row gap-2 items-center">
        <IconContainer>
          <Image
            src="/icons/block.svg"
            alt="Block"
            width={16}
            height={16}
            style={{ width: "auto", height: "auto" }}
          />
        </IconContainer>
        <div>
          <p className="text-sm font-medium">#{block.blockNumber}</p>
          <p className="text-sm font-medium text-white/60">{block.hash}</p>
        </div>
      </div>
      <div className="text-right">
        <p className="text-sm font-medium">{block.transactionCount} TX</p>
        <p className="text-sm font-medium text-white/60">{block.timestamp}</p>
      </div>
    </div>
  );
}

/**
 * Loading skeleton for blocks
 */
function BlocksSkeleton({ count }: { count: number }) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex flex-row justify-between">
          <div className="flex flex-row gap-2 items-center">
            <Skeleton className="h-10 w-10 rounded-full" />
            <div className="space-y-1">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-3 w-24" />
            </div>
          </div>
          <div className="text-right space-y-1">
            <Skeleton className="h-4 w-12 ml-auto" />
            <Skeleton className="h-3 w-16 ml-auto" />
          </div>
        </div>
      ))}
    </>
  );
}
