"""Ejemplos locales ficticios. Repetir el comando no reemplaza perfiles existentes."""
import sys, json, secrets, hashlib
from pathlib import Path
sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
import server

EXAMPLES = [
 ('plomeria','Luis Mendoza','Plomería','Maiquetía',12,['Maiquetía','Urimare','Carlos Soublette'],
  'Instalación y reparación de tuberías, cambio de griferías, detección de filtraciones y mantenimiento de tanques.',
  '2014–2018 · Ayudante de mantenimiento residencial.\n2018–actualidad · Plomero independiente para viviendas y pequeños comercios.',
  'Formación práctica en instalaciones sanitarias y mantenimiento preventivo.',
  'Reparó una filtración y explicó cómo cuidar la instalación.'),
 ('albanileria','Carlos Salazar','Albañilería','Catia La Mar',15,['Catia La Mar','Carayaca','El Junko'],
  'Reparación de paredes, colocación de cerámica, frisos, pisos y pequeñas remodelaciones.',
  '2011–2017 · Oficial de obra en remodelaciones residenciales.\n2017–actualidad · Trabajos independientes de albañilería y acabados.',
  'Capacitación práctica en lectura de medidas, nivelación y acabados.',
  'Dejó el piso nivelado y el área de trabajo ordenada.'),
 ('estilismo','Mariana Rivas','Estilismo y barbería','Macuto',8,['Macuto','La Guaira','Caraballeda'],
  'Cortes para damas y caballeros, arreglo de barba, peinados y asesoría de cuidado capilar. Atención a domicilio previa coordinación.',
  '2018–2021 · Estilista en salón de belleza.\n2021–actualidad · Servicio independiente de estilismo y barbería.',
  'Cursos de corte, colorimetría básica e higiene de herramientas.',
  'Escuchó lo que quería y me orientó con el corte.'),
 ('pintura','José Fuentes','Pintura','La Guaira',10,['La Guaira','Carlos Soublette','Macuto'],
  'Pintura interior y exterior, preparación de superficies, sellado de grietas y acabados decorativos.',
  '2016–2020 · Pintor en mantenimiento de edificios.\n2020–actualidad · Pintura residencial y comercial por proyecto.',
  'Formación práctica en preparación de superficies y aplicación de recubrimientos.',
  'Protegió los muebles y dejó un acabado uniforme.'),
 ('electricidad','Andrea Márquez','Electricidad','Urimare',9,['Urimare','Maiquetía','Catia La Mar'],
  'Instalación de luminarias y tomacorrientes, revisión de circuitos y mantenimiento de instalaciones eléctricas residenciales.',
  '2017–2022 · Técnica de mantenimiento residencial.\n2022–actualidad · Electricista independiente.',
  'Formación técnica en electricidad residencial y seguridad en el trabajo.',
  'Explicó la falla y las opciones antes de comenzar.'),
 ('costura','Elena Pacheco','Costura','Caraballeda',18,['Caraballeda','Naiguatá','Caruao'],
  'Ajustes de ropa, confección de uniformes, reparación de cierres, ruedos y elaboración de cortinas.',
  '2008–2016 · Costurera en taller de confección.\n2016–actualidad · Taller independiente de arreglos y prendas por encargo.',
  'Cursos de patronaje, manejo de máquinas y confección de prendas.',
  'Los ajustes quedaron cómodos y cuidó cada detalle.'),
 ('carpinteria','Miguel Romero','Carpintería','Carayaca',14,['Carayaca','El Junko','Catia La Mar'],
  'Muebles a medida, reparación de puertas, instalación de repisas y mantenimiento de piezas de madera.',
  '2012–2018 · Carpintero en taller de mobiliario.\n2018–actualidad · Diseño y fabricación independiente por encargo.',
  'Aprendizaje de taller en ensamblaje, medición y acabados de madera.',
  'La repisa quedó a la medida del espacio que necesitaba.'),
 ('refrigeracion','Daniela Torres','Refrigeración','Carlos Soublette',7,['Carlos Soublette','Maiquetía','La Guaira'],
  'Mantenimiento de aires acondicionados, limpieza de unidades, diagnóstico de fallas y revisión de equipos de refrigeración doméstica.',
  '2019–2023 · Asistente técnica de refrigeración.\n2023–actualidad · Mantenimiento independiente de equipos domésticos.',
  'Formación técnica en refrigeración y mantenimiento preventivo.',
  'Realizó el mantenimiento y explicó cuándo repetirlo.'),
 ('limpieza','Rosa Méndez','Limpieza','Naiguatá',6,['Naiguatá','Caruao','Caraballeda','Macuto'],
  'Limpieza de hogares y oficinas, limpieza profunda de cocinas y baños y organización básica de espacios.',
  '2020–2023 · Auxiliar de limpieza en oficinas.\n2023–actualidad · Servicio independiente para hogares y pequeños negocios.',
  'Capacitación práctica en uso de productos y cuidado de superficies.',
  'Fue puntual y dejó los espacios limpios y organizados.'),
]

def seed():
 server.init()
 with server.connect() as connection:
  for slug,name,category,location,years,areas,services,career,training,quote in EXAMPLES:
   uid='demo-user-'+slug; pid='demo-'+slug
   salt=secrets.token_hex(16)
   password=hashlib.scrypt(b'guaria2026',salt=salt.encode(),n=16384,r=8,p=1).hex()
   connection.execute('INSERT OR IGNORE INTO users VALUES(?,?,?,?,0)',(uid,slug+'@ejemplo.invalid',password,salt))
   profile={'name':name,'category':category,'location':location,'areas':areas,'experience':years,'phone':'','avatar':'','photos':[],
    'description':services+'\n\nTRAYECTORIA LABORAL\n'+career+'\n\nFORMACIÓN\n'+training+'\n\nFORMA DE TRABAJO\nEvaluación de la necesidad, presupuesto previo y coordinación de horarios. Materiales y alcance acordados antes de comenzar.',
    'testimonials':[{'name':'Cliente de ejemplo','text':quote}],'demo':True}
   connection.execute('INSERT OR IGNORE INTO profiles(id,user_id,data,status,hidden) VALUES(?,?,?,"published",0)',(pid,uid,json.dumps(profile,ensure_ascii=False)))
 print('9 perfiles ficticios disponibles. Sus contactos por WhatsApp están desactivados.')
if __name__=='__main__': seed()
