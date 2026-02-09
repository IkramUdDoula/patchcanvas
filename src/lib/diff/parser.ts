import { Hunk, DiffLine, FileDiff } from '@/lib/types'

/**
 * Parse a unified diff format string into Hunk objects
 */
export function parseDiff(diffContent: string, filePath: string, status: 'added' | 'modified' | 'deleted' | 'renamed' = 'modified'): Hunk[] {
  const lines = diffContent.split('\n')
  const hunks: Hunk[] = []
  let currentHunk: Hunk | null = null
  let hunkIndex = 0

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i]

    // Detect hunk header: @@ -oldStart,oldLines +newStart,newLines @@
    if (line.startsWith('@@')) {
      if (currentHunk) {
        hunks.push(currentHunk)
      }

      const headerMatch = line.match(/@@ -(\d+)(?:,(\d+))? \+(\d+)(?:,(\d+))? @@/)
      if (headerMatch) {
        const oldStart = parseInt(headerMatch[1], 10)
        const oldLines = headerMatch[2] ? parseInt(headerMatch[2], 10) : 1
        const newStart = parseInt(headerMatch[3], 10)
        const newLines = headerMatch[4] ? parseInt(headerMatch[4], 10) : 1

        currentHunk = {
          id: `${filePath}-hunk-${hunkIndex}`,
          oldStart,
          oldLines,
          newStart,
          newLines,
          header: line,
          lines: [],
        }
        hunkIndex++
      }
    } else if (currentHunk && (line.startsWith('-') || line.startsWith('+') || line.startsWith(' ') || line === '')) {
      // Parse diff lines
      const diffLine = parseDiffLine(line, currentHunk.oldStart, currentHunk.newStart, currentHunk.lines.length)
      if (diffLine) {
        currentHunk.lines.push(diffLine)
      }
    }
  }

  if (currentHunk) {
    hunks.push(currentHunk)
  }

  return hunks
}

/**
 * Parse a single diff line and track line numbers
 */
function parseDiffLine(
  line: string,
  oldStart: number,
  newStart: number,
  lineIndex: number
): DiffLine | null {
  if (line === '') {
    return null
  }

  const type = line[0]
  const content = line.slice(1)

  let oldLineNumber: number | null = null
  let newLineNumber: number | null = null

  if (type === ' ') {
    // Context line
    oldLineNumber = oldStart + lineIndex
    newLineNumber = newStart + lineIndex
    return {
      type: 'context',
      content,
      oldLineNumber,
      newLineNumber,
    }
  } else if (type === '-') {
    // Deletion
    oldLineNumber = oldStart + lineIndex
    return {
      type: 'delete',
      content,
      oldLineNumber,
      newLineNumber: null,
    }
  } else if (type === '+') {
    // Addition
    newLineNumber = newStart + lineIndex
    return {
      type: 'add',
      content,
      oldLineNumber: null,
      newLineNumber,
    }
  }

  return null
}

/**
 * Generate a unique hunk ID based on file path and hunk position
 */
export function generateHunkId(filePath: string, hunkIndex: number): string {
  return `${filePath}-hunk-${hunkIndex}`
}

/**
 * Serialize hunks back to unified diff format
 */
export function serializeHunks(hunks: Hunk[]): string {
  return hunks
    .map((hunk) => {
      const lines = [hunk.header]
      lines.push(...hunk.lines.map((line) => serializeDiffLine(line)))
      return lines.join('\n')
    })
    .join('\n')
}

/**
 * Serialize a single diff line back to unified diff format
 */
function serializeDiffLine(line: DiffLine): string {
  switch (line.type) {
    case 'context':
      return ` ${line.content}`
    case 'add':
      return `+${line.content}`
    case 'delete':
      return `-${line.content}`
  }
}
