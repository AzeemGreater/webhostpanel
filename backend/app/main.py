from fastapi import FastAPI, Depends, HTTPException, status
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from .core.database import engine, Base, get_db
from .api import auth, websites, servers, databases, wordpress, system, files, emails, security, backups, dns, ftp
import uvicorn

Base.metadata.create_all(bind=engine)

app = FastAPI(title="WebHostPanel API", version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(websites.router, prefix="/api/websites", tags=["Websites"])
app.include_router(servers.router, prefix="/api/servers", tags=["Servers"])
app.include_router(databases.router, prefix="/api/databases", tags=["Databases"])
app.include_router(wordpress.router, prefix="/api/wordpress", tags=["WordPress"])
app.include_router(system.router, prefix="/api/system", tags=["System"])
app.include_router(files.router, prefix="/api/files", tags=["Files"])
app.include_router(emails.router, prefix="/api/emails", tags=["Emails"])
app.include_router(security.router, prefix="/api/security", tags=["Security"])
app.include_router(backups.router, prefix="/api/backups", tags=["Backups"])
app.include_router(dns.router, prefix="/api/dns", tags=["DNS"])
app.include_router(ftp.router, prefix="/api/ftp", tags=["FTP"])




@app.get("/")
async def root():
    return {"message": "Welcome to WebHostPanel API"}

if __name__ == "__main__":
    uvicorn.run("app.main:app", host="0.0.0.0", port=8000, reload=True)
