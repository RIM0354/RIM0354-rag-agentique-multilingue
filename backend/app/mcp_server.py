"""Serveur MCP : rend l'analyste utilisable depuis Claude Desktop ou tout autre client MCP.

Lancer (depuis backend/) :  python -m app.mcp_server
Configuration Claude Desktop : voir docs/claude_desktop_config.json
"""
from mcp.server.mcpserver import MCPServer

from .agents import ask_agents
from .search import hybrid_search, list_companies

mcp = MCPServer(
    "analyste-financier-maroc",
    instructions="Analyste financier des sociétés cotées à Casablanca. Toujours citer les sources renvoyées.",
)


@mcp.tool()
def list_indexed_companies() -> list[str]:
    """Liste les entreprises dont les rapports financiers sont indexés."""
    return list_companies()


@mcp.tool()
def search_reports(query: str, company: str | None = None, year: str | None = None, k: int = 5) -> list[dict]:
    """Recherche hybride dans les rapports financiers. Renvoie les extraits avec entreprise, année et page."""
    return [
        {"company": h["company"], "year": h["year"], "page": h["page"], "text": h["text"][:1500]}
        for h in hybrid_search(query, k=k, company=company, year=year)
    ]


@mcp.tool()
def ask_financial_analyst(question: str, company: str | None = None, year: str | None = None) -> dict:
    """Pose une question à l'analyste multi-agents : recherche, calculs vérifiés, réponse sourcée (FR / EN / AR)."""
    result = ask_agents(question, company, year)
    return {"answer": result["answer"], "sources": result["sources"], "calculations": result["calculations"]}


if __name__ == "__main__":
    mcp.run()  # transport stdio, celui qu'utilise Claude Desktop
