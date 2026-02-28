import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getGitHubToken } from '@/lib/github'

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url)
    const owner = searchParams.get('owner')
    const repo = searchParams.get('repo')
    const base = searchParams.get('base')
    const head = searchParams.get('head')

    if (!owner || !repo || !base || !head) {
      return NextResponse.json(
        { error: 'Missing required parameters: owner, repo, base, head' },
        { status: 400 }
      )
    }

    const result = await getGitHubToken()
    if ('error' in result) {
      return NextResponse.json({ error: result.error }, { status: result.status })
    }

    const octokit = new Octokit({ auth: result.token })

    // Compare branches
    const comparison = await octokit.repos.compareCommits({
      owner,
      repo,
      base,
      head,
    })

    return NextResponse.json({
      ahead_by: comparison.data.ahead_by,
      behind_by: comparison.data.behind_by,
      status: comparison.data.status,
      total_commits: comparison.data.total_commits,
      commits: comparison.data.commits.map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: c.commit.author?.name,
        date: c.commit.author?.date,
      })),
    })
  } catch (error: any) {
    console.error('Error comparing branches:', error)
    return NextResponse.json(
      { 
        error: 'Failed to compare branches',
        details: error.message
      },
      { status: error.status || 500 }
    )
  }
}
