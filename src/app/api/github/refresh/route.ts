import { NextResponse } from 'next/server';
import { auth } from '@clerk/nextjs/server';
import { clearTokenCache } from '@/lib/github';

/**
 * Force refresh GitHub token
 * Call this after user reconnects GitHub account
 */
export async function POST() {
  const { userId } = await auth();

  if (!userId) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  clearTokenCache(userId);

  return NextResponse.json({ 
    success: true, 
    message: 'Token cache cleared. Next request will fetch fresh token.' 
  });
}
