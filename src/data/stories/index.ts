import type { Story } from '../types'
import { foundationStories } from './foundations'

/**
 * Story-driven teaching layer for existing lessons, keyed by lesson id.
 * Each story follows: story → twist → evidence → limitation → correlation →
 * investigation → KQL → Microsoft → MITRE → detection → response.
 */
export const STORIES: Record<string, Story> = {
  ...foundationStories,
}
