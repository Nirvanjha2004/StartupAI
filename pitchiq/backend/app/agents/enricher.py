"""
Enricher Agent — finds decision maker info for each company.

Takes companies list from researcher output.
For each company: searches for founder/CTO/VP Eng.
Uses FREE tier gateway.
If enrichment fails for a company → skip it, log warning, continue.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.config import settings
from app.utils.logger import get_logger

logger = get_logger("enricher")

_ENRICHER_PROMPT = """You are a contact enrichment specialist. Given search results about a company's leadership, extract decision maker information.

Return ONLY this JSON, no preamble, no markdown:
{
  "decision_maker_name": "full name or null",
  "decision_maker_role": "founder/CEO/CTO/VP Engineering/etc or null",
  "linkedin_url": "LinkedIn profile URL or null",
  "context_for_email": "1-2 sentences about this person relevant for cold outreach"
}

If no clear decision maker found, return all fields as null."""


class EnricherAgent(BaseAgent):
    """Finds decision maker names and contact info for companies."""

    def __init__(self, tier: str = "free"):
        super().__init__(name="enricher", role="enrichment", tier="free")
        self._tavily = None

    def _get_tavily(self):
        """Lazy-load Tavily client."""
        if self._tavily is None:
            from tavily import TavilyClient
            self._tavily = TavilyClient(api_key=settings.TAVILY_API_KEY)
        return self._tavily

    async def execute(self, task: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Enrich companies with decision maker info.

        Args:
            task:    Enricher instruction from planner.
            context: Must contain 'researcher' output with 'companies' list.

        Returns:
            Dict with 'enriched_companies' list.
        """
        logger.info("[enricher] Task: %s", task[:80])

        # Get companies from researcher output
        researcher_output = context.get("researcher", {})
        companies = researcher_output.get("companies", [])

        if not companies:
            logger.warning("[enricher] No companies to enrich")
            return {"enriched_companies": []}

        logger.info("[enricher] Enriching %d companies", len(companies))

        enriched: List[Dict[str, Any]] = []
        for company in companies:
            try:
                enriched_data = await self._enrich_company(company)
                if enriched_data:
                    enriched.append(enriched_data)
            except Exception as exc:
                logger.warning(
                    "[enricher] Failed to enrich %s: %s",
                    company.get("name", "unknown"),
                    exc,
                )
                # Continue with other companies

        logger.info("[enricher] Successfully enriched %d/%d companies", len(enriched), len(companies))
        return {"enriched_companies": enriched}

    async def _enrich_company(self, company: Dict[str, Any]) -> Dict[str, Any]:
        """Enrich a single company with decision maker info."""
        company_name = company.get("name", "")
        if not company_name:
            return {}

        # Search for founder/CEO
        query = f"{company_name} founder CEO LinkedIn"
        logger.info("[enricher] Searching: %s", query[:60])

        try:
            results = self._get_tavily().search(query, max_results=5)
            search_snippets = []
            for r in results.get("results", []):
                snippet = f"[{r.get('title', '')}] {r.get('content', '')[:200]}"
                search_snippets.append(snippet)

            if not search_snippets:
                logger.warning("[enricher] No results for %s", company_name)
                return self._build_enriched_company(company, None)

            # Extract decision maker with gateway
            combined = "\n\n".join(search_snippets)
            prompt = f"""Company: {company_name}

Search results about leadership:
{combined}

Extract decision maker information."""

            messages = [
                {"role": "system", "content": _ENRICHER_PROMPT},
                {"role": "user", "content": prompt},
            ]

            gw = await self._call_gateway(prompt=prompt, messages=messages)
            decision_maker = self._parse_decision_maker(gw.response)

            return self._build_enriched_company(company, decision_maker)

        except Exception as exc:
            logger.warning("[enricher] Search/extraction failed for %s: %s", company_name, exc)
            return self._build_enriched_company(company, None)

    def _parse_decision_maker(self, raw: str) -> Dict[str, Any]:
        """Parse decision maker JSON with fallback."""
        import re
        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text

        try:
            return json.loads(text)
        except (json.JSONDecodeError, ValueError):
            pass

        try:
            cleaned = re.sub(r'[\x00-\x1f\x7f]', lambda m: repr(m.group())[1:-1], text)
            return json.loads(cleaned)
        except (json.JSONDecodeError, ValueError):
            pass

        logger.warning("[enricher] Failed to parse decision maker JSON")
        return {
            "decision_maker_name": None,
            "decision_maker_role": None,
            "linkedin_url": None,
            "context_for_email": None,
        }

    def _build_enriched_company(
        self,
        company: Dict[str, Any],
        decision_maker: Dict[str, Any] | None,
    ) -> Dict[str, Any]:
        """Combine company data with decision maker info."""
        dm = decision_maker or {}
        return {
            "company": company.get("name", ""),
            "description": company.get("description", ""),
            "funding_stage": company.get("funding_stage", "unknown"),
            "recent_news": company.get("recent_news", ""),
            "website": company.get("website"),
            "decision_maker_name": dm.get("decision_maker_name"),
            "decision_maker_role": dm.get("decision_maker_role"),
            "linkedin_url": dm.get("linkedin_url"),
            "context_for_email": dm.get("context_for_email", ""),
        }
