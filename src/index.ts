import * as core from '@actions/core'
import * as github from '@actions/github'

function parseLabels(input: string): string[] {
  return input
    .split(',')
    .map((label) => label.trim())
    .filter((label) => label.length > 0)
}

function isTruthy(value: string): boolean {
  const normalized = value.trim().toLowerCase()
  return normalized === 'true' || normalized === '1'
}

async function run(): Promise<void> {
  const labels = parseLabels(core.getInput('labels', { required: true }))
  if (labels.length === 0) {
    throw new Error('Input "labels" must contain at least one label')
  }

  const condition = core.getInput('condition', { required: true })
  const token =
    core.getInput('token') || process.env.GITHUB_TOKEN || process.env.GH_TOKEN
  if (!token) {
    throw new Error(
      'No GitHub token available. Pass input "token" or ensure GITHUB_TOKEN is set.'
    )
  }

  const context = github.context
  const target = context.payload.pull_request || context.payload.issue
  if (!target) {
    throw new Error(
      'No pull request or issue in the event payload. This action only works on PR/issue events.'
    )
  }

  const client = github.getOctokit(token)
  const issueNumber = target.number
  const shouldAdd = isTruthy(condition)

  if (shouldAdd) {
    core.info(`Adding labels [${labels.join(', ')}] to #${issueNumber}`)
    await client.rest.issues.addLabels({
      ...context.repo,
      issue_number: issueNumber,
      labels
    })
    return
  }

  core.info(`Removing labels [${labels.join(', ')}] from #${issueNumber}`)
  for (const label of labels) {
    try {
      await client.rest.issues.removeLabel({
        ...context.repo,
        issue_number: issueNumber,
        name: label
      })
    } catch (error: unknown) {
      const status =
        typeof error === 'object' &&
        error !== null &&
        'status' in error &&
        typeof (error as { status: unknown }).status === 'number'
          ? (error as { status: number }).status
          : undefined
      if (status === 404) {
        core.info(`Label "${label}" was not present on #${issueNumber}`)
        continue
      }
      throw error
    }
  }
}

run().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error)
  core.setFailed(message)
})
