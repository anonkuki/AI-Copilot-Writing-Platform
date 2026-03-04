/**
 * TipTap Extension — 内联润色装饰（Copilot 风格红绿 diff）
 *
 * 使用 ProseMirror Decoration API 在编辑器中直接渲染：
 *   - 红色删除线：标记原文待修改片段
 *   - 绿色插入文本：显示建议替换内容
 *
 * 外部通过 dispatch transaction + meta 来更新装饰。
 */

import { Extension } from '@tiptap/core';
import { Plugin, PluginKey } from '@tiptap/pm/state';
import { Decoration, DecorationSet } from '@tiptap/pm/view';

export const polishPluginKey = new PluginKey('inlinePolish');

export interface PolishDecorationItem {
  from: number;
  to: number;
  replacement: string;
  reason: string;
  isCurrent: boolean;
  suggestionId: string;
}

/**
 * 根据润色建议列表创建 ProseMirror DecorationSet
 */
export function buildPolishDecorations(
  doc: any,
  items: PolishDecorationItem[],
): DecorationSet {
  if (items.length === 0) return DecorationSet.empty;

  const decorations: Decoration[] = [];

  for (const item of items) {
    if (item.from < 0 || item.to > doc.content.size || item.from >= item.to) continue;

    // 1. 红色删除线覆盖原文
    decorations.push(
      Decoration.inline(item.from, item.to, {
        class: item.isCurrent ? 'polish-del-active' : 'polish-del',
        'data-polish-id': item.suggestionId,
      }),
    );

    // 2. 绿色替换文本 widget（插到原文之后）
    decorations.push(
      Decoration.widget(
        item.to,
        () => {
          const span = document.createElement('span');
          span.className = item.isCurrent ? 'polish-ins-active' : 'polish-ins';
          span.textContent = item.replacement;
          span.setAttribute('data-polish-id', item.suggestionId);
          if (item.isCurrent) {
            span.title = item.reason;
          }
          return span;
        },
        { side: 1, key: `pi_${item.suggestionId}` },
      ),
    );
  }

  // 按 from 排序以满足 ProseMirror 的要求
  decorations.sort((a, b) => (a as any).from - (b as any).from);

  return DecorationSet.create(doc, decorations);
}

/**
 * TipTap Extension — 注册 ProseMirror 插件
 */
export const InlinePolishExtension = Extension.create({
  name: 'inlinePolish',

  addProseMirrorPlugins() {
    return [
      new Plugin({
        key: polishPluginKey,
        state: {
          init() {
            return DecorationSet.empty;
          },
          apply(tr, value) {
            // 如果外部通过 meta 提供了新的 DecorationSet，直接使用
            const meta = tr.getMeta(polishPluginKey);
            if (meta !== undefined) return meta;
            // 否则，在文档变更时通过 mapping 更新已有位置
            if (tr.docChanged) {
              return value.map(tr.mapping, tr.doc);
            }
            return value;
          },
        },
        props: {
          decorations(state) {
            return polishPluginKey.getState(state);
          },
        },
      }),
    ];
  },
});

/**
 * 在 ProseMirror 文档中查找精确文本，返回 { from, to }
 * 如果串跨越多个 text node 会正确处理
 * 支持精确匹配和去除空白差异的模糊匹配
 */
export function findTextInDoc(
  doc: any,
  searchText: string,
  startAfter = 0,
): { from: number; to: number } | null {
  // 构建一个 textOffset → pmPos 的映射
  const chars: number[] = []; // chars[textIdx] = pmPos
  let fullText = '';

  doc.descendants((node: any, pos: number) => {
    if (node.isText && node.text) {
      for (let i = 0; i < node.text.length; i++) {
        chars.push(pos + i);
      }
      fullText += node.text;
    }
  });

  // 从 startAfter pm 位置对应的 text offset 开始搜索
  let textStart = 0;
  if (startAfter > 0) {
    for (let i = 0; i < chars.length; i++) {
      if (chars[i] >= startAfter) {
        textStart = i;
        break;
      }
    }
  }

  // 尝试精确匹配
  let idx = fullText.indexOf(searchText, textStart);

  // 如果精确匹配失败，尝试去除多余空白后匹配
  if (idx === -1) {
    const normalized = searchText.replace(/\s+/g, '');
    if (normalized.length >= 3) {
      // 在全文中滑动窗口查找
      for (let i = textStart; i <= fullText.length - normalized.length; i++) {
        let match = true;
        let ni = 0;
        let end = i;
        for (; end < fullText.length && ni < normalized.length; end++) {
          if (/\s/.test(fullText[end])) continue;
          if (fullText[end] !== normalized[ni]) { match = false; break; }
          ni++;
        }
        if (match && ni === normalized.length) {
          return {
            from: chars[i],
            to: chars[end - 1] + 1,
          };
        }
      }
    }
    return null;
  }

  return {
    from: chars[idx],
    to: chars[idx + searchText.length - 1] + 1,
  };
}
