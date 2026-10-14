import os, json, sqlite3, secrets, hashlib, re, time
from http.server import ThreadingHTTPServer, SimpleHTTPRequestHandler
from pathlib import Path
ROOT=Path(__file__).parent
DB=os.environ.get('DATABASE_PATH',str(ROOT/'data'/'directorio.sqlite'))
CATEGORIES=['Plomería','Albañilería','Estilismo y barbería','Pintura','Electricidad','Costura','Carpintería','Refrigeración','Limpieza']
PARISHES=['Caraballeda','Carayaca','Carlos Soublette','Caruao','Catia La Mar','El Junko','La Guaira','Macuto','Maiquetía','Naiguatá','Urimare']
def connect():
 c=sqlite3.connect(DB); c.row_factory=sqlite3.Row; return c
def init():
 Path(DB).parent.mkdir(parents=True,exist_ok=True)
 with connect() as c:
  c.executescript('CREATE TABLE IF NOT EXISTS users(id TEXT PRIMARY KEY,email TEXT UNIQUE,password TEXT,salt TEXT,admin INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS sessions(token TEXT PRIMARY KEY,user_id TEXT,expires INTEGER); CREATE TABLE IF NOT EXISTS profiles(id TEXT PRIMARY KEY,user_id TEXT UNIQUE,data TEXT,status TEXT DEFAULT "draft",hidden INTEGER DEFAULT 0); CREATE TABLE IF NOT EXISTS categories(id INTEGER PRIMARY KEY,name TEXT UNIQUE,active INTEGER DEFAULT 1);')
  if not c.execute('SELECT 1 FROM categories').fetchone(): c.executemany('INSERT INTO categories(name) VALUES(?)',[(n,) for n in CATEGORIES])
  email=os.environ.get('ADMIN_EMAIL','admin@laguaira.local'); password=os.environ.get('ADMIN_PASSWORD','guaria2026')
  if email and password:
   if len(password)<10: raise ValueError('ADMIN_PASSWORD debe tener al menos 10 caracteres')
   salt=secrets.token_hex(16); digest=hashlib.scrypt(password.encode(),salt=salt.encode(),n=16384,r=8,p=1).hex()
   c.execute('INSERT INTO users VALUES(?,?,?,?,1) ON CONFLICT(email) DO UPDATE SET admin=1,password=excluded.password,salt=excluded.salt',(secrets.token_hex(12),email.lower().strip(),digest,salt))
def validate(data,publish=False):
 d={k:data.get(k,'') for k in ['name','category','phone','location','description','experience','avatar']}
 for k in ['name','category','phone','location','description','avatar']: d[k]=str(d[k]).strip()
 d['areas']=data.get('areas',[]); d['photos']=data.get('photos',[]); d['testimonials']=data.get('testimonials',[])
 if not isinstance(d['areas'],list) or any(a not in PARISHES for a in d['areas']): raise ValueError('Selecciona parroquias válidas')
 if d['location'] and d['location'] not in PARISHES: raise ValueError('Parroquia inválida')
 if d['phone']:
  phone=re.sub(r'[\s()\-]','',d['phone'])
  if phone.startswith('00'): phone='+'+phone[2:]
  if re.fullmatch(r'0\d{10}',phone): phone='+58'+phone[1:]
  if re.fullmatch(r'58\d{10}',phone): phone='+'+phone
  if not re.fullmatch(r'\+[1-9]\d{7,14}',phone): raise ValueError('WhatsApp: usa un número internacional, por ejemplo +584121234567')
  d['phone']=phone
 if d['experience']!='':
  try: d['experience']=int(d['experience'])
  except (ValueError,TypeError): raise ValueError('Los años de experiencia deben ser un número entero')
  if not 0<=d['experience']<=80: raise ValueError('Experiencia: indica entre 0 y 80 años')
 if not isinstance(d['photos'],list) or len(d['photos'])>6: raise ValueError('Puedes agregar hasta 6 fotos')
 for src in [d['avatar']]+d['photos']:
  if src and (not isinstance(src,str) or not re.fullmatch(r'data:image/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+',src) or len(src)>2800000): raise ValueError('Usa fotos JPG, PNG o WebP de hasta 2 MB')
 if not isinstance(d['testimonials'],list) or len(d['testimonials'])>10: raise ValueError('Máximo 10 testimonios')
 d['testimonials']=[{'name':str(t.get('name','')).strip()[:100],'text':str(t.get('text','')).strip()[:1000]} for t in d['testimonials'] if isinstance(t,dict)]
 if any(not t['name'] or not t['text'] for t in d['testimonials']): raise ValueError('Completa el nombre y texto de cada testimonio')
 if len(d['name'])>100 or len(d['description'])>5000: raise ValueError('Nombre o descripción demasiado largos')
 if publish and (any(not d[k] for k in ['name','category','phone','location','description']) or not d['areas']): raise ValueError('Completa nombre, oficio, WhatsApp, ubicación, cobertura y servicios para publicar')
 if d['category']:
  with connect() as c:
   if not c.execute('SELECT 1 FROM categories WHERE name=? AND active=1',(d['category'],)).fetchone(): raise ValueError('Selecciona un oficio activo')
 return d
