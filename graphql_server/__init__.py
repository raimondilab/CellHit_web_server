import strawberry
from strawberry.fastapi import GraphQLRouter
from .schemas import *
from .resolvers import QueryResolver, MutationResolver
from typing import List, Union


@strawberry.type
class Query:
    gdsc: List[Gdsc] = strawberry.field(resolver=QueryResolver.get_gdsc)
    gdsc_drug: List[Gdsc] = strawberry.field(resolver=QueryResolver.get_gdsc_drug)
    prism: List[Prism] = strawberry.field(resolver=QueryResolver.get_prism)
    prism_drug: List[Prism] = strawberry.field(resolver=QueryResolver.get_prism_drug)
    databases: List[Union[Gdsc, Prism]] = strawberry.field(resolver=QueryResolver.get_databases)
    get_task: Task = strawberry.field(resolver=QueryResolver.get_task)
    get_results: Task = strawberry.field(resolver=QueryResolver.get_results)
    get_distribution: Task = strawberry.field(resolver=QueryResolver.get_distribution)
    get_heatmap: Task = strawberry.field(resolver=QueryResolver.get_heatmap)


@strawberry.type
class Mutation:
    run_analysis: Task = strawberry.field(resolver=MutationResolver.run_analysis)


schema = strawberry.Schema(query=Query, mutation=Mutation)
graphql_app = GraphQLRouter(schema)
