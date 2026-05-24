import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from app.config import CORS_ORIGINS, PORT
from app.routers import auth, states, districts, services, blogs, search, analytics, page_templates, workflow, seo_gen, admin, categories, templates, reusable_components, verified_portals
from app.database import Base, engine
from app.middleware import RateLimitMiddleware


@asynccontextmanager
async def lifespan(app: FastAPI):
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield


app = FastAPI(
    title="India Hyperlocal Utility Portal API",
    description="API backend for states, districts, services, blogs, and admin dashboard",
    version="2.0.0",
    lifespan=lifespan,
)

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Rate Limiter (applied before routers)
app.add_middleware(RateLimitMiddleware, max_requests=10, window_seconds=60)

# Serve uploaded media files
uploads_dir = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(uploads_dir, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=uploads_dir), name="uploads")

# Mount Routers
app.include_router(auth.router)
app.include_router(states.router)
app.include_router(districts.router)
app.include_router(services.router)
app.include_router(blogs.router)
app.include_router(search.router)
app.include_router(analytics.router)
app.include_router(page_templates.router)
app.include_router(workflow.router)
app.include_router(seo_gen.router)
app.include_router(admin.router)
app.include_router(categories.router)
app.include_router(categories.admin_router)
app.include_router(templates.router)
app.include_router(templates.admin_router)
app.include_router(reusable_components.router)
app.include_router(reusable_components.admin_router)
app.include_router(verified_portals.router)

@app.get("/api/health")
async def health_check():
    return {
        "status": "healthy",
        "service": "India Hyperlocal Utility Portal API",
        "version": "2.0.0"
    }

# Endpoint to create tables (helpful for manual testing/seeding without alembic setup)
@app.post("/api/admin/init-db", status_code=200)
async def initialize_database():
    try:
        async with engine.begin() as conn:
            await conn.run_sync(Base.metadata.create_all)
        return {"status": "success", "message": "Database tables initialized successfully"}
    except Exception as e:
        return {"status": "error", "message": f"Failed to initialize database tables: {str(e)}"}
