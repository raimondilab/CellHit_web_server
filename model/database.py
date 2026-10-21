from sqlalchemy import create_engine
from sqlalchemy.engine import URL
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import sessionmaker

from config import MYSQL

# URL.create escapes special characters in the password (@ / : # % ...)
DATABASE_URL = URL.create(
    drivername="mysql+mysqlconnector",
    username=MYSQL["user"],
    password=MYSQL["password"],
    host=MYSQL["host"],
    port=MYSQL["port"],
    database=MYSQL["database"],
)

# Create the database engine
engine = create_engine(
    DATABASE_URL,
    pool_size=10,
    max_overflow=20,
    pool_timeout=30,
    pool_recycle=1800,   # renew connections before MySQL's wait_timeout closes them
    pool_pre_ping=True,  # test a pooled connection before using it
)

# Create a session maker
DBSession = sessionmaker(bind=engine, autoflush=False)

# Create a base class for declarative models
Base = declarative_base()