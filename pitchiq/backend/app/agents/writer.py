"""
Writer Agent — generates personalized cold outreach emails.

Takes enriched company data from shared state.
Uses PREMIUM tier gateway (quality matters here).
Generates one email per company referencing specific context.
"""

from __future__ import annotations

import json
from typing import Any, Dict, List

from app.agents.base import BaseAgent
from app.utils.logger import get_logger

logger = get_logger("writer")

_WRITER_SYSTEM_PROMPT = """You are an expert cold email copywriter specializing in B2B SaaS outreach.

Write a highly personalized cold email based on the company and contact information provided.

Rules:
- Subject line: compelling, specific, under 60 characters
- Body: 3-4 short paragraphs, under 200 words total
- Reference the company's specific problem, recent news, or funding stage
- Address the decision maker by first name
- Clear single call-to-action (15-minute call)
- No generic phrases like "I hope this email finds you well"
- Sound human, not like a template

Return ONLY this JSON, no preamble, no markdown:
{
  "company": "company name",
  "to": "decision maker first name or 'Founder' if unknown",
  "subject": "email subject line",
  "body": "full email body",
  "personalization_hooks": ["hook1", "hook2"]
}"""


class WriterAgent(BaseAgent):
    """Generates personalized cold outreach emails for each company."""

    def __init__(self, tier: str = "free"):
        # Writer always uses premium — quality matters
        super().__init__(name="writer", role="writing", tier="premium")

    async def execute(self, task: str, context: Dict[str, Any]) -> Dict[str, Any]:
        """
        Generate personalized emails for all enriched companies.

        Args:
            task:    Writer instruction from planner.
            context: Must contain 'enricher' output with 'enriched_companies'.
                     Falls back to 'researcher' output if enricher not run.

        Returns:
            Dict with 'emails' list.
        """
        logger.info("[writer] Task: %s", task[:80])

        # Get enriched companies (prefer enricher output, fall back to researcher)
        enriched_companies = self._get_companies(context)

        if not enriched_companies:
            logger.warning("[writer] No companies to write emails for")
            return {"emails": []}

        logger.info("[writer] Writing emails for %d companies", len(enriched_companies))

        emails: List[Dict[str, Any]] = []
        for company_data in enriched_companies:
            try:
                email = await self._write_email(task, company_data)
                if email:
                    emails.append(email)
            except Exception as exc:
                logger.warning(
                    "[writer] Failed to write email for %s: %s",
                    company_data.get("company", "unknown"),
                    exc,
                )

        logger.info("[writer] Generated %d emails", len(emails))
        return {"emails": emails}

    async def _write_email(
        self, instruction: str, company_data: Dict[str, Any]
    ) -> Dict[str, Any]:
        """Generate a single personalized email."""
        company_name = company_data.get("company", "the company")
        dm_name = company_data.get("decision_maker_name") or "Founder"
        dm_role = company_data.get("decision_maker_role") or "Founder"
        description = company_data.get("description", "")
        funding_stage = company_data.get("funding_stage", "")
        recent_news = company_data.get("recent_news", "")
        context_for_email = company_data.get("context_for_email", "")

        prompt = f"""Writing instruction: {instruction}

Company: {company_name}
Decision Maker: {dm_name} ({dm_role})
What they do: {description}
Funding stage: {funding_stage}
Recent news: {recent_news}
Additional context: {context_for_email}

Write a personalized cold email specifically for {company_name}."""

        messages = [
            {"role": "system", "content": _WRITER_SYSTEM_PROMPT},
            {"role": "user", "content": prompt},
        ]

        gw = await self._call_gateway(
            prompt=prompt,
            messages=messages,
            tier_override="premium",
        )

        email = self._parse_email(gw.response, company_name, dm_name)
        logger.info("[writer] Email for %s: subject='%s'", company_name, email.get("subject", "")[:50])
        return email

    def _get_companies(self, context: Dict[str, Any]) -> List[Dict[str, Any]]:
        """Get companies from context — prefer enricher, fall back to researcher."""
        # Try enricher output first
        enricher_output = context.get("enricher", {})
        enriched = enricher_output.get("enriched_companies", [])
        if enriched:
            return enriched

        # Fall back to researcher output (no decision maker info)
        researcher_output = context.get("researcher", {})
        companies = researcher_output.get("companies", [])
        if companies:
            logger.info("[writer] No enricher output, using researcher companies directly")
            return [
                {
                    "company": c.get("name", ""),
                    "description": c.get("description", ""),
                    "funding_stage": c.get("funding_stage", ""),
                    "recent_news": c.get("recent_news", ""),
                    "website": c.get("website"),
                    "decision_maker_name": None,
                    "decision_maker_role": None,
                    "linkedin_url": None,
                    "context_for_email": "",
                }
                for c in companies
            ]

        return []

    def _parse_email(
        self, raw: str, company_name: str, dm_name: str
    ) -> Dict[str, Any]:
        """Parse email JSON with robust fallback for control characters."""
        import re

        text = raw.strip()
        if text.startswith("```"):
            lines = text.split("\n")
            text = "\n".join(lines[1:-1]) if len(lines) > 2 else text

        # Try strict parse first
        try:
            data = json.loads(text)
            if "body" not in data:
                raise ValueError("Missing 'body' key")
            return data
        except (json.JSONDecodeError, ValueError):
            pass

        # Try cleaning control characters and re-parsing
        try:
            # Replace unescaped control characters inside JSON strings
            cleaned = re.sub(r'[\x00-\x1f\x7f]', lambda m: repr(m.group())[1:-1], text)
            data = json.loads(cleaned)
            if "body" in data:
                return data
        except (json.JSONDecodeError, ValueError):
            pass

        # Extract fields with regex as last resort
        try:
            subject_match = re.search(r'"subject"\s*:\s*"([^"]+)"', text)
            body_match = re.search(r'"body"\s*:\s*"(.*?)"(?:\s*,|\s*\})', text, re.DOTALL)
            to_match = re.search(r'"to"\s*:\s*"([^"]+)"', text)

            if body_match:
                return {
                    "company": company_name,
                    "to": to_match.group(1) if to_match else dm_name,
                    "subject": subject_match.group(1) if subject_match else f"Quick question about {company_name}",
                    "body": body_match.group(1).replace("\\n", "\n"),
                    "personalization_hooks": [],
                }
        except Exception:
            pass

        # Final fallback — use raw text as body
        logger.warning("[writer] All JSON parse attempts failed for %s, using raw text", company_name)
        return {
            "company": company_name,
            "to": dm_name,
            "subject": f"Quick question about {company_name}",
            "body": raw[:2000],
            "personalization_hooks": [],
        }
