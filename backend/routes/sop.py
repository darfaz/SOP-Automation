from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from openai import OpenAI
from ..config import get_settings

router = APIRouter()
settings = get_settings()

class SOPRequest(BaseModel):
    task: str
    format: Optional[str] = "standard"

class SOPResponse(BaseModel):
    title: str
    content: str

@router.post("/generate", response_model=SOPResponse)
async def generate_sop(request: SOPRequest):
    try:
        client = OpenAI(api_key=settings.openai_api_key)
        
        prompt = f"""Generate a detailed Standard Operating Procedure (SOP) for the following finance task: "{request.task}"
        
        Please provide the output as a JSON object with the following structure:
        {{
            "title": "SOP title",
            "content": "Detailed step-by-step procedure"
        }}
        
        Make sure the content is clear, actionable and includes all necessary steps."""

        response = await client.chat.completions.create(
            model="gpt-4o",  # Latest model as of May 13, 2024
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        result = response.choices[0].message.content
        if not result:
            raise HTTPException(status_code=500, detail="Failed to generate SOP")
            
        return result

    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))
