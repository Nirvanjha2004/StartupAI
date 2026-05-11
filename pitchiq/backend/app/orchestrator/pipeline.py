"""Pipeline coordinator - runs agents in sequence"""

from typing import List, Dict, Any
from app.agents.planner import PlannerAgent
from app.agents.researcher import ResearcherAgent
from app.agents.enricher import EnricherAgent
from app.agents.writer import WriterAgent
from app.agents.critic import CriticAgent

class Pipeline:
    """Orchestrates multi-agent execution"""
    
    def __init__(self):
        self.planner = PlannerAgent()
        self.researcher = ResearcherAgent()
        self.enricher = EnricherAgent()
        self.writer = WriterAgent()
        self.critic = CriticAgent()
        self.execution_log: List[Dict[str, Any]] = []
    
    async def run(self, task: str, config: Dict[str, Any] = None) -> Dict[str, Any]:
        """Execute full pipeline"""
        config = config or {}
        
        results = {
            "plan": None,
            "research": None,
            "enrichment": None,
            "draft": None,
            "final": None,
            "scores": None
        }
        
        try:
            # Stage 1: Planning
            results["plan"] = await self.planner.execute(task)
            self._log_stage("planning", results["plan"])
            
            # Stage 2: Research
            results["research"] = await self.researcher.execute(results["plan"])
            self._log_stage("research", results["research"])
            
            # Stage 3: Enrichment
            results["enrichment"] = await self.enricher.execute(results["research"])
            self._log_stage("enrichment", results["enrichment"])
            
            # Stage 4: Writing
            results["draft"] = await self.writer.execute(results["enrichment"])
            self._log_stage("writing", results["draft"])
            
            # Stage 5: Criticism
            results["scores"] = await self.critic.score(results["draft"], ["clarity", "relevance", "tone"])
            self._log_stage("criticism", str(results["scores"]))
            
            # Final output
            results["final"] = results["draft"]
            
            return results
        
        except Exception as e:
            self._log_stage("error", str(e))
            raise
    
    def _log_stage(self, stage: str, output: str) -> None:
        """Log pipeline stage execution"""
        self.execution_log.append({
            "stage": stage,
            "output": output[:200],  # Log first 200 chars
            "timestamp": None  # TODO: add timestamp
        })
