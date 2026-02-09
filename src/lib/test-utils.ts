import * as fc from 'fast-check'
import { Hunk, DiffLine } from './types'

/**
 * Test utilities and generators for property-based testing
 */

// Theme generators
export const themeArbitrary = fc.constantFrom('light', 'dark', 'system')

// Branch name generator
export const branchNameArbitrary = fc.stringMatching(/^[a-z0-9-]+$/).filter(s => s.length > 0 && s.length < 50)

// Commit SHA generator (40 hex characters)
export const commitShaArbitrary = fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 40, maxLength: 40 }).map(arr => arr.join(''))

// Abbreviated commit SHA (7 characters)
export const abbreviatedShaArbitrary = fc.array(fc.constantFrom('0', '1', '2', '3', '4', '5', '6', '7', '8', '9', 'a', 'b', 'c', 'd', 'e', 'f'), { minLength: 7, maxLength: 7 }).map(arr => arr.join(''))

// File path generator
export const filePathArbitrary = fc.stringMatching(/^[a-zA-Z0-9/_.-]+\.(ts|tsx|js|jsx|json|md|css)$/)

// Hunk ID generator
export const hunkIdArbitrary = fc.string().map(s => `hunk-${s}`)

// Timestamp generator
export const timestampArbitrary = fc.date({ min: new Date('2020-01-01'), max: new Date('2025-12-31') })

// Diff line generator
export const diffLineArbitrary: fc.Arbitrary<DiffLine> = fc.record({
  type: fc.constantFrom('context', 'add', 'delete'),
  content: fc.string({ minLength: 0, maxLength: 100 }),
  oldLineNumber: fc.option(fc.nat({ max: 10000 }), { nil: null }),
  newLineNumber: fc.option(fc.nat({ max: 10000 }), { nil: null }),
})

// Hunk generator
export const hunkArbitrary: fc.Arbitrary<Hunk> = fc.record({
  id: hunkIdArbitrary,
  oldStart: fc.nat({ max: 1000 }),
  oldLines: fc.nat({ max: 100 }),
  newStart: fc.nat({ max: 1000 }),
  newLines: fc.nat({ max: 100 }),
  header: fc.string(),
  lines: fc.array(diffLineArbitrary, { minLength: 1, maxLength: 50 }),
  status: fc.constantFrom('pending', 'approved', 'rejected'),
})

// PR number generator
export const prNumberArbitrary = fc.integer({ min: 1, max: 9999 })

// Generate a valid git diff patch
export function generateGitDiff(hunks: Hunk[]): string {
  let patch = ''
  
  for (const hunk of hunks) {
    patch += `@@ -${hunk.oldStart},${hunk.oldLines} +${hunk.newStart},${hunk.newLines} @@ ${hunk.header}\n`
    
    for (const line of hunk.lines) {
      const prefix = line.type === 'add' ? '+' : line.type === 'delete' ? '-' : ' '
      patch += `${prefix}${line.content}\n`
    }
  }
  
  return patch
}

// Generate file content from lines
export function generateFileContent(lines: string[]): string {
  return lines.join('\n')
}

// Calculate additions and deletions from hunks
export function calculateStats(hunks: Hunk[]): { additions: number; deletions: number } {
  let additions = 0
  let deletions = 0
  
  for (const hunk of hunks) {
    for (const line of hunk.lines) {
      if (line.type === 'add') additions++
      if (line.type === 'delete') deletions++
    }
  }
  
  return { additions, deletions }
}
