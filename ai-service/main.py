import os
from typing import List, Dict, Any
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
import google.generativeai as genai

app = FastAPI(title="Research Connect AI Service", version="1.0.0")

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "")
if GEMINI_API_KEY:
    genai.configure(api_key=GEMINI_API_KEY)

class SummaryRequest(BaseModel):
    text: str
    max_length: int = 150

class RecommendationRequest(BaseModel):
    user_interests: List[str]
    items: List[Dict[str, Any]]  # List of publications/projects with title, abstract, keywords

class SemanticSearchRequest(BaseModel):
    query: str
    documents: List[Dict[str, Any]]

@app.get("/health")
def health_check():
    return {"status": "healthy", "gemini_enabled": bool(GEMINI_API_KEY)}

@app.post("/summarize")
def summarize_publication(req: SummaryRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="Text cannot be empty")
        
    if not GEMINI_API_KEY:
        # Fallback summary generator using simple heuristics
        sentences = req.text.split(".")
        summary_sentences = sentences[:3]
        fallback_summary = ". ".join(summary_sentences) + "."
        return {"summary": f"[Mock Summary] {fallback_summary}"}
        
    try:
        model = genai.GenerativeModel('gemini-1.5-flash')
        prompt = f"Summarize the following scientific text in less than {req.max_length} words:\n\n{req.text}"
        response = model.generate_content(prompt)
        return {"summary": response.text}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Gemini API failure: {str(e)}")

@app.post("/recommend")
def recommend_publications(req: RecommendationRequest):
    scored_items = []
    
    # Calculate interest scores based on keyword matching
    for item in req.items:
        score = 0.0
        title = item.get("title", "").lower()
        abstract = item.get("abstract", "").lower()
        keywords = [k.lower() for k in item.get("keywords", [])]
        
        for interest in req.user_interests:
            interest_lower = interest.lower()
            if interest_lower in title:
                score += 3.0
            if interest_lower in abstract:
                score += 1.5
            if interest_lower in keywords:
                score += 2.0
                
        # Normalize score
        item_copy = item.copy()
        item_copy["recommendation_score"] = score
        scored_items.append(item_copy)
        
    # Sort items by score descending
    scored_items.sort(key=lambda x: x["recommendation_score"], reverse=True)
    return {"recommendations": scored_items}

@app.post("/semantic-search")
def semantic_search(req: SemanticSearchRequest):
    if not GEMINI_API_KEY:
        # Fallback keyword matching relevance scorer
        query_words = set(req.query.lower().split())
        scored_docs = []
        for doc in req.documents:
            score = 0
            text = (doc.get("title", "") + " " + doc.get("abstract", "")).lower()
            for word in query_words:
                if word in text:
                    score += 1
            doc_copy = doc.copy()
            doc_copy["relevance_score"] = score
            scored_docs.append(doc_copy)
        scored_docs.sort(key=lambda x: x["relevance_score"], reverse=True)
        return {"results": scored_docs}
        
    try:
        # Embed query
        query_emb = genai.embed_content(
            model="models/text-embedding-004",
            content=req.query,
            task_type="retrieval_query"
        )["embedding"]
        
        # Embed documents and calculate cosine similarity
        import numpy as np
        scored_docs = []
        for doc in req.documents:
            text = doc.get("title", "") + "\n" + doc.get("abstract", "")
            doc_emb = genai.embed_content(
                model="models/text-embedding-004",
                content=text,
                task_type="retrieval_document"
            )["embedding"]
            
            # Cosine similarity
            similarity = np.dot(query_emb, doc_emb) / (np.linalg.norm(query_emb) * np.linalg.norm(doc_emb))
            doc_copy = doc.copy()
            doc_copy["relevance_score"] = float(similarity)
            scored_docs.append(doc_copy)
            
        scored_docs.sort(key=lambda x: x["relevance_score"], reverse=True)
        return {"results": scored_docs}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Embedding API failure: {str(e)}")
