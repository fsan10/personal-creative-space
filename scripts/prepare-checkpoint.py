"""Prepare staged Git contents for the connected GitHub Git-data API.
No credentials are read or written. Large text is split into bounded transport chunks.
"""
from pathlib import Path
import subprocess,json,base64,sys
root=Path(__file__).resolve().parents[1]
subprocess.run(['git','add','--all'],cwd=root,check=True)
subprocess.run(['git','diff','--cached','--check'],cwd=root,check=True)
paths=subprocess.check_output(['git','diff','--cached','--name-only','-z'],cwd=root).decode().split('\0')
entries=[]
for path in filter(None,paths):
 p=root/path
 if not p.exists(): entries.append({'path':path,'mode':'100644','type':'blob','sha':None});continue
 data=p.read_bytes()
 try: content=data.decode('utf-8'); encoding='utf-8'
 except UnicodeDecodeError: content=base64.b64encode(data).decode();encoding='base64'
 mode=subprocess.check_output(['git','ls-files','-s','--',path],cwd=root).decode().split()[0]
 for start in range(0,max(1,len(content)),10000):
  entries.append({'path':path,'mode':mode,'type':'blob','encoding':encoding,'part':start//10000,'content':content[start:start+10000]})
chunks=[];current=[];size=0
for entry in entries:
 n=len(json.dumps(entry,ensure_ascii=False).encode())
 if current and size+n>35000:chunks.append(current);current=[];size=0
 current.append(entry);size+=n
if current:chunks.append(current)
output=Path(sys.argv[1]);output.mkdir(parents=True,exist_ok=True)
for i,chunk in enumerate(chunks):(output/f'{i}.json').write_text(json.dumps(chunk,ensure_ascii=False))
meta={'chunks':len(chunks),'parent_sha':subprocess.check_output(['git','rev-parse','HEAD'],cwd=root).decode().strip(),'tree_sha':subprocess.check_output(['git','write-tree'],cwd=root).decode().strip(),'files':len([p for p in paths if p])}
(output/'meta.json').write_text(json.dumps(meta));print(json.dumps(meta))
