from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import Optional
from openai import AsyncOpenAI
from backend.config import get_settings
import json

router = APIRouter()
settings = get_settings()

class SOPRequest(BaseModel):
    task: str
    format: Optional[str] = "standard"

class SOPResponse(BaseModel):
    title: str
    content: str

async def generate_sop_with_openai(task: str) -> dict:
    prompt = f"""Generate a detailed Standard Operating Procedure (SOP) for the following finance task: "{task}"

    Please provide the output as a JSON object with the following structure:
    {{
        "title": "SOP title",
        "content": "Detailed step-by-step procedure"
    }}

    Make sure the content is clear, actionable and includes all necessary steps."""

    # Initialize the async client
    client = AsyncOpenAI(api_key=settings.openai_api_key)

    try:
        completion = await client.chat.completions.create(
            model="gpt-4o",  # Latest model as of May 13, 2024
            messages=[{"role": "user", "content": prompt}],
            response_format={"type": "json_object"}
        )

        if not completion.choices or not completion.choices[0].message.content:
            raise ValueError("No response from OpenAI")

        return json.loads(completion.choices[0].message.content)
    except json.JSONDecodeError as e:
        raise ValueError(f"Invalid JSON response from OpenAI: {str(e)}")
    except Exception as e:
        raise ValueError(f"OpenAI API error: {str(e)}")

@router.post("/generate", response_model=SOPResponse)
async def generate_sop(request: SOPRequest):
    try:
        sop_data = await generate_sop_with_openai(request.task)
        return SOPResponse(**sop_data)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="Invalid response format from OpenAI")
    except ValueError as e:
        raise HTTPException(status_code=500, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to generate SOP: {str(e)}")