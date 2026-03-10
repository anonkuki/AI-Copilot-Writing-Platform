const fs = require('fs');

const token = fs.readFileSync('D:/codeC/python/ai+/.test_token.txt', 'utf8').trim();
const bookId = fs.readFileSync('D:/codeC/python/ai+/.test_bookid.txt', 'utf8').trim();

function preview(text, len = 160) {
  return (text || '').replace(/\s+/g, ' ').trim().slice(0, len);
}

async function post(body) {
  const resp = await fetch('http://localhost:3001/ai/assist-content', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${token}`,
      'Content-Type': 'application/json; charset=utf-8',
    },
    body: JSON.stringify(body),
  });
  return resp.json();
}

async function main() {
  const payloads = [
    [
      'character',
      {
        bookId,
        type: 'character',
        currentData: {
          name: '顾砚',
          role: '配角',
          personality: '',
          background: '',
          motivation: '',
          fear: '',
          strength: '信息检索能力强',
          weakness: '',
          currentGoal: '查清归零会外围网络',
          longTermGoal: '',
          arc: '',
          appearance: '',
          catchphrase: '',
        },
        modelId: 'Pro/deepseek-ai/DeepSeek-V3.2',
      },
    ],
    [
      'world_setting',
      {
        bookId,
        type: 'world_setting',
        currentData: {
          genre: '悬疑、都市异能',
          theme: '秩序与失控',
          tone: '黑暗、紧张',
          targetWordCount: 120000,
          powerSystem: '',
          geography: '',
          history: '',
          society: '',
          rules: '',
        },
        modelId: 'Pro/deepseek-ai/DeepSeek-V3.2',
      },
    ],
    [
      'plotline',
      {
        bookId,
        type: 'outline',
        currentData: {
          title: '归零会外围清剿',
          description: '林默逐步锁定外围成员并追查资金链',
          type: 'SUB',
          conflict: '',
          climax: '',
          resolution: '',
          relatedCharacters: '林默, 苏婉, 顾砚',
        },
        modelId: 'Pro/deepseek-ai/DeepSeek-V3.2',
      },
    ],
    [
      'foreshadowing',
      {
        bookId,
        type: 'outline',
        currentData: {
          type: 'foreshadowing',
          title: '旧档案中的缺页',
          content: '林默在旧案卷里发现关键页被人为撕掉',
          purpose: '',
          resolveHint: '',
          relatedCharacters: '林默, 陈玄',
        },
        modelId: 'Pro/deepseek-ai/DeepSeek-V3.2',
      },
    ],
  ];

  const results = [];
  for (const [name, body] of payloads) {
    const json = await post(body);
    const suggestions = json.data?.suggestions || {};
    const keys = Object.keys(suggestions);
    results.push({
      type: name,
      ok: keys.length > 0,
      keys,
      sample: keys[0] ? preview(String(suggestions[keys[0]])) : '',
    });
  }

  console.log(JSON.stringify(results, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
