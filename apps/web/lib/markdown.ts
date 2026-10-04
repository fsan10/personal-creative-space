import { marked } from 'marked';
import sanitizeHtml from 'sanitize-html';

export function renderMarkdown(markdown:string):string {
  const html = marked.parse(markdown, { gfm:true, breaks:false, async:false });
  return sanitizeHtml(html, {
    allowedTags: [...sanitizeHtml.defaults.allowedTags,'img','video','source','iframe','input'],
    allowedAttributes: { ...sanitizeHtml.defaults.allowedAttributes,
      a:['href','title','target','rel'], img:['src','alt','title','width','height','loading'],
      video:['src','controls','poster','preload','width'], source:['src','type'],
      iframe:['src','title','width','height','allow','allowfullscreen','loading'], input:['type','checked','disabled'],
      code:['class'], pre:['class'], td:['align'], th:['align'] },
    allowedSchemes:['http','https','mailto'], allowedSchemesByTag:{iframe:['https']},
    allowedIframeHostnames:['www.youtube-nocookie.com','www.youtube.com','player.bilibili.com','player.vimeo.com'],
    transformTags: {
      a:(_,attributes) => ({tagName:'a',attribs:{...attributes,rel:'noopener noreferrer'}}),
      input:(_,attributes) => ({tagName:'input',attribs:{type:'checkbox',disabled:'disabled',...(attributes.checked!==undefined?{checked:'checked'}:{})}}),
      img:(_,attributes) => ({tagName:'img',attribs:{...attributes,loading:'lazy'}}),
    },
  });
}
export function readingMinutes(markdown:string) { return Math.max(1,Math.ceil(markdown.replace(/<[^>]*>/g,'').length/700)); }
export function embedVideo(url:string):string {
  const u=new URL(url);
  if(u.protocol!=='https:') throw new Error('视频链接需要 HTTPS');
  if(['player.bilibili.com','www.youtube-nocookie.com','player.vimeo.com'].includes(u.hostname)) {
    return `<iframe src="${u.href.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" title="嵌入视频" loading="lazy" allowfullscreen></iframe>`;
  }
  if(!/\.(mp4|webm)(\?|$)/i.test(u.href)) throw new Error('请使用 MP4/WebM 链接，或 B 站、YouTube、Vimeo 的嵌入地址');
  return `<video src="${u.href.replace(/&/g,'&amp;').replace(/"/g,'&quot;')}" controls preload="metadata"></video>`;
}
