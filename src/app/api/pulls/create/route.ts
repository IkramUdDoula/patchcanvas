import { NextResponse } from 'next/server'
import { Octokit } from '@octokit/rest'
import { getGitHubToken } from '@/lib/github'

export async function POST(request: Request) {
  try {
    const body = await request.json()
    const { owner, repo, title, body: prBody, head, base } = body

    console.log('Creating PR with params:', { owner, repo, title, head, base })

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

    // First, verify we can access the repository
    try {
      const repoData = await octokit.repos.get({ owner, repo })
      console.log('Repository accessible:', repoData.data.full_name)
    } catch (e: any) {
      console.error('Cannot access repository:', e.message)
      return NextResponse.json(
        { 
          error: 'Cannot access repository',
          details: 'The repository may not exist or you may not have permission to access it.'
        },
        { status: 404 }
      )
    }

    // Verify branches exist
    try {
      await octokit.repos.getBranch({ owner, repo, branch: base })
      console.log(`Base branch '${base}' exists`)
    } catch (e: any) {
      console.error(`Base branch '${base}' not found:`, e.message)
      return NextResponse.json(
        { error: `Base branch '${base}' not found` },
        { status: 404 }
      )
    }

    try {
      await octokit.repos.getBranch({ owner, repo, branch: head })
      console.log(`Head branch '${head}' exists`)
    } catch (e: any) {
      console.error(`Head branch '${head}' not found:`, e.message)
      return NextResponse.json(
        { error: `Head branch '${head}' not found` },
        { status: 404 }
      )
    }

    // Compare branches to ensure there are commits to create a PR
    try {
      const comparison = await octokit.repos.compareCommits({
        owner,
        repo,
        base,
        head,
      })
      console.log(`Commits ahead: ${comparison.data.ahead_by}, behind: ${comparison.data.behind_by}`)
      
      if (comparison.data.ahead_by === 0) {
        return NextResponse.json(
          { error: 'No commits between base and head branches' },
          { status: 400 }
        )
      }
    } catch (e: any) {
      console.error('Error comparing branches:', e.message)
    }

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
    console.error('Error response:', error.response?.data)
    return NextResponse.json(
      { 
        error: 'Failed to create pull request',
        details: error.response?.data?.message || error.message,
        githubError: error.response?.data
      },
      { status: error.status || 500 }
    )
  }
}
