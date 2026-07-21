const axios = require('axios');
const { ValidationError } = require('../../../common/errors/AppError');

const parseGitHubRepository = (url) => {
  let parsed;
  try { parsed = new URL(url); } catch { throw new ValidationError('Provide a valid GitHub repository URL.'); }
  if (!['github.com', 'www.github.com'].includes(parsed.hostname)) throw new ValidationError('Only github.com repository URLs can be synced.');
  const [owner, repo] = parsed.pathname.split('/').filter(Boolean);
  if (!owner || !repo) throw new ValidationError('GitHub URL must include an owner and repository.');
  return { owner, repo: repo.replace(/\.git$/, '') };
};

exports.getRepository = async (url) => {
  const { owner, repo } = parseGitHubRepository(url);
  const headers = { Accept: 'application/vnd.github+json' };
  if (process.env.GITHUB_TOKEN) headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
  try {
    const { data } = await axios.get(`https://api.github.com/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repo)}`, { headers, timeout: 8000 });
    return { name: data.full_name, description: data.description || '', url: data.html_url, stars: data.stargazers_count, forks: data.forks_count, language: data.language, topics: data.topics || [], updatedAt: data.updated_at, isPrivate: data.private };
  } catch (error) {
    if (error.response?.status === 404) throw new ValidationError('GitHub repository was not found or is private.');
    throw new ValidationError('GitHub could not be reached. Please try again later.');
  }
};
