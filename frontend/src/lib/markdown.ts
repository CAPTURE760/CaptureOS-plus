/**
 * 简易 Markdown 渲染器 — 纯正则，不依赖外部库。
 * 支持：标题、粗体、斜体、行内代码、代码块、列表、引用、链接、图片、分割线、换行
 */

export function renderMarkdown(text: string): string {
  if (!text) return '';

  let html = text;

  // 转义 HTML（防 XSS）
  html = html
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');

  // 代码块 ```...```
  html = html.replace(/```(\w*)\n([\s\S]*?)```/g, (_, lang, code) => {
    return `<pre class="bg-gray-100 rounded p-3 my-2 text-sm overflow-x-auto"><code class="language-${lang}">${code.trim()}</code></pre>`;
  });

  // 行内代码
  html = html.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1.5 py-0.5 rounded text-sm text-pink-600">$1</code>');

  // 标题 h1-h4
  html = html.replace(/^#### (.+)$/gm, '<h4 class="text-base font-bold mt-3 mb-1">$1</h4>');
  html = html.replace(/^### (.+)$/gm, '<h3 class="text-lg font-bold mt-4 mb-2">$1</h3>');
  html = html.replace(/^## (.+)$/gm, '<h2 class="text-xl font-bold mt-4 mb-2">$1</h2>');
  html = html.replace(/^# (.+)$/gm, '<h1 class="text-2xl font-bold mt-4 mb-2">$1</h1>');

  // 粗体和斜体
  html = html.replace(/\*\*\*(.+?)\*\*\*/g, '<strong><em>$1</em></strong>');
  html = html.replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  html = html.replace(/\*(.+?)\*/g, '<em>$1</em>');

  // 删除线
  html = html.replace(/~~(.+?)~~/g, '<del>$1</del>');

  // 链接和图片
  html = html.replace(/!\[([^\]]*)\]\(([^)]+)\)/g, '<img src="$2" alt="$1" class="max-w-full rounded my-2" />');
  html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank" rel="noopener noreferrer" class="text-blue-600 hover:underline">$1</a>');

  // 分割线
  html = html.replace(/^---+$/gm, '<hr class="border-gray-300 my-4" />');

  // 引用
  html = html.replace(/^&gt; (.+)$/gm, '<blockquote class="border-l-4 border-gray-300 pl-4 py-1 my-2 text-gray-600 italic">$1</blockquote>');

  // 无序列表
  html = html.replace(/^[\-\*] (.+)$/gm, '<li class="ml-4 list-disc">$1</li>');

  // 有序列表
  html = html.replace(/^\d+\. (.+)$/gm, '<li class="ml-4 list-decimal">$1</li>');

  // 连续的 li 包裹成 ul
  html = html.replace(/((?:<li class="ml-4 list-disc">.*<\/li>\n?)+)/g, '<ul class="my-2">$1</ul>');
  html = html.replace(/((?:<li class="ml-4 list-decimal">.*<\/li>\n?)+)/g, '<ol class="my-2">$1</ol>');

  // 换行 → <br>（连续两个换行变成段落间隔）
  html = html.replace(/\n\n+/g, '</p><p class="my-2">');
  html = html.replace(/\n/g, '<br />');

  // 包裹段落
  html = `<p>${html}</p>`;

  // 清理空段落
  html = html.replace(/<p>\s*<\/p>/g, '');

  return html;
}
