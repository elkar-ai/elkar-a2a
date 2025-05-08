import os
import httpx
from pydantic import BaseModel

from elkar.api_client.models import (
    CreateTaskInput,
    GetTaskQueryParams,
    TaskResponse,
    UpdateTaskInput,
)


class ElkarClient:
    def __init__(self, base_url: str, api_key: str | None = None) -> None:
        self.base_url = base_url
        self.api_key = api_key or os.getenv("ELKAR_API_KEY")
        if not self.api_key:
            raise ValueError("API key is not set")

    async def make_request(
        self,
        path: str,
        method: str,
        params: BaseModel | None = None,
        query_params: BaseModel | None = None,
    ) -> httpx.Response:
        url = f"{self.base_url}{path}"
        headers = {
            "Content-Type": "application/json",
            "x-api-key": f"{self.api_key}",
        }
        param_dict = params.model_dump(exclude_none=True) if params else None
        query_param_dict = (
            query_params.model_dump(exclude_none=True) if query_params else None
        )

        async with httpx.AsyncClient() as client:
            response = await client.request(
                method, url, headers=headers, json=param_dict, params=query_param_dict
            )
        return response

    async def upsert_task(self, params: CreateTaskInput) -> TaskResponse:
        output = await self.make_request("/tasks", "POST", params)
        return TaskResponse.model_validate(output.json())

    async def get_task(
        self, task_id: str, query_params: GetTaskQueryParams
    ) -> None | TaskResponse:
        output = await self.make_request(
            f"/tasks/{task_id}",
            "GET",
            query_params=query_params,
        )
        if output.status_code == 404:
            return None
        if output.status_code != 200:
            raise Exception(f"Error getting task: {output.status_code} {output.text}")

        return TaskResponse.model_validate(output.json())

    async def update_task(self, task_id: str, params: UpdateTaskInput) -> TaskResponse:

        output = await self.make_request(
            f"/tasks/{task_id}",
            "PUT",
            params,
        )
        return TaskResponse.model_validate(output.json())
