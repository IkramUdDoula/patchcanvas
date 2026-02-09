import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getGitHubToken } from '@/lib/github'

export async function POST(
  request: Request,
  { params }: { params: Promise<{ number: string }> }
) {
  const { searchParams } = new URL(request.url)
  const owner = searchParams.get('owner')
  const repo = searchParams.get('repo')
  const { number } = await params
  const prNumber = parseInt(number)

  if (!owner || !repo) {
    return NextResponse.json(
      { error: 'Missing owner or repo parameter' },
      { status: 400 }
    )
  }

  if (isNaN(prNumber)) {
    return NextResponse.json(
      { error: 'Invalid PR number' },
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
    const { merge_method = 'merge', commit_title, commit_message } = body

    const { data } = await octokit.pulls.merge({
      owner,
      repo,
      pull_number: prNumber,
      commit_title,
      commit_message,
      merge_method: merge_method as 'merge' | 'squash' | 'rebase',
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error merging PR:', error)
    return NextResponse.json(
      { 
        error: error.message || 'Failed to merge pull request',
        details: error.response?.data?.message || error.message
      },
      { status: error.status || 500 }
    )
  }
}
