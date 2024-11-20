import strawberry
from strawberry.fastapi import GraphQLRouter
from .schemas import *
from .resolvers import QueryResolver
from typing import List, Union


@strawberry.type
class Query:
    gdsc: List[Gdsc] = strawberry.field(resolver=QueryResolver.get_gdsc)
    gdsc_drug: List[Gdsc] = strawberry.field(resolver=QueryResolver.get_gdsc_drug)
    prism: List[Prism] = strawberry.field(resolver=QueryResolver.get_prism)
    prism_drug: List[Prism] = strawberry.field(resolver=QueryResolver.get_prism_drug)
    databases: List[Union[Gdsc, Prism]] = strawberry.field(resolver=QueryResolver.get_databases)
    get_task: Task = strawberry.field(resolver=QueryResolver.get_task)
    divide: Task = strawberry.field(resolver=QueryResolver.divide)
    run_analysis: Task = strawberry.field(resolver=QueryResolver.run_analysis)


schema = strawberry.Schema(query=Query)
graphql_app = GraphQLRouter(schema)
