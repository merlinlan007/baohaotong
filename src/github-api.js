/**
 * GitHub API 封装 — 读写仓库中的 JSON 数据文件
 * Token 存储在 localStorage 中
 */

const OWNER = 'merlinlan007';
const REPO = 'baohaotong';
const DATA_PATH = 'data/phones.json';

function getToken() {
  return localStorage.getItem('baohatong_github_token') || '';
}

export function setToken(token) {
  localStorage.setItem('baohatong_github_token', token);
}

export function clearToken() {
  localStorage.removeItem('baohatong_github_token');
}

export function getStoredToken() {
  return getToken();
}

async function api(path, options = {}) {
  const token = getToken();
  const res = await fetch(`https://api.github.com${path}`, {
    ...options,
    headers: {
      'Authorization': `token ${token}`,
      'Accept': 'application/vnd.github.v3+json',
      ...options.headers,
    },
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.message || `API error: ${res.status}`);
  }
  return res.json();
}

/** 验证 Token 有效性 */
export async function verifyToken(token) {
  const res = await fetch('https://api.github.com/user', {
    headers: { 'Authorization': `token ${token}`, 'Accept': 'application/vnd.github.v3+json' },
  });
  if (!res.ok) throw new Error('Token 无效');
  const user = await res.json();
  return { login: user.login, email: user.email || user.login };
}

/** 从仓库读取手机号数据 */
export async function loadPhones() {
  try {
    const data = await api(`/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`);
    // GitHub API 返回 base64 编码的内容
    const content = atob(data.content);
    return JSON.parse(content);
  } catch (e) {
    if (e.message.includes('404')) return []; // 文件不存在
    throw e;
  }
}

/** 保存手机号数据到仓库 */
export async function savePhones(phones) {
  // 先获取当前文件的 sha（如果存在）
  let sha = undefined;
  try {
    const data = await api(`/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`);
    sha = data.sha;
  } catch (e) {
    // 文件不存在，新建
  }

  const content = btoa(unescape(encodeURIComponent(JSON.stringify(phones, null, 2))));
  const body = {
    message: 'Update phones data',
    content,
    ...(sha ? { sha } : {}),
  };

  return api(`/repos/${OWNER}/${REPO}/contents/${DATA_PATH}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
}