class Handler(SimpleHTTPRequestHandler):
 def __init__(self,*a,**kw): super().__init__(*a,directory=str(ROOT/'dist'),**kw)
 def log_message(self,*a): pass
 def send(self,status,data,cookie=None):
  body=json.dumps(data,ensure_ascii=False).encode(); self.send_response(status); self.send_header('Content-Type','application/json; charset=utf-8'); self.send_header('Cache-Control','no-store'); self.send_header('X-Content-Type-Options','nosniff')
  if cookie: self.send_header('Set-Cookie',cookie)
  self.end_headers(); self.wfile.write(body)
 def user(self):
  token=next((p.strip()[8:] for p in self.headers.get('Cookie','').split(';') if p.strip().startswith('session=')),None)
  with connect() as c: return c.execute('SELECT users.* FROM users JOIN sessions ON users.id=sessions.user_id WHERE token=? AND expires>?',(token,time.time())).fetchone()
 def do_GET(self):
  if self.path.startswith('/api/'): self.api('GET')
  else:
   if not (ROOT/'dist'/self.path.split('?')[0].lstrip('/')).is_file(): self.path='/index.html'
   super().do_GET()
 def do_POST(self): self.api('POST')
 def do_PUT(self): self.api('PUT')
 def api(self,method):
  from urllib.parse import urlparse,parse_qs
  path=urlparse(self.path).path; query=parse_qs(urlparse(self.path).query)
  try:
   d={}
   if method!='GET':
    origin=self.headers.get('Origin')
    if origin and urlparse(origin).netloc!=self.headers.get('Host'): return self.send(403,{'error':'Origen no permitido'})
    size=int(self.headers.get('Content-Length',0))
    if size>20000000: return self.send(413,{'error':'Las fotos exceden el límite permitido'})
    d=json.loads(self.rfile.read(size) or '{}')
   u=self.user()
   with connect() as c:
    if path=='/api/config' and method=='GET': return self.send(200,{'categories':[r['name'] for r in c.execute('SELECT name FROM categories WHERE active=1')],'parishes':PARISHES})
    if path in ['/api/register','/api/login'] and method=='POST':
     email=str(d.get('email','')).strip().lower(); pw=str(d.get('password',''))
     if path=='/api/login' and email=='admin': email=os.environ.get('ADMIN_EMAIL','admin@laguaira.local').strip().lower()
     if not re.fullmatch(r'[^\s@]+@[^\s@]+\.[^\s@]+',email) or len(pw)<10 or len(pw)>200: raise ValueError('Usa un correo válido y una contraseña de 10 a 200 caracteres')
     if path.endswith('register'):
      salt=secrets.token_hex(16); uid=secrets.token_hex(12)
      try: c.execute('INSERT INTO users VALUES(?,?,?,?,0)',(uid,email,hashlib.scrypt(pw.encode(),salt=salt.encode(),n=16384,r=8,p=1).hex(),salt))
      except sqlite3.IntegrityError: raise ValueError('Este correo ya está registrado')
     else:
      row=c.execute('SELECT * FROM users WHERE email=?',(email,)).fetchone()
      if not row or not secrets.compare_digest(row['password'],hashlib.scrypt(pw.encode(),salt=row['salt'].encode(),n=16384,r=8,p=1).hex()): return self.send(401,{'error':'Correo o contraseña incorrectos'})
      uid=row['id']
     token=secrets.token_hex(32); c.execute('INSERT INTO sessions VALUES(?,?,?)',(token,uid,int(time.time()+604800)))
     return self.send(200,{'ok':True},f'session={token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=604800'+('; Secure' if os.environ.get('COOKIE_SECURE')=='1' else ''))
    if path=='/api/logout' and method=='POST':
     if u: c.execute('DELETE FROM sessions WHERE user_id=?',(u['id'],))
     return self.send(200,{'ok':True},'session=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0')
    if path=='/api/me' and method=='GET': return self.send(200,{'user':{'email':u['email'],'admin':bool(u['admin'])} if u else None})
    if path=='/api/profiles' and method=='GET':
     rows=[]
     for r in c.execute('SELECT * FROM profiles WHERE status="published" AND hidden=0'):
      p=json.loads(r['data']); p['id']=r['id']
      if query.get('category',[''])[0] and p['category']!=query['category'][0]: continue
      if query.get('parish',[''])[0] and query['parish'][0] not in p['areas']: continue
      rows.append(p)
     return self.send(200,rows)
    if path.startswith('/api/profiles/') and method=='GET':
     r=c.execute('SELECT * FROM profiles WHERE id=? AND status="published" AND hidden=0',(path.split('/')[-1],)).fetchone()
     return self.send(200,dict(json.loads(r['data']),id=r['id'])) if r else self.send(404,{'error':'Este perfil no está disponible'})
    if not u: return self.send(401,{'error':'Inicia sesión para continuar'})
    if path=='/api/profile':
     r=c.execute('SELECT * FROM profiles WHERE user_id=?',(u['id'],)).fetchone()
     if method=='GET': return self.send(200,dict(json.loads(r['data']),id=r['id'],status=r['status'],hidden=bool(r['hidden'])) if r else {'status':'draft'})
     if method=='PUT':
      status=d.get('status','draft')
      if status not in ['draft','published','paused']: raise ValueError('Estado inválido')
      p=validate(d,status=='published'); pid=r['id'] if r else secrets.token_hex(12)
      if r and json.loads(r['data']).get('demo'): p['demo']=True
      c.execute('INSERT INTO profiles(id,user_id,data,status) VALUES(?,?,?,?) ON CONFLICT(user_id) DO UPDATE SET data=excluded.data,status=excluded.status',(pid,u['id'],json.dumps(p),status))
      return self.send(200,dict(p,id=pid,status=status,hidden=bool(r['hidden']) if r else False))
    if path.startswith('/api/admin'):
     if not u['admin']: return self.send(403,{'error':'Acceso exclusivo para administradores'})
     if method=='GET': return self.send(200,{'profiles':[dict(json.loads(r['data']),id=r['id'],status=r['status'],hidden=bool(r['hidden'])) for r in c.execute('SELECT * FROM profiles')],'categories':[dict(r) for r in c.execute('SELECT * FROM categories')]})
     if path=='/api/admin/profile' and method=='PUT': c.execute('UPDATE profiles SET hidden=? WHERE id=?',(bool(d.get('hidden')),d.get('id'))); return self.send(200,{'ok':True})
     if path=='/api/admin/category' and method=='PUT':
      name=str(d.get('name','')).strip()
      if not name or len(name)>80: raise ValueError('Indica un nombre de categoría de hasta 80 caracteres')
      c.execute('INSERT INTO categories(name,active) VALUES(?,?) ON CONFLICT(name) DO UPDATE SET active=excluded.active',(name,bool(d.get('active',True)))); return self.send(200,{'ok':True})
    return self.send(404,{'error':'Ruta no encontrada'})
  except (ValueError,TypeError,KeyError) as e: self.send(400,{'error':str(e)})
  except Exception: self.send(500,{'error':'No pudimos guardar los cambios. Inténtalo nuevamente.'})
if __name__=='__main__':
 init(); port=int(os.environ.get('PORT','3000')); print(f'La Guaira Conecta: http://localhost:{port}',flush=True); ThreadingHTTPServer(('127.0.0.1',port),Handler).serve_forever()
