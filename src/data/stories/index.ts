import type { Story } from '../types'
import { foundationStories } from './foundations'
import { identityStories } from './identity'
import { socStories } from './soc'
import { microsoftStories } from './microsoft'
import { operationsStories } from './operations'

/**
 * Story-driven teaching layer for existing lessons, keyed by lesson id.
 * Each story follows: story → twist → evidence → limitation → correlation →
 * investigation → KQL → Microsoft → MITRE → detection → response.
 */
export const STORIES: Record<string, Story> = {
  ...foundationStories,
  ...identityStories,
  ...socStories,
  ...microsoftStories,
  ...operationsStories,
}
