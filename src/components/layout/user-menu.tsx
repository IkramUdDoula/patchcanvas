"use client"

import { useUser } from '@clerk/nextjs';
import { UserButton } from '@clerk/nextjs';
import { useTheme } from 'next-themes';
import { dark } from '@clerk/themes';

export function UserMenu() {
  const { user } = useUser();
  const { theme } = useTheme();

  if (!user) {
    return null;
  }

  return (
    <UserButton
      appearance={{
        baseTheme: theme === 'dark' ? dark : undefined,
      }}
      userProfileProps={{
        additionalOAuthScopes: {
          github: ['repo', 'read:user'],
        },
        appearance: {
          baseTheme: theme === 'dark' ? dark : undefined,
        },
      }}
    />
  );
}
