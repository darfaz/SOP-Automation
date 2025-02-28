from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from routes import sop

# Initialize FastAPI app
app = FastAPI(title="FinanceFlow API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with specific origins
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(sop.router, prefix="/api/sop", tags=["SOP"])

# Health check endpoint
@app.get("/health")
async def health_check():
    return {"status": "healthy"}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5001, reload=True)