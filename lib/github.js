// lib/github.js — Real GitHub Intelligence.
//
// Pulls live data from api.github.com for the configured usernames. No mock
// data: if GitHub can't be reached (rate limit, network, bad username), this
// returns an explicit error/degraded status rather than fabricated numbers.
//
// Unauthenticated GitHub API calls are capped at 60/hour and are shared
// across whatever IP the server runs on — in practice this is too low for
// anything but occasional manual checks. Set GITHUB_TOKEN (a fine-grained
// PAT with only public read access is enough) to raise the cap to 5000/hour.

const GITHUB_API = 'https://api.github.com';
const usernames = (process.env.GITHUB_USERNAMES || 'Victor-Kipruto-Rop')
  .split(',')
  .map(u => u.trim())
  .filter(Boolean);

let cache = { data: null, fetchedAt: 0 };
const CACHE_TTL_MS = 5 * 60 * 1000; // 5 minutes — respects rate limits, still feels "live"

function authHeaders() {
  const headers = {
    'User-Agent': 'dataforge-ops-center',
    'Accept': 'application/vnd.github+json'
  };
  if (process.env.GITHUB_TOKEN) {
    headers['Authorization'] = `Bearer ${process.env.GITHUB_TOKEN}`;
  }
  return headers;
}

async function ghFetch(url) {
  const res = await fetch(url, { headers: authHeaders() });
  const remaining = res.headers.get('x-ratelimit-remaining');
  const resetAt = res.headers.get('x-ratelimit-reset');
  if (!res.ok) {
    const body = await res.json().catch(() => ({}));
    const err = new Error(body.message || `GitHub API error (${res.status})`);
    err.status = res.status;
    err.rateLimitRemaining = remaining;
    err.rateLimitResetAt = resetAt ? new Date(Number(resetAt) * 1000).toISOString() : null;
    throw err;
  }
  return { json: await res.json(), rateLimitRemaining: remaining, rateLimitResetAt: resetAt };
}

async function fetchOverview() {
  const perUser = [];
  let rateLimitRemaining = null;

  for (const username of usernames) {
    const profile = await ghFetch(`${GITHUB_API}/users/${encodeURIComponent(username)}`);
    rateLimitRemaining = profile.rateLimitRemaining;

    const repos = await ghFetch(`${GITHUB_API}/users/${encodeURIComponent(username)}/repos?per_page=100&sort=updated`);
    rateLimitRemaining = repos.rateLimitRemaining;

    const repoList = repos.json
      .filter(r => !r.fork)
      .map(r => ({
        name: r.name,
        fullName: r.full_name,
        url: r.html_url,
        description: r.description,
        language: r.language,
        stars: r.stargazers_count,
        forks: r.forks_count,
        openIssues: r.open_issues_count,
        updatedAt: r.updated_at,
        pushedAt: r.pushed_at,
        isPrivate: r.private,
        defaultBranch: r.default_branch
      }))
      .sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt));

    const languageTotals = {};
    for (const r of repoList) {
      if (r.language) languageTotals[r.language] = (languageTotals[r.language] || 0) + 1;
    }

    perUser.push({
      username,
      profileUrl: profile.json.html_url,
      avatarUrl: profile.json.avatar_url,
      name: profile.json.name,
      bio: profile.json.bio,
      followers: profile.json.followers,
      following: profile.json.following,
      publicRepos: profile.json.public_repos,
      createdAt: profile.json.created_at,
      repos: repoList,
      totalStars: repoList.reduce((sum, r) => sum + r.stars, 0),
      totalForks: repoList.reduce((sum, r) => sum + r.forks, 0),
      languageBreakdown: languageTotals
    });
  }

  const allRepos = perUser.flatMap(u => u.repos);
  const mostRecentlyPushed = [...allRepos].sort((a, b) => new Date(b.pushedAt) - new Date(a.pushedAt)).slice(0, 8);
  const topStarred = [...allRepos].sort((a, b) => b.stars - a.stars).slice(0, 8);

  const combinedLanguages = {};
  for (const u of perUser) {
    for (const [lang, count] of Object.entries(u.languageBreakdown)) {
      combinedLanguages[lang] = (combinedLanguages[lang] || 0) + count;
    }
  }

  return {
    fetchedAt: new Date().toISOString(),
    tokenConfigured: Boolean(process.env.GITHUB_TOKEN),
    rateLimitRemaining: rateLimitRemaining ? Number(rateLimitRemaining) : null,
    users: perUser,
    totals: {
      repos: allRepos.length,
      stars: allRepos.reduce((sum, r) => sum + r.stars, 0),
      forks: allRepos.reduce((sum, r) => sum + r.forks, 0),
      openIssues: allRepos.reduce((sum, r) => sum + r.openIssues, 0)
    },
    languageBreakdown: combinedLanguages,
    mostRecentlyPushed,
    topStarred
  };
}

async function getOverview(req, res) {
  const now = Date.now();
  if (cache.data && (now - cache.fetchedAt) < CACHE_TTL_MS) {
    return res.json({ ...cache.data, cached: true });
  }

  try {
    const data = await fetchOverview();
    cache = { data, fetchedAt: now };
    return res.json({ ...data, cached: false });
  } catch (err) {
    // No mock fallback: surface the real error (e.g. rate limit) instead of fake data.
    if (cache.data) {
      // Serve last-known-real data, clearly marked stale, rather than nothing.
      return res.status(200).json({
        ...cache.data,
        cached: true,
        stale: true,
        staleReason: err.message,
        rateLimitResetAt: err.rateLimitResetAt || null
      });
    }
    return res.status(err.status === 403 ? 429 : 502).json({
      error: err.message,
      hint: err.rateLimitRemaining === '0'
        ? 'GitHub API rate limit hit. Set GITHUB_TOKEN in .env to raise the limit from 60/hr to 5000/hr.'
        : 'Could not reach the GitHub API.',
      rateLimitResetAt: err.rateLimitResetAt || null
    });
  }
}

module.exports = { getOverview };
