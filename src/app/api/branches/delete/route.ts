import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getGitHubToken } from '@/lib/github'

/**
 * DELETE /api/branches/delete
 * Deletes a branch from a repository
 */
export async function DELETE(request: Request) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing owner or repo parameter' },
      { status: 400 }
    )
  }

  const result = await getGitHubToken()
  if ('error' in result) {
    return NextResponse.json({ error: result.error }, { status: result.status })
  }

  const octokit = new Octokit({ auth: result.token })

  try {
    const body = await request.json()
    const { branch } = body

    if (!branch) {
      return NextResponse.json(
        { error: 'Missing branch name' },
        { status: 400 }
      )
    }

    // Check if branch is the default branch
    const { data: repoData } = await octokit.repos.get({ owner, repo })
    if (branch === repoData.default_branch) {
      return NextResponse.json(
        { error: 'Cannot delete the default branch' },
        { status: 400 }
      )
    }

    // Check if branch is protected
    try {
      const { data: branchData } = await octokit.repos.getBranch({
        owner,
        repo,
        branch,
      })
      
      if (branchData.protected) {
        return NextResponse.json(
          { error: 'Cannot delete a protected branch' },
          { status: 400 }
        )
      }
    } catch (error) {
      // Branch might not exist or we don't have permission to check protection
      // Continue with deletion attempt
    }

    // Delete the branch
    await octokit.git.deleteRef({
      owner,
      repo,
      ref: `heads/${branch}`,
    })

    return NextResponse.json({ success: true, message: 'Branch deleted successfully' })
  } catch (error) {
    console.error('Branch deletion error:', error)
    
    const errorMessage = error instanceof Error ? error.message : 'Unknown error'
    const status = (error as any)?.status || 500
    
    return NextResponse.json(
      {
        error: 'Failed to delete branch',
        details: errorMessage,
      },
      { status }
    )
  }
}
