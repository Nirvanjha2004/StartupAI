"""Raw gateway endpoint for direct LLM calls"""

from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from app.gateway.router import ModelRouter
from app.gateway.proxy import LLMProxy
from app.gateway.streaming import StreamingHandler

router = APIRouter()
llm_proxy = LLMProxy()

class ChatRequest(BaseModel):
    context: str
    query: str
    stream: bool = False

class ChatResponse(BaseModel):
    response: str
    model_used: str
    tokens_used: int

@router.post("/chat")
async def chat(request: ChatRequest):
    """Direct chat endpoint with model routing"""
    
    # Route to appropriate model
    model = ModelRouter.route(request.context, request.query)
    
    # Prepare messages
    messages = [
        {"role": "system", "content": f"Context:\n{request.context}"},
        {"role": "user", "content": request.query}
    ]
    
    try:
        # Call LLM
        response = await llm_proxy.call(model, messages)
        
        return ChatResponse(
            response=response,
            model_used=model,
            tokens_used=0  # TODO: track tokens
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/chat/stream")
async def chat_stream(request: ChatRequest):
    """Streaming chat endpoint"""
    
    model = ModelRouter.route(request.context, request.query)
    
    # TODO: Implement streaming generator
    async def generate():
        yield "data: {\"message\": \"Streaming not yet implemented\"}\n\n"
    
    return StreamingResponse(generate(), media_type="text/event-stream")
