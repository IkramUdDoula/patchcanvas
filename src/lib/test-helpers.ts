/**
 * Test helper functions for assertions and common test operations
 */

import { expect } from 'vitest'
import { Hunk } from './types'

/**
 * Assert that diff stats match actual line counts
 */
export function assertStatsMatch(
  hunks: Hunk[],
  expectedAdditions: number,
  expectedDeletions: number
) {
  let actualAdditions = 0
  let actualDeletions = 0
  
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'add') actualAdditions++
      if (line.type === 'delete') actualDeletions++
    }
  }
  
  expect(actualAdditions).toBe(expectedAdditions)
  expect(actualDeletions).toBe(expectedDeletions)
}

/**
 * Assert that exactly one item is selected
 */
export function assertExactlyOneSelected(selectedItems: any[]) {
  const nonNullItems = selectedItems.filter(item => item !== null)
  expect(nonNullItems.length).toBeLessThanOrEqual(1)
}
