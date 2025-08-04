
from sqlalchemy import create_engine
from sqlalchemy.orm import sessionmaker, declarative_base
import os

# Example: postgresql://user:password@localhost/dbname

DATABASE_URL = os.getenv("DATABASE_URL", "postgresql://postgres:nidhi%402003@localhost:5432/ai_workflow")
engine = create_engine(DATABASE_URL)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()
