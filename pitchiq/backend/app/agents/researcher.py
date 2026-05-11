"""
Researcher Agent — web search + summarization using Tavily.

Runs 2-3 targeted searches based on planner instruction.
Summarizes findings into structured company context.
Uses FREE tier gateway (extraction task, cheap model fine).
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("researcher")

_SUMMARIZE_PROMPT = """You are a research analyst. Given raw search results, extract structured company information.

IMPORTANT: Only extract companies that are explicitly mentioned in the search results below. Do NOT invent or hallucinate company names. If a field is not found in the results, use null.

Return ONLY this JSON, no preamble, no markdown:
{
  "companies": [
    {
      "name": "exact company name from search results",
      "description": "what they do in 1-2 sentences, from search results",
      "funding_stage": "seed/series-a/series-b/unknown — only if mentioned",
      "recent_news": "most relevant recent news from search results, or null",
      "website": "website url if found, or null"
    }
  ],
  "raw_summary": "2-3 sentence overall summary of findings"
}

Extract up to 5 companies. Only include companies with at least a name and description found in the results."""


class ResearcherAgent(BaseAgent):
    """Searches the web and summarizes findings into structured company data."""

    def __init__(self, tier: str = "free"):
        super().__init__(name="researcher", role="research", tier="free")
        self._tavily = None

    def _get_tavily(self):
        """Lazy-load Tavily client."""
        if self._tavily is None:
            from tavily import TavilyClient
            self._tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
        return self._tavily

    async def execute(self, task: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Run targeted searches and return structured company data.

        Args:
            task:    Researcher instruction from planner.
            context: Previous agent outputs (unused for researcher).

        Returns:
            Dict with 'companies' list and 'raw_summary'.
        """
        logger.info("[researcher] Task: %s", task[:80])

        # Generate 2-3 search queries from the instruction
        queries = self._build_queries(task)
        logger.info("[researcher] Running %d searches: %s", len(queries), queries)

        # Run searches
        all_results: List[str] = []
        for query in queries:
            try:
                results = self._get_tavily().search(query, max_results=5)
                for r in results.get("results", []):
                    snippet = f"[{r.get('title', '')}] {r.get('content', '')[:300]} (source: {r.get('url', '')})"
                    all_results.append(snippet)
                logger.info("[researcher] Query '%s' → %d results", query[:50], len(results.get("results", [])))
            except Exception as exc:
                logger.warning("[researcher] Search failed for '%s': %s", query[:50], exc)

        if not all_results:
            logger.warning("[researcher] No search results found")
            return {
                "companies": [],
                "raw_summary": "No results found for the given research task.",
            }

        # Summarize with gateway
        combined = "\n\n".join(all_results[:15])  # Cap to avoid token overflow
        prompt = f"""Research instruction: {task}

Search results:
{combined}

Extract structured company information from these results."""

        messages = [
            {"role": "system", "content": _SUMMARIZE_PROMPT},
            {"role": "user", "content": prompt},
        ]

        gw = await self._call_gateway(prompt=prompt, messages=messages)
        output = self._parse_output(gw.response)

        logger.info(
            "[researcher] Found %d companies, summary: %s",
            len(output.get("companies", [])),
            output.get("raw_summary", "")[:60],
        )
        return output

    def _build_queries(self, instruction: str) -> List[str]:
        """
        Build 2-3 short, targeted search queries from the planner instruction.

        Tavily has a query length limit (~400 chars) and performs better with
        concise queries. Extract the core intent rather than passing the full
        instruction verbatim.
        """
        # Truncate instruction to extract key terms only
        # Take first sentence or first 100 chars — that's the core intent
        core = instruction.split(".")[0].split("\n")[0].strip()

        # Hard cap at 100 chars to stay well within Tavily limits
        if len(core) > 100:
            # Try to cut at a word boundary
            core = core[:100].rsplit(" ", 1)[0]

        queries = [core]

        # Add a funding-focused variant
        queries.append(f"{core[:80]} funding 2024 2025")

        # Add a news-focused variant
        queries.append(f"{core[:80]} recent news")

        return queries[:3]

    def _parse_output(self, raw: str) -> Dict[str, Any]:
        """Parse researcher JSON output with fallback."""
        import re
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text

        try:
            data = json.loads(text)
            if "companies" not in data:
                raise ValueError("Missing 'companies' key")
            return data
        except (json.JSONDecodeError, ValueError):
            pass

        try:
            cleaned = re.sub(r'[\x00-\x1f\x7f]', lambda m: repr(m.group())[1:-1], text)
            data = json.loads(cleaned)
            if "companies" in data:
                return data
        except (json.JSONDecodeError, ValueError):
            pass

        logger.warning("[researcher] Failed to parse output, using raw text")
        return {"companies": [], "raw_summary": raw[:500]}
