import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getGitHubToken } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { owner, repo, title, body: prBody, head, base } = body

    if (!owner || !repo || !title || !head || !base) {
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

    const { data } = await octokit.pulls.create({
      owner,
      repo,
      title,
      body: prBody || '',
      head,
      base,
    })

    return NextResponse.json(data)
  } catch (error: any) {
    console.error('Error creating PR:', error)
    return NextResponse.json(
      { 
        error: 'Failed to create pull request',
        details: error.message 
      },
      { status: error.status || 500 }
    )
  }
}
