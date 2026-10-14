"""Pruebas contra wrangler dev. Ejecutar con WORKER_TEST_URL=http://localhost:8787."""
import os, json, unittest, urllib.request, urllib.error, http.cookiejar, uuid

@unittest.skipUnless(os.environ.get('WORKER_TEST_URL'), 'Requiere wrangler dev y WORKER_TEST_URL')
class CloudflareFlow(unittest.TestCase):
 def client(self):return urllib.request.build_opener(urllib.request.HTTPCookieProcessor(http.cookiejar.CookieJar()))
 def call(self,client,path,method='GET',data=None,origin=None):
  headers={'Content-Type':'application/json'}
  if origin:headers['Origin']=origin
  request=urllib.request.Request(os.environ['WORKER_TEST_URL']+'/api'+path,method=method,data=json.dumps(data).encode() if data is not None else None,headers=headers)
  try:
   with client.open(request) as response:
    self.assertIn('application/json',response.headers['Content-Type']);return response.status,json.load(response)
  except urllib.error.HTTPError as error:return error.code,json.load(error)
 def test_deployed_routes_and_permissions(self):
  visitor=self.client();admin=self.client();owner=self.client();other=self.client()
  self.assertEqual(len(self.call(visitor,'/config')[1]['categories']),9)
  profiles=self.call(visitor,'/profiles')[1];self.assertEqual(len([p for p in profiles if p.get('demo')]),9)
  self.assertEqual(self.call(admin,'/login','POST',{'email':'admin','password':'guaria2026'})[0],200)
  self.assertEqual(self.call(admin,'/admin')[0],200)
  self.assertEqual(self.call(visitor,'/login','POST',{'email':'admin','password':'guaria2026'},'https://externo.example')[0],403)
  email=uuid.uuid4().hex+'@example.com'
  self.assertEqual(self.call(owner,'/register','POST',{'email':email,'password':'prueba2026ok'})[0],200)
  self.assertEqual(self.call(other,'/register','POST',{'email':uuid.uuid4().hex+'@example.com','password':'prueba2026ok'})[0],200)
  data={'name':'Prueba Worker','category':'Plomería','location':'Macuto','areas':['Maiquetía'],'phone':'04121234567','description':'Reparaciones','experience':2,'photos':[],'testimonials':[],'status':'published'}
  status,p=self.call(owner,'/profile','PUT',data);self.assertEqual(status,200);self.assertEqual(p['phone'],'+584121234567');pid=p['id']
  self.assertTrue(any(p['id']==pid for p in self.call(visitor,'/profiles?parish=Maiquet%C3%ADa')[1]))
  self.assertFalse(any(p['id']==pid for p in self.call(visitor,'/profiles?parish=Macuto')[1]))
  self.assertEqual(self.call(other,'/profile')[1],{'status':'draft'})
  self.assertEqual(self.call(other,'/admin')[0],403)
  # Exercise chunked persistence beyond the Durable Object per-value KV limit.
  data['avatar']='data:image/png;base64,'+'A'*200000
  self.assertEqual(self.call(owner,'/profile','PUT',data)[0],200)
  self.assertEqual(len(self.call(visitor,'/profiles/'+pid)[1]['avatar']),200022)
  data['status']='paused';self.assertEqual(self.call(owner,'/profile','PUT',data)[0],200)
  self.assertEqual(self.call(visitor,'/profiles/'+pid)[0],404)
  data['status']='published';self.call(owner,'/profile','PUT',data)
  self.assertEqual(self.call(admin,'/admin/profile','PUT',{'id':pid,'hidden':True})[0],200)
  self.assertEqual(self.call(visitor,'/profiles/'+pid)[0],404)
  self.call(owner,'/profile','PUT',data);self.assertEqual(self.call(visitor,'/profiles/'+pid)[0],404)
  self.assertEqual(self.call(visitor,'/unknown')[0],401)
  self.assertEqual(self.call(admin,'/unknown')[0],404)
