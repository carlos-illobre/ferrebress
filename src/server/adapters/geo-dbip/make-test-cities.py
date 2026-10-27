# Genera test-cities.mmdb, la base de ciudades chiquita de las pruebas del adaptador:
#   pip install mmdb-writer netaddr && python make-test-cities.py test-cities.mmdb
import sys
from mmdb_writer import MMDBWriter
from netaddr import IPSet
w = MMDBWriter(ip_version=6, database_type='DBIP-City-Lite', languages=['en', 'es'], description={'en': 'Ferrebress test cities', 'es': 'Ciudades de prueba de Ferrebress'}, ipv4_compatible=True)
w.insert_network(IPSet(['190.1.2.0/24']), {'city': {'names': {'en': 'Cordoba', 'es': 'Córdoba'}}})
w.insert_network(IPSet(['181.0.0.0/24']), {'city': {'names': {'en': 'Buenos Aires'}}})
w.insert_network(IPSet(['200.0.0.0/24']), {'country': {'names': {'en': 'Argentina'}}})
w.insert_network(IPSet(['2800:40::/32']), {'city': {'names': {'en': 'Rosario', 'es': 'Rosario'}}})
w.to_db_file(sys.argv[1])
