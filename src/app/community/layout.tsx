/**
 * Community Store Layout
 * Shared layout for all community pages
 */

import type { Metadata } from 'next';

export const metadata: Metadata = {
  title: 'Community Game Store | Atomiq Casino',
  description: 'Discover and play community-built casino games on Atomiq',
};

export default function CommunityLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
