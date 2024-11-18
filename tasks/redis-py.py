import redis

# Connettersi al database numero 1
r = redis.Redis(host='localhost', port=6379, db=1)

# Impostare e leggere valori
r.set('chiave', 'valore')
print(r.get('chiave'))  # Output: b'valore'
