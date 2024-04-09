from sqlalchemy import create_engine, exc
from sqlalchemy.orm import sessionmaker
from sqlalchemy.ext.declarative import declarative_base
from mysql.connector import MySQLConnection
import schedule
import time

DATABASE_URI = "mysql+mysqlconnector://clrp:clrpmoleculE24#@localhost/cellhit"

# Create the database engine
engine = create_engine(DATABASE_URI)

# Create a session maker
DBSession = sessionmaker(bind=engine, autoflush=False)

# Create a base class for declarative models
Base = declarative_base()


# Function to check and reconnect to the database
def check_and_reconnect():
    engine = DBSession().get_bind()
    connection = engine.connect()
    try:
        connection.execute("SELECT 1")
    except exc.DBAPIError as err:
        if isinstance(err.orig, MySQLConnection):
            connection.invalidate()
            connection.close()
            engine.dispose()
            engine.connect()
            print("Reconnection successful!")
        else:
            raise
    finally:
        connection.close()


# Schedule the connection check every minute
def scheduled_job():
    print("Checking and reconnecting to the database...")
    check_and_reconnect()


schedule.every(1).minutes.do(scheduled_job)


# Function to run the scheduling in the background
def run_schedule():
    while True:
        schedule.run_pending()
        time.sleep(1)


# Start the scheduling in the background
#run_schedule()
