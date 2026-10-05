"""Read-only deployed page checks. Service access, when supplied, stays in memory."""
from concurrent.futures import ThreadPoolExecutor
from urllib.request import Request,urlopen
from urllib.error import HTTPError
import getpass,json,re
from xml.etree import ElementTree

access=json.loads(getpass.getpass('Public verification access (hidden): '))
web=access['web'].rstrip('/');admin=access['admin'].rstrip('/')
def request(url,headers=None,method='GET',data=None):
    try:response=urlopen(Request(url,headers={'User-Agent':'Mozilla/5.0',**(headers or {})},method=method,data=data),timeout=40)
    except HTTPError as error:response=error
    return response.status,response.read(),{key.lower():value for key,value in response.headers.items()}
auth={'OAI-Sites-Authorization':'Bearer '+access['token']}
status,body,_=request(admin+'/api/public/content',auth);assert status==200
data=json.loads(body);items=data['items']
expected={'creative-space','orbit-lab','palette-lab','a-desk-for-ideas','keep-the-process','how-the-homepage-chooses'}
assert expected.issubset({item['slug'] for item in items})
assert all(item['isPublic'] and item['status']=='published' for item in items)
assert not any(item['slug'].startswith('verification-') for item in items)
assert all(item['demoContent'] for item in items if item['slug'] in expected-{'creative-space'})
status,_,_=request(admin+'/api/settings',auth);assert status==401,'Service read token must not grant private settings access'
status,_,_=request(admin+'/api/content',auth,method='POST',data=b'{}');assert status==401,'Service read token must not grant content writes'
print('PASS published content, explicit example labels and private write boundary',flush=True)

paths=['/','/articles','/projects','/about','/rss.xml','/sitemap.xml','/robots.txt','/experiments/orbit','/experiments/palette','/artworks/orbit.svg','/artworks/palette.svg']
paths += [('/articles/' if item['kind']=='article' else '/projects/')+item['slug'] for item in items if item['slug'] in expected]
def check(path):
    status,body,headers=request(web+path);assert status==200,f'{path}: HTTP {status}'
    text=body.decode(errors='replace')
    assert '内容库暂时无法连接' not in text,f'{path}: CMS warning'
    if path=='/':assert 'Orbit Lab' in text and '首页推荐是怎样工作的' in text
    if path=='/articles/a-desk-for-ideas':assert '<table>' in text and '<video' in text and 'application/ld+json' in text
    if path=='/rss.xml':
        root=ElementTree.fromstring(body)
        assert len(root.findall('./channel/item'))>=3
    if path=='/sitemap.xml':
        root=ElementTree.fromstring(body)
        urls=[entry.text for entry in root.findall('{*}url/{*}loc')]
        assert web+'/projects/orbit-lab' in urls and web+'/articles/a-desk-for-ideas' in urls
    print('PASS '+path,flush=True)
with ThreadPoolExecutor(max_workers=4) as pool:list(pool.map(check,paths))

article=next(item for item in items if item['slug']=='a-desk-for-ideas')
media=re.search(r'/media/([a-f0-9-]{36})',article['markdown']);assert media
url=web+'/media/'+media[1]
status,full,headers=request(url);assert status==200 and full[4:8]==b'ftyp'
assert headers.get('content-type','').startswith('video/mp4')
status,part,headers=request(url,{'Range':'bytes=0-31'});assert status==206 and part==full[:32]
status,tail,_=request(url,{'Range':'bytes=-8'});assert status==206 and tail==full[-8:]
status,_,_=request(url,{'Range':'bytes=999999-'});assert status==416
print('PASS public MP4 full playback bytes, seek range, suffix and 416',flush=True)
print(json.dumps({'verification':'passed','public_pages_checked':len(paths),'published_examples':6,'browser_interaction_checked':False}),flush=True)
