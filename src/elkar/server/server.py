import json
from typing import AsyncIterable, Callable, Any
from elkar.a2a_types import *

from pydantic import ValidationError
from starlette.applications import Starlette
from starlette.responses import JSONResponse, Response
from starlette.middleware import Middleware
from starlette.middleware.cors import CORSMiddleware
from sse_starlette.sse import EventSourceResponse
from starlette.requests import Request
from elkar.task_manager.task_manager_base import RequestContext, TaskManager
import logging

logger = logging.getLogger(__name__)


class A2AServer[T: TaskManager]:
    def __init__(
        self,
        task_manager: T,
        host: str = "0.0.0.0",
        port: int = 5000,
        endpoint: str = "/",
        cors_allow_origins: list[str] = ["*"],
        context_extractor: Callable[[Request], RequestContext] | None = None,
    ) -> None:
        self.host = host
        self.port = port
        self.endpoint = endpoint
        self.task_manager = task_manager
        self.cors_allow_origins = cors_allow_origins
        self.context_extractor = context_extractor

        middleware = [
            Middleware(
                CORSMiddleware,
                allow_origins=self.cors_allow_origins,
                allow_methods=["GET", "POST", "OPTIONS"],
                allow_headers=["Content-Type", "Authorization"],
                allow_credentials=True,
            )
        ]

        self.app = Starlette(middleware=middleware)

        self.app.add_route(
            self.endpoint, self._process_request, methods=["POST", "OPTIONS"]
        )
        self.app.add_route(
            "/.well-known/agent.json",
            self._get_agent_card,
            methods=["GET", "OPTIONS"],
        )

    def start(self, reload_server: bool = False) -> None:

        if self.task_manager is None:
            raise ValueError("request_handler is not defined")

        import uvicorn

        uvicorn.run(
            self.app,
            host=self.host,
            port=self.port,
            reload=reload_server,
        )

    async def extract_request_context(self, request: Request) -> RequestContext:
        """Extracts the context from the request.
        The context is used to identify the caller and the session. Authentication is handled here.

        This method can be overridden by subclasses or replaced by providing a custom
        context_extractor function during initialization.
        """
        if self.context_extractor:
            return self.context_extractor(request)

        return RequestContext(
            caller_id=None,
            metadata={},
        )

    async def _get_agent_card(self, request: Request) -> Response:
        if request.method == "OPTIONS":
            return Response(status_code=200)

        agent_card = await self.task_manager.get_agent_card()
        return JSONResponse(agent_card.model_dump(exclude_none=True))

    async def _process_request(
        self, request: Request
    ) -> Response | JSONResponse | EventSourceResponse:
        request_context = await self.extract_request_context(request)
        if request.method == "OPTIONS":
            return Response(status_code=200)

        try:
            body = await request.json()
            json_rpc_request = A2ARequest.validate_python(body)
            result: AsyncIterable[Any] | JSONRPCResponse
            if isinstance(json_rpc_request, GetTaskRequest):
                result = await self.task_manager.get_task(
                    json_rpc_request, request_context
                )
            elif isinstance(json_rpc_request, SendTaskRequest):
                result = await self.task_manager.send_task(
                    json_rpc_request, request_context
                )
            elif isinstance(json_rpc_request, SendTaskStreamingRequest):
                result = await self.task_manager.send_task_streaming(
                    json_rpc_request, request_context
                )
            elif isinstance(json_rpc_request, CancelTaskRequest):
                result = await self.task_manager.cancel_task(
                    json_rpc_request, request_context
                )
            elif isinstance(json_rpc_request, SetTaskPushNotificationRequest):
                result = await self.task_manager.set_task_push_notification(
                    json_rpc_request, request_context
                )
            elif isinstance(json_rpc_request, GetTaskPushNotificationRequest):
                result = await self.task_manager.get_task_push_notification(
                    json_rpc_request, request_context
                )
            elif isinstance(json_rpc_request, TaskResubscriptionRequest):
                result = await self.task_manager.resubscribe_to_task(
                    json_rpc_request, request_context
                )
            else:
                logger.warning(f"Unexpected request type: {type(json_rpc_request)}")
                raise ValueError(f"Unexpected request type: {type(request)}")

            return self._create_response(result)

        except Exception as e:
            raise e
            # return self._handle_exception(e)

    def _handle_exception(self, e: Exception) -> JSONResponse:
        json_rpc_error: JSONRPCError
        if isinstance(e, json.decoder.JSONDecodeError):
            json_rpc_error = JSONParseError()
        elif isinstance(e, ValidationError):
            json_rpc_error = InvalidRequestError(data=json.loads(e.json()))
        else:
            logger.error(f"Unhandled exception: {e}")
            json_rpc_error = InternalError()

        response = JSONRPCResponse(id=None, error=json_rpc_error)
        return JSONResponse(response.model_dump(exclude_none=True), status_code=400)

    def _create_response(self, result: Any) -> JSONResponse | EventSourceResponse:
        if isinstance(result, AsyncIterable):

            async def event_generator(
                result: AsyncIterable[Any],
            ) -> AsyncIterable[dict[str, str]]:
                async for item in result:
                    yield {"data": item.model_dump_json(exclude_none=True)}

            return EventSourceResponse(event_generator(result))
        elif isinstance(result, JSONRPCResponse):
            return JSONResponse(result.model_dump(exclude_none=True))
        else:
            logger.error(f"Unexpected result type: {type(result)}")
            raise ValueError(f"Unexpected result type: {type(result)}")
