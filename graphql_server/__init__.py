import asyncio
from typing import List, Optional, Union

import strawberry
from strawberry.fastapi import GraphQLRouter

from .schemas import *
from .resolvers import QueryResolver, MutationResolver


@strawberry.type
class Query:

    @strawberry.field
    async def gdsc(self, pagination: Optional[PaginationInput] = None) -> List[Gdsc]:
        return await asyncio.to_thread(QueryResolver.get_gdsc, pagination)

    @strawberry.field
    async def gdsc_drug(self, drug: str) -> List[Gdsc]:
        return await asyncio.to_thread(QueryResolver.get_gdsc_drug, drug)

    @strawberry.field
    async def prism(self, pagination: Optional[PaginationInput] = None) -> List[Prism]:
        return await asyncio.to_thread(QueryResolver.get_prism, pagination)

    @strawberry.field
    async def prism_drug(self, drug: str) -> List[Prism]:
        return await asyncio.to_thread(QueryResolver.get_prism_drug, drug)

    @strawberry.field
    async def databases(self) -> List[Union[Gdsc, Prism]]:
        return await asyncio.to_thread(QueryResolver.get_databases)

    @strawberry.field
    async def get_task(self, task_id: str) -> Task:
        return await asyncio.to_thread(QueryResolver.get_task, task_id)

    @strawberry.field
    async def get_results(self, task_id: str, step: str) -> Task:
        return await asyncio.to_thread(QueryResolver.get_results, task_id, step)

    @strawberry.field
    async def get_distribution(self, task_id: str, dic_type: str, dataset: str, key: str) -> Task:
        return await asyncio.to_thread(QueryResolver.get_distribution, task_id, dic_type, dataset, key)

    @strawberry.field
    async def get_heatmap(self, task_id: str, top: int, dataset: str) -> Task:
        return await asyncio.to_thread(QueryResolver.get_heatmap, task_id, top, dataset)


@strawberry.type
class Mutation:
    run_analysis: Task = strawberry.field(resolver=MutationResolver.run_analysis)
    run_alignment: Task = strawberry.field(resolver=MutationResolver.run_alignment)


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)