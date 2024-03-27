from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base


DATABASE_URI = "mysql+mysqlconnector://clrp:clrpmoleculE24#@localhost/cellhit"

# Create the database engine
engine = create_engine(DATABASE_URI)

# Create a session maker
DBSession = sessionmaker(bind=engine, autoflush=False)

# Create a base class for declarative models
Base = declarative_base()
