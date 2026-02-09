import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getGitHubToken } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { owner, repo, branchName, sha } = body

    if (!owner || !repo || !branchName || !sha) {
      return NextResponse.json(
        { error: 'Missing required parameters' },
        { status: 400 }
      )
    }

    const result = await getGitHubToken()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const octokit = new Octokit({ auth: result.token })

    // Create a new reference (branch)
    const { data } = await octokit.git.createRef({
      owner,
      repo,
      ref: `refs/heads/${branchName}`,
      sha,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating branch:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create branch',
        details: error.message 
      },
      { status: error.status || 500 }
    )
  }
}
