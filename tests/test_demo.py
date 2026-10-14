import json
import tempfile
import unittest
import server
from scripts.seed_demo import seed

class DemoProfiles(unittest.TestCase):
 def test_seed_is_complete_and_repeatable(self):
  original=server.DB
  try:
   with tempfile.TemporaryDirectory() as directory:
    server.DB=directory+'/demo.sqlite'
    seed(); seed()
    with server.connect() as connection:
     rows=connection.execute('SELECT * FROM profiles').fetchall()
     self.assertEqual(len(rows),9)
     profiles=[json.loads(row['data']) for row in rows]
     self.assertEqual({p['category'] for p in profiles},set(server.CATEGORIES))
     self.assertEqual({area for p in profiles for area in p['areas']},set(server.PARISHES))
     self.assertTrue(all(p['demo'] and not p['phone'] and p['testimonials'] and 'TRAYECTORIA LABORAL' in p['description'] for p in profiles))
     self.assertTrue(all(row['status']=='published' for row in rows))
  finally: server.DB=original
