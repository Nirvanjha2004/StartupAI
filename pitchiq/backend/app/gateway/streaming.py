"""SSE streaming handler"""

from typing import AsyncGenerator
import json

class StreamingHandler:
    """Handles Server-Sent Events streaming for real-time responses"""
    
    @staticmethod
    async def stream_response(
        generator: AsyncGenerator,
        event_type: str = "message"
    ) -> AsyncGenerator[str, None]:
        """Convert async generator to SSE format"""
        try:
            async for chunk in generator:
                sse_message = {
                    "event": event_type,
                    "data": chunk
                }
                yield f"data: {json.dumps(sse_message)}\n\n"
        except Exception as e:
            error_message = {
                "event": "error",
                "data": str(e)
            }
            yield f"data: {json.dumps(error_message)}\n\n"
    
    @staticmethod
    def format_sse_message(content: str, event_type: str = "message") -> str:
        """Format a single SSE message"""
        data = {
            "event": event_type,
            "data": content
        }
        return f"data: {json.dumps(data)}\n\n"
