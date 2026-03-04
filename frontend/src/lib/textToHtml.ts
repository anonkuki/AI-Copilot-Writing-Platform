/**
 * 将 AI 生成的纯文本转换为 HTML 段落格式
 * 用于 TipTap 编辑器正确渲染分段内容
 *
 * 处理规则：
 * - 双换行 (\n\n) 分隔段落，包裹为 <p>
 * - 段内单换行 (\n) 转换为 <br>
 * - 已有 HTML 标签的内容直接返回
 * - 对话行（以"或「开头）保持独立段落
 */
export function textToHtml(text: string): string {
  if (!text) return '';

  // 如果文本已经包含 HTML 块级标签，视为已格式化
  if (/<(?:p|div|h[1-6]|ul|ol|li|blockquote)\b/i.test(text)) {
    return text;
  }

  // 按双换行分段
  const paragraphs = text.split(/\n{2,}/).filter(p => p.trim());
  if (paragraphs.length === 0) return '<p></p>';

  // 对每段进行处理
  const result: string[] = [];
  for (const p of paragraphs) {
    const trimmed = p.trim();
    // 段内可能有单换行（如对话连续行），拆分为子行
    const lines = trimmed.split('\n');
    if (lines.length === 1) {
      result.push(`<p>${escapeHtml(lines[0].trim())}</p>`);
    } else {
      // 对话连续行：每行可能是独立段落（以引号/书名号开头的对话）
      const allDialogue = lines.every(l => /^["""「『（]/.test(l.trim()));
      if (allDialogue) {
        // 每行对话独立成段
        for (const line of lines) {
          if (line.trim()) result.push(`<p>${escapeHtml(line.trim())}</p>`);
        }
      } else {
        // 普通段落内的换行用 <br> 连接
        const inner = lines.map(l => escapeHtml(l.trim())).join('<br>');
        result.push(`<p>${inner}</p>`);
      }
    }
  }

  return result.join('');
}

/**
 * 简单 HTML 转义（防止 AI 输出的特殊字符破坏结构）
 * 注意：不转义已有的 HTML 标签（由调用方通过前置检查控制）
 */
function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}
