import redis

# Connettersi al database Redis numero 0
r = redis.Redis(host='localhost', port=6379, db=0)

# Eliminare tutte le chiavi dal database
r.flushdb()

print("Tutte le chiavi sono state eliminate dal database 0.")
