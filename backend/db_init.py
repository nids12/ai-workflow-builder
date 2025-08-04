# db_init.py
"""
Run this script once to create all tables in your PostgreSQL database.
"""
from database import engine
from models import Base

if __name__ == "__main__":
    print("Creating all tables...")
    Base.metadata.create_all(bind=engine)
    print("Done.")
