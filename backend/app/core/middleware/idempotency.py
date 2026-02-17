import json
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.responses import JSONResponse
from app.core.redis import redis_client
import time

from starlette.concurrency import iterate_in_threadpool

class IdempotencyMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        # Only check idempotency for modifying methods
        if request.method not in ["POST", "PUT", "PATCH", "DELETE"]:
            return await call_next(request)

        request_id = request.headers.get("X-Request-ID")
        if not request_id:
            return await call_next(request)

        # Unique key in Redis
        idempotency_key = f"idempotency:{request_id}"
        
        # Check if we already have a response for this request_id
        cached_response = redis_client.get(idempotency_key)
        
        if cached_response:
            if cached_response == "processing":
                # Conflict: request is still being processed
                return JSONResponse(
                    status_code=409,
                    content={"detail": "Request already being processed"}
                )
            
            # Found a cached response, return it
            data = json.loads(cached_response)
            return Response(
                content=data["content"],
                status_code=data["status_code"],
                headers=data["headers"],
                media_type=data["media_type"]
            )

        # Mark as processing (distributed lock)
        # Using 60 seconds TTL for processing lock to avoid permanent deadlocks if app crashes
        if not redis_client.set(idempotency_key, "processing", ex=60, nx=True):
            return JSONResponse(
                status_code=409,
                content={"detail": "Request already being processed"}
            )

        try:
            response = await call_next(request)
            
            # Only cache successful or client error responses, maybe not 5xx?
            # For simplicity, we cache all except 5xx
            if response.status_code < 500:
                # We need to read the response body to cache it
                response_body = [section async for section in response.body_iterator]
                response.body_iterator = iterate_in_threadpool(iter(response_body))
                
                content = b"".join(response_body).decode("utf-8")
                
                # Prepare data for caching
                cache_data = {
                    "content": content,
                    "status_code": response.status_code,
                    "headers": dict(response.headers),
                    "media_type": response.media_type
                }
                
                # Cache for 24 hours
                redis_client.set(idempotency_key, json.dumps(cache_data), ex=86400)
            else:
                # If it failed with 5xx, remove the processing flag so it can be retried
                redis_client.delete(idempotency_key)
                
            return response

        except Exception as e:
            # On exception, remove the lock so user can retry
            redis_client.delete(idempotency_key)
            raise e
