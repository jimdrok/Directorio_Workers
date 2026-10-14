import unittest,tempfile,threading,json,urllib.request,urllib.error,http.cookiejar,os
import server
class Flow(unittest.TestCase):
 @classmethod
 def setUpClass(cls):
  cls.temp=tempfile.TemporaryDirectory();server.DB=cls.temp.name+'/test.sqlite';server.init()
  cls.http=server.ThreadingHTTPServer(('127.0.0.1',0),server.Handler);cls.base='http://127.0.0.1:'+str(cls.http.server_port)
  threading.Thread(target=cls.http.serve_forever,daemon=True).start()
 @classmethod
 def tearDownClass(cls):cls.http.shutdown();cls.http.server_close();cls.temp.cleanup()
 def client(self):return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,c,path,method='GET',data=None,headers=None):
  req=urllib.request.Request(self.base+'/api'+path,data=json.dumps(data).encode() if data is not None else None,method=method,headers={'Content-Type':'application/json',**(headers or {})})
  try:
   with c.open(req) as r:return r.status,json.load(r)
  except urllib.error.HTTPError as e:return e.code,json.load(e)
 def test_acceptance_and_permissions(self):
  owner=self.client();other=self.client();visitor=self.client()
  self.assertEqual(self.call(owner,'/register','POST',{'email':'ana@example.com','password':'abcdefghij12'})[0],200)
  self.assertEqual(self.call(other,'/register','POST',{'email':'otro@example.com','password':'abcdefghij12'})[0],200)
  data={'name':'Ana','category':'Plomería','phone':'0412 123 4567','location':'Macuto','areas':['Maiquetía'],'description':'Reparación de tuberías','status':'published'}
  status,p=self.call(owner,'/profile','PUT',data);self.assertEqual(status,200);self.assertEqual(p['phone'],'+584121234567')
  pid=p['id'];self.assertEqual(len(self.call(visitor,'/profiles?parish=Maiquet%C3%ADa')[1]),1);self.assertEqual(len(self.call(visitor,'/profiles?parish=Macuto')[1]),0)
  self.assertEqual(self.call(visitor,'/profiles/'+pid)[0],200)
  self.assertEqual(self.call(visitor,'/profile','PUT',data)[0],401)
  self.assertEqual(self.call(other,'/profile')[1],{'status':'draft'})
  self.assertEqual(self.call(other,'/admin')[0],403)
  self.assertEqual(self.call(other,'/profile/'+pid,'PUT',data)[0],404)
  data['phone']='123';self.assertEqual(self.call(owner,'/profile','PUT',data)[0],400)
  self.assertEqual(self.call(visitor,'/profiles/'+pid)[1]['phone'],'+584121234567')
  data['phone']='04121234567';data['status']='paused';self.assertEqual(self.call(owner,'/profile','PUT',data)[0],200)
  self.assertEqual(self.call(visitor,'/profiles/'+pid)[0],404);self.assertEqual(self.call(visitor,'/profiles')[1],[])
  data['status']='published';self.call(owner,'/profile','PUT',data)
  with server.connect() as c:c.execute('UPDATE users SET admin=1 WHERE email="otro@example.com"')
  self.assertEqual(self.call(other,'/admin/profile','PUT',{'id':pid,'hidden':True})[0],200)
  self.assertEqual(self.call(visitor,'/profiles/'+pid)[0],404)
  self.call(owner,'/profile','PUT',data);self.assertEqual(self.call(visitor,'/profiles')[1],[])
 def test_required_and_photos(self):
  with self.assertRaises(ValueError):server.validate({},True)
  with self.assertRaises(ValueError):server.validate({'photos':['bad']})
  with self.assertRaises(ValueError):server.validate({'photos':['']*7})

 def test_admin_login(self):
  admin=self.client()
  self.assertEqual(self.call(admin,'/login','POST',{'email':'admin','password':'incorrecta123'})[0],401)
  self.assertEqual(self.call(admin,'/login','POST',{'email':'admin','password':'guaria2026'})[0],200)
  self.assertTrue(self.call(admin,'/me')[1]['user']['admin'])
  self.assertEqual(self.call(admin,'/admin')[0],200)

 def test_origin_protection(self):
  data={'email':'admin','password':'guaria2026'}
  self.assertEqual(self.call(self.client(),'/login','POST',data,{'Origin':'http://localhost:5173','Host':'localhost:5173'})[0],200)
  self.assertEqual(self.call(self.client(),'/login','POST',data,{'Origin':'https://externo.example','Host':'localhost:5173'})[0],403)
