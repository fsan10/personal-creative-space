"""Create explicitly marked editable examples; never overwrite an existing slug."""
from pathlib import Path
import getpass,json,uuid
from urllib.request import Request,urlopen

access=json.loads(getpass.getpass('Seed access (hidden): '));origin=access['origin'].rstrip('/');web=access['web'].rstrip('/')
headers={'User-Agent':'Mozilla/5.0','OAI-Sites-Authorization':'Bearer '+access['token'],'x-admin-service-key':access['key']}
def call(path,method='GET',data=None,extra=None):
 h={**headers,**(extra or {})}
 if isinstance(data,dict):data=json.dumps(data,ensure_ascii=False).encode();h['Content-Type']='application/json'
 with urlopen(Request(origin+path,data=data,headers=h,method=method),timeout=30) as response:return json.load(response)
existing=call('/api/content')['items'];lookup={(i['kind'],i['slug']):i for i in existing};created=[]
video_url=''
if access.get('video'):
 data=Path(access['video']).read_bytes();boundary='seed-'+uuid.uuid4().hex
 body=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="creative-demo.mp4"\r\nContent-Type: video/mp4\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
 video_url=call('/api/media','POST',body,{'Content-Type':'multipart/form-data; boundary='+boundary})['item']['url']
examples=[
 {'kind':'project','slug':'creative-space','title':'橘子的创作桌','excerpt':'一个把文章、作品和小小实验放在一起的个人空间。独立前台，独立内容管理。','accent':'blue','tags':['个人网站','创作'],'github':'https://github.com/fsan10/personal-creative-space','demo':web,'tech':['React','TypeScript','Markdown','D1 / R2'],'projectStatus':'live','demoContent':False,'cover':'','editorial':5,'markdown':'## 一个可以不断长大的空间\n\n这是当前正在运行的网站。文章以 Markdown 保存，媒体放在独立内容库；前台读取已发布版本。\n\n### 已经有的能力\n\n- Markdown 写作、历史版本和回收站\n- 图片、视频和可移植备份\n- 文章与作品的混合推荐\n- 可连接多平台分发和项目运行环境\n\n### 继续创作\n\n可以在管理台添加自己的文章、替换示例作品，也可以把公开仓库关联到自己的项目运行环境。'},
 {'kind':'project','slug':'orbit-lab','title':'Orbit Lab · 轨道实验','excerpt':'转动、暂停、改变节奏。用一个小小的交互，感受动画的速度与留白。','accent':'orange','tags':['交互实验','动画'],'demo':'/experiments/orbit','tech':['Web Animations API','React','CSS'],'projectStatus':'live','demoContent':True,'cover':'/artworks/orbit.svg','editorial':4,'markdown':'## 可以运行的内置示例\n\n这是网站提供的动画实验示例，可以替换为你自己的作品。\n\n点击在线体验，拖动速度滑块；暂停和继续会保留当前的动画位置。系统启用减少动态效果时，实验默认暂停。\n\n> 这是视觉交互实验，没有作为真实天体模型使用。'},
 {'kind':'project','slug':'palette-lab','title':'Palette Lab · 配色实验','excerpt':'拖动色相，让一组颜色一起变化。找到喜欢的组合，再复制颜色到自己的作品里。','accent':'lilac','tags':['交互实验','设计'],'demo':'/experiments/palette','tech':['HSL','React','TypeScript'],'projectStatus':'live','demoContent':True,'cover':'/artworks/palette.svg','editorial':4,'markdown':'## 可以运行的内置示例\n\n这是网站提供的配色实验示例，可以替换为你自己的作品。\n\n拖动色相滑块，或者换一组颜色；点击颜色卡片可以复制 HEX 色值。\n\n### 从一个颜色开始\n\n颜色组合使用 HSL 计算生成，展示卡片和复制结果使用同一份颜色数据。'},
 {'kind':'article','slug':'a-desk-for-ideas','title':'搭一张自己的创作桌','excerpt':'把想法写下来，把喜欢的东西做出来。这个空间从一页 Markdown 开始。','accent':'yellow','tags':['创作','Markdown'],'demoContent':True,'editorial':4,'markdown':'# 从一页空白开始\n\n> 这是一篇可以编辑或删除的示例文章，用来展示写作、排版与媒体能力。\n\n博客可以收下文字，也可以收下正在做的作品。先把一个小小的想法放上来，再让它慢慢长大。\n\n## Markdown，让内容有自己的结构\n\n**加粗一句重要的话**，列出下一步，或者留下一个代码片段：\n\n```js\nconst idea = "先做一个小小的版本";\nconsole.log(idea);\n```\n\n| 想法 | 下一步 |\n| --- | --- |\n| 一篇文章 | 写一个开头 |\n| 一个作品 | 做一个可以体验的版本 |\n\n## 也给画面留一个位置\n\n图片与视频可以通过上传、粘贴、拖放或外部链接插入。'+(('\n\n<video src="'+video_url+'" controls preload="metadata"></video>\n\n*内置示例视频，用来体验播放和媒体导出。*') if video_url else '')+'\n\n## 下一篇，由你来写\n\n打开管理台，改掉这篇示例，或者保存自己的第一篇文字。'},
 {'kind':'article','slug':'keep-the-process','title':'为什么给作品留下过程','excerpt':'成品之外，那些选择、修改和重新开始，也值得被好好保存。','accent':'lilac','tags':['创作','设计'],'demoContent':True,'editorial':3,'markdown':'## 作品的另一半，是它怎么长出来的\n\n> 这是一篇可替换的示例随笔，内容用于展示文章和作品之间的关联。\n\n作品详情页可以介绍结果，文章可以留下过程。两者关联起来，读者就能从一个想法走到一次真正的体验。\n\n### 给过程三个小小的入口\n\n1. 为什么要做：最初遇到的具体问题。\n2. 做过什么选择：保留最后选择的理由。\n3. 下次怎么改：把未完成的想法留下来。\n\n不需要一次写得完整。保存草稿、留下版本，再慢慢把它补齐。'},
 {'kind':'article','slug':'how-the-homepage-chooses','title':'首页推荐是怎样工作的','excerpt':'编辑精选、内容完整度、新鲜度和阅读反馈，一起决定首页的创作顺序。','accent':'orange','tags':['个人网站','推荐算法'],'demoContent':True,'editorial':4,'markdown':'## 让文章和作品一起被看见\n\n> 这是一篇可编辑的功能说明示例，描述当前网站实际采用的推荐规则。\n\n首页在已经发布的文章和作品中选择内容。草稿、回收站内容和未到发布时间的文章不会进入推荐。\n\n### 默认的五个因素\n\n| 因素 | 默认权重 |\n| --- | --- |\n| 编辑推荐分 | 30% |\n| 内容完整度 | 25% |\n| 新鲜度 | 20% |\n| 匿名阅读反馈 | 15% |\n| 所选主题相关性 | 10% |\n\n新网站没有很多阅读数据时，会使用平滑后的反馈值，给新内容保留机会。首页还会照顾文章与作品的类型比例，以及主题的多样性。\n\n### 可以自己调整\n\n在管理台调整权重、置顶内容和探索比例。读者自愿开启匿名反馈后，网站只保存按日去重的阅读事件摘要。\n\n点击作品页，也能继续看到同主题的文章。'}
]
for fields in examples:
 key=(fields['kind'],fields['slug'])
 if key in lookup:
  print('SKIP existing '+fields['slug'],flush=True);continue
 item=call('/api/content','POST',fields)['item'];lookup[key]=item;created.append(key);print('CREATED '+fields['slug'],flush=True)
relations={'creative-space':['how-the-homepage-chooses','a-desk-for-ideas'],'orbit-lab':['keep-the-process'],'palette-lab':['keep-the-process'],'a-desk-for-ideas':['creative-space'],'keep-the-process':['orbit-lab','palette-lab'],'how-the-homepage-chooses':['creative-space']}
for key in created:
 item=lookup[key];related=[value['id'] for (_,slug),value in lookup.items() if slug in relations.get(item['slug'],[])]
 if related:item=call('/api/content','POST',{**item,'relatedIds':related,'expectedRevision':item['revision']})['item']
 call('/api/content/'+item['id'],'PATCH',{'action':'publish','expectedRevision':item['revision']});print('PUBLISHED '+item['slug'],flush=True)
print(json.dumps({'created':len(created),'examples_explicitly_marked':True,'existing_content_overwritten':False}),flush=True)
