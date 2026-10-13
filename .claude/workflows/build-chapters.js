export const meta = {
  name: 'build-chapters',
  description: 'Binly: build the custom shots of several chapters in parallel batches; helpers pause (not fail) at usage limits. args: {slug, chapters: [{id, model?}], batch?: 3}',
}

// EXPERIMENTAL (untested at creation time). Fallback: spawn binly-builder subagents as in PIPELINE.md step 4.
// Each agent gets the SAME prompt opening (shared prompt cache); only the chapter id/paths at the end differ.
const slug = args && args.slug
const list = (args && args.chapters) || []
const batch = (args && args.batch) || 3
if (!slug || !list.length) {
  return 'build-chapters needs args {slug: "<video>", chapters: [{id: "C03"}, {id: "C04", model: "opus"}]}'
}

const OPENING =
  'You are a Binly chapter builder working in the studio root (the folder with CLAUDE.md). ' +
  'First read .claude/agents/binly-builder.md and follow it exactly (role, what you own, loop, report format). ' +
  'Then do this assignment: '

const reports = []
phase('Build chapters')
for (let i = 0; i < list.length; i += batch) {
  const group = list.slice(i, i + batch)
  const results = await Promise.all(
    group.map((c) =>
      agent(
        OPENING +
          `build the custom shots of chapter ${c.id} of video ${slug} ` +
          `(src/videos/${slug}/chapters/${c.id}.custom.tsx — or ${c.id}.tsx if the chapter has no shots JSON). ` +
          `Brief: videos/${slug}/briefs/${c.id}.md · shot list: videos/${slug}/shots/${c.id}.json (if present).`,
        {label: c.id, model: c.model || 'sonnet'}
      )
    )
  )
  group.forEach((c, k) => {
    reports.push(`${c.id}: ${results[k] ? String(results[k]).slice(0, 900) : 'FAILED or stopped — rebuild it with a binly-builder subagent'}`)
  })
}
return reports.join('\n\n')
