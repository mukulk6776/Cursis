export interface ChangelogEntry { date: string; title: string; changes: string[] }

// Add verified, released changes here, newest first. Dates use YYYY-MM-DD.
export const changelogEntries: ChangelogEntry[] = [];
