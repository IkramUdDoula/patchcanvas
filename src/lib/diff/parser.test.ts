import { describe, it, expect } from 'vitest'
import * as fc from 'fast-check'
import { parseDiff, serializeHunks, generateHunkId } from './parser'
import { hunkArbitrary, filePathArbitrary, generateGitDiff, calculateStats } from '@/lib/test-utils'
import { assertStatsMatch } from '@/lib/test-helpers'
import { Hunk } from '@/lib/types'

describe('Diff Parser - Property-Based Tests', () => {
  describe('Property 11: Diff hunk parsing round-trip', () => {
    it('should parse and serialize hunks to produce semantically equivalent output', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.array(hunkArbitrary, { minLength: 1, maxLength: 5 }),
          (filePath, hunks) => {
            // Generate a git diff from hunks
            const originalDiff = generateGitDiff(hunks)
            
            // Parse the diff
            const parsedHunks = parseDiff(originalDiff, filePath)
            
            // Should have same number of hunks
            expect(parsedHunks.length).toBe(hunks.length)
            
            // Serialize back
            const serializedDiff = serializeHunks(parsedHunks)
            
            // Parse again
            const reparsedHunks = parseDiff(serializedDiff, filePath)
            
            // Should still have same number of hunks
            expect(reparsedHunks.length).toBe(parsedHunks.length)
            
            // Line counts should match
            parsedHunks.forEach((hunk, index) => {
              expect(reparsedHunks[index].lines.length).toBe(hunk.lines.length)
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should preserve line types through parse-serialize cycle', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.array(hunkArbitrary, { minLength: 1, maxLength: 3 }),
          (filePath, hunks) => {
            const originalDiff = generateGitDiff(hunks)
            const parsedHunks = parseDiff(originalDiff, filePath)
            const serializedDiff = serializeHunks(parsedHunks)
            const reparsedHunks = parseDiff(serializedDiff, filePath)
            
            // Line types should be preserved
            parsedHunks.forEach((hunk, hunkIndex) => {
              hunk.lines.forEach((line, lineIndex) => {
                expect(reparsedHunks[hunkIndex].lines[lineIndex].type).toBe(line.type)
              })
            })
          }
        ),
        { numRuns: 50 }
      )
    })

    it('should preserve line content through parse-serialize cycle', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.array(hunkArbitrary, { minLength: 1, maxLength: 3 }),
          (filePath, hunks) => {
            const originalDiff = generateGitDiff(hunks)
            const parsedHunks = parseDiff(originalDiff, filePath)
            const serializedDiff = serializeHunks(parsedHunks)
            const reparsedHunks = parseDiff(serializedDiff, filePath)
            
            // Line content should be preserved
            parsedHunks.forEach((hunk, hunkIndex) => {
              hunk.lines.forEach((line, lineIndex) => {
                expect(reparsedHunks[hunkIndex].lines[lineIndex].content).toBe(line.content)
              })
            })
          }
        ),
        { numRuns: 50 }
      )
    })
  })

  describe('Property 5: File change stats accuracy', () => {
    it('should calculate correct additions and deletions from hunks', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.array(hunkArbitrary, { minLength: 1, maxLength: 5 }),
          (filePath, hunks) => {
            // Calculate expected stats
            const { additions, deletions } = calculateStats(hunks)
            
            // Generate and parse diff
            const diff = generateGitDiff(hunks)
            const parsedHunks = parseDiff(diff, filePath)
            
            // Verify stats match
            assertStatsMatch(parsedHunks, additions, deletions)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should count only add lines as additions', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.array(hunkArbitrary, { minLength: 1, maxLength: 5 }),
          (filePath, hunks) => {
            const diff = generateGitDiff(hunks)
            const parsedHunks = parseDiff(diff, filePath)
            
            // Count additions manually
            let addCount = 0
            parsedHunks.forEach(hunk => {
              hunk.lines.forEach(line => {
                if (line.type === 'add') addCount++
              })
            })
            
            // Should match calculated additions
            const { additions } = calculateStats(parsedHunks)
            expect(addCount).toBe(additions)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should count only delete lines as deletions', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.array(hunkArbitrary, { minLength: 1, maxLength: 5 }),
          (filePath, hunks) => {
            const diff = generateGitDiff(hunks)
            const parsedHunks = parseDiff(diff, filePath)
            
            // Count deletions manually
            let deleteCount = 0
            parsedHunks.forEach(hunk => {
              hunk.lines.forEach(line => {
                if (line.type === 'delete') deleteCount++
              })
            })
            
            // Should match calculated deletions
            const { deletions } = calculateStats(parsedHunks)
            expect(deleteCount).toBe(deletions)
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should not count context lines in stats', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.array(hunkArbitrary, { minLength: 1, maxLength: 5 }),
          (filePath, hunks) => {
            const diff = generateGitDiff(hunks)
            const parsedHunks = parseDiff(diff, filePath)
            
            // Calculate stats
            const { additions, deletions } = calculateStats(parsedHunks)
            
            // Count all lines
            let totalLines = 0
            let contextLines = 0
            parsedHunks.forEach(hunk => {
              totalLines += hunk.lines.length
              hunk.lines.forEach(line => {
                if (line.type === 'context') contextLines++
              })
            })
            
            // Stats should not include context lines
            expect(additions + deletions).toBeLessThanOrEqual(totalLines)
            expect(additions + deletions + contextLines).toBe(totalLines)
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Hunk ID generation', () => {
    it('should generate unique IDs for different hunk indices', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          fc.nat({ max: 100 }),
          fc.nat({ max: 100 }),
          (filePath, index1, index2) => {
            const id1 = generateHunkId(filePath, index1)
            const id2 = generateHunkId(filePath, index2)
            
            if (index1 === index2) {
              expect(id1).toBe(id2)
            } else {
              expect(id1).not.toBe(id2)
            }
          }
        ),
        { numRuns: 100 }
      )
    })

    it('should generate unique IDs for different file paths', () => {
      fc.assert(
        fc.property(
          filePathArbitrary,
          filePathArbitrary,
          fc.nat({ max: 100 }),
          (filePath1, filePath2, index) => {
            const id1 = generateHunkId(filePath1, index)
            const id2 = generateHunkId(filePath2, index)
            
            if (filePath1 === filePath2) {
              expect(id1).toBe(id2)
            } else {
              expect(id1).not.toBe(id2)
            }
          }
        ),
        { numRuns: 100 }
      )
    })
  })

  describe('Edge cases', () => {
    it('should handle empty diff gracefully', () => {
      const parsedHunks = parseDiff('', 'test.ts')
      expect(parsedHunks).toEqual([])
    })

    it('should handle diff with no hunks', () => {
      const diff = 'Some random text\nNo hunk headers here'
      const parsedHunks = parseDiff(diff, 'test.ts')
      expect(parsedHunks).toEqual([])
    })

    it('should handle single-line hunks', () => {
      const diff = '@@ -1,1 +1,1 @@\n-old line\n+new line'
      const parsedHunks = parseDiff(diff, 'test.ts')
      
      expect(parsedHunks.length).toBe(1)
      expect(parsedHunks[0].lines.length).toBe(2)
    })
  })
})
