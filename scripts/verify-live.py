"""Verify a deployed owner-private CMS. Read access through hidden stdin; never save it.
Runs temporary, reversible content checks; leaves the test entry in the trash.
"""
import base64, getpass, hashlib, json, sys, uuid
from urllib.request import Request, urlopen
from urllib.error import HTTPError

access=json.loads(getpass.getpass('Verification access (hidden): '))
origin=access['origin'].rstrip('/')
headers={'User-Agent':'Mozilla/5.0','OAI-Sites-Authorization':'Bearer '+access['token'],'x-admin-service-key':access['key']}

def call(path,method='GET',data=None,expected=200,extra=None,raw=False):
    request_headers={**headers,**(extra or {})}
    if isinstance(data,dict):data=json.dumps(data,ensure_ascii=False).encode();request_headers['Content-Type']='application/json'
    try:response=urlopen(Request(origin+path,data=data,headers=request_headers,method=method),timeout=30)
    except HTTPError as error:response=error
    body=response.read()
    if response.status!=expected:raise AssertionError(f'{method} {path}: expected {expected}, got {response.status}; {body[:180].decode(errors="replace")}')
    return body if raw else json.loads(body)

def publish(item):return call('/api/content/'+item['id'],'PATCH',{'action':'publish','expectedRevision':item['revision']})['item']
def upload(name,mime,data):
    boundary='creative-'+uuid.uuid4().hex
    body=(f'--{boundary}\r\nContent-Disposition: form-data; name="file"; filename="{name}"\r\nContent-Type: {mime}\r\n\r\n').encode()+data+f'\r\n--{boundary}--\r\n'.encode()
    return call('/api/media','POST',body,extra={'Content-Type':'multipart/form-data; boundary='+boundary})['item']

def verify():
    assert call('/api/health')['ok'] is True
    assert call('/api/settings')['connections']['coolify'] is False
    print('PASS durable CMS and private settings',flush=True)
    png=base64.b64decode('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+X2ioAAAAASUVORK5CYII=')
    media=upload('verification-pixel.png','image/png',png)
    assert media['sha256']==hashlib.sha256(png).hexdigest()
    assert upload('verification-pixel.png','image/png',png)['id']==media['id']
    call('/api/public/media/'+media['id'],expected=404,raw=True)
    item=None
    try:
        source='# 原始 Markdown\n\n**中文**与表格。\n\n![验收素材]('+media['url']+')\n'
        item=call('/api/content','POST',{'kind':'article','title':'临时验收内容（回收站保留）','slug':'verification-'+uuid.uuid4().hex[:12],'markdown':source,'tags':['验收'],'demoContent':True})['item']
        assert item['revision']==1 and not item['isPublic']
        assert not any(i['id']==item['id'] for i in call('/api/public/content')['items'])
        item=publish(item)
        assert call('/api/public/media/'+media['id'],raw=True)==png
        assert call('/api/public/media/'+media['id'],extra={'Range':'bytes=0-7'},expected=206,raw=True)==png[:8]
        assert call('/api/public/media/'+media['id'],extra={'Range':'bytes=-8'},expected=206,raw=True)==png[-8:]
        call('/api/public/media/'+media['id'],extra={'Range':'bytes=99999-'},expected=416,raw=True)
        print('PASS R2 upload, hash deduplication, draft visibility and HTTP ranges',flush=True)
        previous=item.copy()
        item=call('/api/content','POST',{**item,'markdown':source+'\n未发布的新修改','expectedRevision':item['revision']})['item']
        public=next(i for i in call('/api/public/content')['items'] if i['id']==item['id'])
        assert public['markdown']==source and item['hasUnpublishedChanges']
        call('/api/content','POST',{**previous,'markdown':'过期窗口覆盖','expectedRevision':previous['revision']},expected=409)
        history=call('/api/content/'+item['id']+'/revisions')['items']
        assert {r['revision'] for r in history}>={1,2}
        item=call('/api/content/'+item['id']+'/revisions','POST',{'revision':1,'expectedRevision':item['revision']})['item']
        assert item['revision']==3 and item['markdown']==source
        print('PASS publication snapshots, edit conflicts and non-destructive revision recovery',flush=True)
        item=publish(item)
        selected={'contentId':item['id'],'revision':item['revision'],'accounts':[{'platform':'xiaohongshu','accountId':'verification-no-real-account','accountTitle':'验收占位，不发送'}]}
        task=call('/api/distribution','POST',selected)['items'][0]
        assert call('/api/distribution','POST',selected)['items'][0]['id']==task['id']
        started=call('/api/distribution','PATCH',{'id':task['id'],'action':'start'})['item']
        call('/api/distribution','PATCH',{'id':task['id'],'action':'report','attempt':started['data']['attempt'],'status':'failed','message':'验收任务，未调用任何平台'})
        session=str(uuid.uuid4())
        for _ in range(2):call('/api/public/events','POST',{'contentId':item['id'],'session':session,'kind':'view'})
        call('/api/public/events','POST',{'contentId':item['id'],'session':session,'kind':'read'})
        public=next(i for i in call('/api/public/content')['items'] if i['id']==item['id'])
        assert public['views']==1 and public['reads']==1
        exported=call('/api/export')
        assert exported['version']==1 and any(i['id']==item['id'] and i['markdown']==source for i in exported['contents'])
        assert 'coolify_connection' not in exported['settings']
        print('PASS Xiaohongshu task idempotency, anonymous event deduplication and portable source export',flush=True)
        call('/api/content/'+item['id'],'DELETE')
        assert not any(i['id']==item['id'] for i in call('/api/public/content')['items'])
        item=call('/api/content/'+item['id'],'PATCH',{'action':'restore_trash','expectedRevision':item['revision']})['item']
        assert item['isPublic']
        item=call('/api/content/'+item['id'],'PATCH',{'action':'schedule','date':'2099-01-01T00:00:00.000Z','expectedRevision':item['revision']})['item']
        assert item['status']=='scheduled' and not item['isPublic']
        print('PASS recycle-bin recovery and future-publication filtering',flush=True)
    finally:
        if item:call('/api/content/'+item['id'],'DELETE')
    print(json.dumps({'verification':'passed','temporary_content':'trashed','external_posts_sent':0,'external_deployments_started':0}),flush=True)

if __name__=='__main__':verify()
