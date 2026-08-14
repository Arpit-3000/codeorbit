# 🎯 CODEORBIT INTERVIEW PREPARATION - PHASE 3
## AI SERVICE: MOCK INTERVIEWS & INTELLIGENT FEATURES

---

## 📌 TABLE OF CONTENTS
1. [AI Service Overview](#ai-service-overview)
2. [Architecture & Tech Stack](#architecture-tech-stack)
3. [Interview Session Management](#interview-session-management)
4. [Resume Analysis](#resume-analysis)
5. [Question Generation (RAG)](#question-generation-rag)
6. [Answer Evaluation](#answer-evaluation)
7. [Difficulty Adaptation](#difficulty-adaptation)
8. [Report Generation](#report-generation)
9. [Integration with Main Backend](#integration-with-main-backend)

---

## AI SERVICE OVERVIEW

### Q: "What is the AI Service and what does it do?"

**Your Answer:**

"The AI Service is a separate Python FastAPI microservice that powers CodeOrbit's intelligent features. It's completely independent from the Node.js backend.

**Core Features:**

1. **Resume-Based Mock Interviews:**
   - Upload resume (PDF) → AI parses skills, projects, experience
   - Generates personalized questions based on resume content
   - Multi-stage interview: Introduction → Resume → Technical → Behavioral → Closing

2. **Adaptive Difficulty:**
   - Monitors answer quality in real-time
   - Automatically increases difficulty for strong answers
   - Decreases difficulty if user struggles

3. **Comprehensive Evaluation:**
   - Multi-dimensional scoring: Technical Accuracy, Depth, Clarity, Communication
   - Detailed feedback on each answer
   - Identifies knowledge gaps

4. **Coding Profile Integration:**
   - Pulls LeetCode/Codeforces stats from main backend
   - Asks questions on weak topics
   - Avoids recently solved problems

5. **Final Report:**
   - Overall score and hiring recommendation
   - Strengths & weaknesses
   - Learning roadmap
   - Suggested LeetCode problems

**Why Separate Service?**
- Python ecosystem better for AI/ML (LangChain, transformers)
- Independent scaling (AI is compute-heavy)
- Can deploy on GPU instances if needed
- Isolation: AI failures don't crash main app

---

## ARCHITECTURE & TECH STACK

### Q: "Explain the AI Service architecture."

**Your Answer:**

**Tech Stack:**

```
FastAPI (Python Web Framework)
├── LangChain (LLM Orchestration)
│   └── Groq (LLM Provider)
│       └── Llama 3.1 70B (Model)
├── ChromaDB (Vector Database)
│   └── Sentence Transformers (Embeddings)
├── PyPDF2 (Resume Parsing)
├── Pydantic (Data Validation)
└── Uvicorn (ASGI Server)
```

**Why These Choices?**

**FastAPI:**
- Automatic API docs (Swagger UI)
- Fast async performance
- Type hints with Pydantic

**LangChain:**
- Pre-built chains for common patterns
- Prompt templates
- Memory management for conversation context

**Groq + Llama 3.1:**
- Groq: Fastest inference speed (500+ tokens/sec)
- Llama 3.1 70B: Powerful open-source model
- Cost: $0.59/1M tokens (cheaper than GPT-4)

**ChromaDB:**
- Embedded vector database (no separate server)
- Fast similarity search
- Persistent storage

**Sentence Transformers:**
- `all-MiniLM-L6-v2` model
- Generates 384-dim embeddings
- Fast and accurate for semantic similarity

---

### **SYSTEM ARCHITECTURE DIAGRAM:**

```
┌─────────────────────────────────────────────────────┐
│            Frontend (Next.js)                        │
│    - Interview Setup UI                              │
│    - Interview Room (Q&A Interface)                  │
│    - Report Display                                  │
└────────────────────┬────────────────────────────────┘
                     │ REST API
                     ▼
┌─────────────────────────────────────────────────────┐
│         Node.js Backend (Express)                    │
│  - Aggregates user's coding profile                  │
│  - Proxies requests to AI Service                    │
│  - Adds authentication                               │
└────────────────────┬────────────────────────────────┘
                     │ HTTP
                     ▼
┌─────────────────────────────────────────────────────┐
│         AI Service (Python FastAPI)                  │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │     Interview Conductor                   │      │
│  │  - Manages conversation flow              │      │
│  │  - Stage progression                      │      │
│  │  - Context management                     │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │     Question Generator (RAG)              │      │
│  │  - Retrieves from vector DB               │      │
│  │  - Filters by difficulty                  │      │
│  │  - Avoids repetition                      │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │     Answer Evaluator                      │      │
│  │  - Multi-dimensional scoring              │      │
│  │  - Generates feedback                     │      │
│  │  - Detects knowledge gaps                 │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │     Difficulty Adapter                    │      │
│  │  - Tracks performance                     │      │
│  │  - Adjusts difficulty dynamically         │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
│  ┌──────────────────────────────────────────┐      │
│  │     Resume Analyzer                       │      │
│  │  - Extracts skills, projects              │      │
│  │  - Identifies key technologies            │      │
│  └──────────────────────────────────────────┘      │
│                                                      │
└────────────────────┬────────────────────────────────┘
                     │
        ┌────────────┼───────────────┐
        │            │               │
        ▼            ▼               ▼
┌──────────────┐ ┌─────────────┐ ┌──────────────┐
│  Groq API    │ │  ChromaDB   │ │ File System  │
│  (Llama 3.1) │ │  (Vectors)  │ │ (Resumes)    │
└──────────────┘ └─────────────┘ └──────────────┘
```

---

## INTERVIEW SESSION MANAGEMENT

### Q: "How do you manage interview state?"

**Your Answer:**

"We use an in-memory session manager with a Pydantic model for type safety. Sessions store full conversation history and progress.

#### **SESSION DATA MODEL:**

**File:** `ai-service/models/interview_session.py`

```python
from pydantic import BaseModel, Field
from enum import Enum
from typing import List, Optional, Dict
from datetime import datetime
import uuid

class InterviewType(str, Enum):
    HR = "hr"
    TECHNICAL = "technical"
    DSA = "dsa"
    COMPETITIVE = "competitive"
    MIXED = "mixed"

class DifficultyLevel(str, Enum):
    BEGINNER = "beginner"
    INTERMEDIATE = "intermediate"
    ADVANCED = "advanced"

class InterviewStage(str, Enum):
    INTRODUCTION = "introduction"
    RESUME_DISCUSSION = "resume_discussion"
    TECHNICAL = "technical"
    BEHAVIORAL = "behavioral"
    CLOSING = "closing"

class CodingProfile(BaseModel):
    """User's coding profile from main backend"""
    leetcode: Optional[Dict] = None
    codeforces: Optional[Dict] = None
    codechef: Optional[Dict] = None
    github: Optional[Dict] = None

class QuestionAnswer(BaseModel):
    """Single Q&A pair"""
    question: str
    answer: Optional[str] = None
    timestamp: datetime = Field(default_factory=datetime.now)
    evaluation: Optional[Dict] = None  # Scores, feedback
    difficulty: DifficultyLevel
    topic: Optional[str] = None

class InterviewSession(BaseModel):
    """Complete interview session state"""
    
    # Identity
    session_id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    
    # Configuration
    interview_type: InterviewType
    initial_difficulty: DifficultyLevel
    current_difficulty: DifficultyLevel
    
    # State
    stage: InterviewStage = InterviewStage.INTRODUCTION
    questions_asked: List[QuestionAnswer] = []
    current_question: Optional[str] = None
    
    # Context
    resume_text: Optional[str] = None
    resume_analysis: Optional[Dict] = None  # Skills, projects, experience
    coding_profile: Optional[CodingProfile] = None
    
    # Tracking
    created_at: datetime = Field(default_factory=datetime.now)
    last_interaction: datetime = Field(default_factory=datetime.now)
    total_questions: int = 0
    
    # Performance
    performance_history: List[float] = []  # Recent scores for adaptation
    
    class Config:
        use_enum_values = True
```

---

#### **SESSION MANAGER:**

**File:** `ai-service/services/session_manager.py`

```python
from typing import Dict, Optional
from models.interview_session import InterviewSession, InterviewStage
from datetime import datetime, timedelta

class SessionManager:
    """Manages interview sessions in-memory"""
    
    def __init__(self):
        self.sessions: Dict[str, InterviewSession] = {}
        self.cleanup_interval = timedelta(hours=2)  # Auto-cleanup after 2 hours
    
    def create_session(
        self,
        user_id: str,
        interview_type: str,
        difficulty: str,
        coding_profile: Optional[Dict] = None
    ) -> InterviewSession:
        """Create new interview session"""
        
        session = InterviewSession(
            user_id=user_id,
            interview_type=interview_type,
            initial_difficulty=difficulty,
            current_difficulty=difficulty,
            coding_profile=coding_profile
        )
        
        self.sessions[session.session_id] = session
        return session
    
    def get_session(self, session_id: str) -> Optional[InterviewSession]:
        """Retrieve session by ID"""
        session = self.sessions.get(session_id)
        
        if session:
            # Update last interaction
            session.last_interaction = datetime.now()
        
        return session
    
    def update_session(self, session: InterviewSession):
        """Update existing session"""
        session.last_interaction = datetime.now()
        self.sessions[session.session_id] = session
    
    def end_session(self, session_id: str):
        """Remove session from memory"""
        if session_id in self.sessions:
            del self.sessions[session_id]
    
    def cleanup_old_sessions(self):
        """Remove sessions older than cleanup_interval"""
        now = datetime.now()
        to_delete = []
        
        for session_id, session in self.sessions.items():
            if now - session.last_interaction > self.cleanup_interval:
                to_delete.append(session_id)
        
        for session_id in to_delete:
            del self.sessions[session_id]
    
    def add_question_answer(
        self,
        session_id: str,
        question: str,
        answer: str,
        evaluation: Dict,
        difficulty: str,
        topic: str = None
    ):
        """Add Q&A to session history"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        from models.interview_session import QuestionAnswer
        
        qa = QuestionAnswer(
            question=question,
            answer=answer,
            evaluation=evaluation,
            difficulty=difficulty,
            topic=topic
        )
        
        session.questions_asked.append(qa)
        session.total_questions += 1
        
        # Track performance for adaptation
        if evaluation and 'overall_score' in evaluation:
            session.performance_history.append(evaluation['overall_score'])
            # Keep last 5 scores only
            if len(session.performance_history) > 5:
                session.performance_history.pop(0)
        
        self.update_session(session)
    
    def advance_stage(self, session_id: str, new_stage: InterviewStage):
        """Move to next interview stage"""
        session = self.get_session(session_id)
        if not session:
            raise ValueError("Session not found")
        
        session.stage = new_stage
        self.update_session(session)

# Global instance
session_manager = SessionManager()
```

---

## RESUME ANALYSIS

### Q: "How do you parse and analyze resumes?"

**Your Answer:**

"We use PyPDF2 to extract text from PDF resumes, then use the LLM to extract structured information.

#### **RESUME ANALYZER:**

**File:** `ai-service/services/resume_analyzer.py`

```python
import PyPDF2
import re
from typing import Dict, List
from services.llm import get_llm_response

class ResumeAnalyzer:
    """Extract structured data from resume text"""
    
    def __init__(self):
        self.skills_keywords = [
            "python", "java", "javascript", "typescript", "c++", "react",
            "node", "express", "django", "flask", "mongodb", "postgresql",
            "aws", "docker", "kubernetes", "machine learning", "ai"
        ]
    
    def parse_pdf(self, pdf_path: str) -> str:
        """Extract text from PDF resume"""
        try:
            with open(pdf_path, 'rb') as file:
                pdf_reader = PyPDF2.PdfReader(file)
                text = ""
                
                for page in pdf_reader.pages:
                    text += page.extract_text()
                
                return text.strip()
        except Exception as e:
            raise Exception(f"Failed to parse PDF: {str(e)}")
    
    async def analyze_resume(self, resume_text: str) -> Dict:
        """Extract structured information using LLM"""
        
        prompt = f"""
        Analyze the following resume and extract structured information.
        
        Resume:
        {resume_text}
        
        Extract and return in JSON format:
        1. skills: List of technical skills (programming languages, frameworks, tools)
        2. experience: List of work experiences with company, role, duration
        3. projects: List of projects with name, technologies, description
        4. education: Degree, university, graduation year
        5. key_achievements: Notable accomplishments
        
        Return ONLY valid JSON, no extra text.
        """
        
        response = await get_llm_response(prompt)
        
        # Parse JSON from response
        import json
        try:
            analysis = json.loads(response)
        except json.JSONDecodeError:
            # Fallback: Extract manually
            analysis = self._manual_extraction(resume_text)
        
        return analysis
    
    def _manual_extraction(self, text: str) -> Dict:
        """Fallback manual extraction if LLM fails"""
        
        # Extract skills by keyword matching
        skills = []
        text_lower = text.lower()
        
        for skill in self.skills_keywords:
            if skill in text_lower:
                skills.append(skill.title())
        
        # Extract email
        email_pattern = r'\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b'
        emails = re.findall(email_pattern, text)
        
        # Extract phone
        phone_pattern = r'\+?[\d\s\-\(\)]{10,}'
        phones = re.findall(phone_pattern, text)
        
        return {
            "skills": list(set(skills)),
            "email": emails[0] if emails else None,
            "phone": phones[0] if phones else None,
            "experience": [],
            "projects": [],
            "education": None
        }
    
    def identify_strong_areas(self, analysis: Dict, coding_profile: Dict = None) -> List[str]:
        """Identify candidate's strong technical areas"""
        strong_areas = []
        
        # From resume skills
        if analysis.get('skills'):
            strong_areas.extend(analysis['skills'][:5])  # Top 5
        
        # From coding profile
        if coding_profile:
            # LeetCode strong topics
            if coding_profile.get('leetcode', {}).get('strongTopics'):
                strong_areas.extend(coding_profile['leetcode']['strongTopics'])
            
            # Codeforces rating
            cf_rating = coding_profile.get('codeforces', {}).get('rating', 0)
            if cf_rating > 1600:
                strong_areas.append('Competitive Programming')
        
        return list(set(strong_areas))[:10]  # Max 10
    
    def identify_weak_areas(self, coding_profile: Dict = None) -> List[str]:
        """Identify areas for improvement"""
        weak_areas = []
        
        if coding_profile:
            # LeetCode weak topics
            if coding_profile.get('leetcode', {}).get('weakTopics'):
                weak_areas.extend(coding_profile['leetcode']['weakTopics'])
        
        return list(set(weak_areas))[:5]  # Max 5

resume_analyzer = ResumeAnalyzer()
```

---

**API Endpoint:**

```python
# File: ai-service/routes/resume.py

from fastapi import APIRouter, UploadFile, File, HTTPException
import os
from services.resume_analyzer import resume_analyzer

router = APIRouter(prefix="/resume", tags=["Resume"])

@router.post("/upload")
async def upload_resume(
    file: UploadFile = File(...),
    session_id: str = None
):
    """Upload and analyze resume"""
    
    # Validate file type
    if not file.filename.endswith('.pdf'):
        raise HTTPException(400, "Only PDF files supported")
    
    # Save file
    upload_dir = "uploads"
    os.makedirs(upload_dir, exist_ok=True)
    
    file_path = os.path.join(upload_dir, f"{session_id}_{file.filename}")
    
    with open(file_path, "wb") as f:
        content = await file.read()
        f.write(content)
    
    try:
        # Extract text
        resume_text = resume_analyzer.parse_pdf(file_path)
        
        # Analyze
        analysis = await resume_analyzer.analyze_resume(resume_text)
        
        # Update session if provided
        if session_id:
            from services.session_manager import session_manager
            session = session_manager.get_session(session_id)
            if session:
                session.resume_text = resume_text
                session.resume_analysis = analysis
                session_manager.update_session(session)
        
        return {
            "message": "Resume uploaded successfully",
            "analysis": analysis
        }
    
    except Exception as e:
        raise HTTPException(500, f"Failed to process resume: {str(e)}")
    
    finally:
        # Cleanup file
        if os.path.exists(file_path):
            os.remove(file_path)
```



---

## QUESTION GENERATION (RAG)

### Q: "How does RAG work for question generation?"

**Your Answer:**

"RAG (Retrieval Augmented Generation) retrieves relevant questions from our vector database based on the user's profile and difficulty level, then the LLM generates contextual follow-ups.

#### **VECTOR DATABASE SETUP:**

**File:** `ai-service/services/vectorstore.py`

```python
import chromadb
from chromadb.config import Settings
from typing import List, Dict
from services.embeddings import get_embeddings

class VectorStore:
    """Manages question bank in ChromaDB"""
    
    def __init__(self):
        # Initialize ChromaDB
        self.client = chromadb.Client(Settings(
            chroma_db_impl="duckdb+parquet",
            persist_directory="./vector_db"
        ))
        
        # Create collections for each topic
        self.collections = {
            'dsa': self.client.get_or_create_collection("dsa_questions"),
            'system_design': self.client.get_or_create_collection("system_design"),
            'os': self.client.get_or_create_collection("os_questions"),
            'dbms': self.client.get_or_create_collection("dbms_questions"),
            'oops': self.client.get_or_create_collection("oops_questions"),
            'react': self.client.get_or_create_collection("react_questions"),
            'node': self.client.get_or_create_collection("node_questions"),
            'cpp_java': self.client.get_or_create_collection("cpp_java_questions"),
            'cn': self.client.get_or_create_collection("cn_questions")
        }
    
    def add_questions(self, topic: str, questions: List[Dict]):
        """Add questions to vector store"""
        collection = self.collections.get(topic)
        if not collection:
            raise ValueError(f"Unknown topic: {topic}")
        
        # Generate embeddings
        question_texts = [q['question'] for q in questions]
        embeddings = get_embeddings(question_texts)
        
        # Add to collection
        collection.add(
            documents=question_texts,
            embeddings=embeddings,
            metadatas=[{
                'difficulty': q['difficulty'],
                'topic': q.get('topic', topic),
                'subtopic': q.get('subtopic', '')
            } for q in questions],
            ids=[f"{topic}_{i}" for i in range(len(questions))]
        )
    
    def search_questions(
        self,
        topic: str,
        query: str = None,
        difficulty: str = None,
        n_results: int = 5,
        exclude_ids: List[str] = None
    ) -> List[Dict]:
        """Search for relevant questions"""
        
        collection = self.collections.get(topic)
        if not collection:
            return []
        
        # Build filter
        where_filter = {}
        if difficulty:
            where_filter['difficulty'] = difficulty
        
        # If no query, use random sampling
        if not query:
            query = "programming interview question"
        
        # Generate query embedding
        query_embedding = get_embeddings([query])[0]
        
        # Search
        results = collection.query(
            query_embeddings=[query_embedding],
            n_results=n_results * 2,  # Get more, filter later
            where=where_filter if where_filter else None
        )
        
        # Format results
        questions = []
        for i, doc in enumerate(results['documents'][0]):
            question_id = results['ids'][0][i]
            
            # Skip excluded
            if exclude_ids and question_id in exclude_ids:
                continue
            
            questions.append({
                'id': question_id,
                'question': doc,
                'metadata': results['metadatas'][0][i],
                'similarity': results['distances'][0][i] if 'distances' in results else None
            })
            
            if len(questions) >= n_results:
                break
        
        return questions
    
    def get_question_by_id(self, question_id: str) -> Dict:
        """Retrieve specific question"""
        topic = question_id.split('_')[0]
        collection = self.collections.get(topic)
        
        if not collection:
            return None
        
        result = collection.get(ids=[question_id])
        if not result or not result['documents']:
            return None
        
        return {
            'id': question_id,
            'question': result['documents'][0],
            'metadata': result['metadatas'][0]
        }

vector_store = VectorStore()
```

---

#### **QUESTION GENERATOR:**

**File:** `ai-service/services/questions_generator.py`

```python
from services.vectorstore import vector_store
from services.llm import get_llm_response
from typing import Dict, List
import random

class QuestionGenerator:
    """Generate interview questions using RAG"""
    
    def __init__(self):
        self.topic_map = {
            'dsa': ['arrays', 'trees', 'graphs', 'dp', 'greedy'],
            'system_design': ['scalability', 'caching', 'databases', 'load_balancing'],
            'os': ['processes', 'threads', 'memory', 'scheduling'],
            'dbms': ['sql', 'transactions', 'indexing', 'normalization']
        }
    
    async def generate_question(
        self,
        session_id: str,
        stage: str,
        difficulty: str,
        context: Dict = None
    ) -> str:
        """Generate next question based on stage and context"""
        
        if stage == "introduction":
            return await self._generate_intro_question(context)
        
        elif stage == "resume_discussion":
            return await self._generate_resume_question(context)
        
        elif stage == "technical":
            return await self._generate_technical_question(difficulty, context)
        
        elif stage == "behavioral":
            return await self._generate_behavioral_question(context)
        
        elif stage == "closing":
            return "Thank you for your time. Do you have any questions for us?"
    
    async def _generate_intro_question(self, context: Dict) -> str:
        """Generate personalized introduction"""
        name = context.get('displayName', 'candidate')
        
        return f"Hello {name}! Thank you for joining this interview. Let's start with a brief introduction. Tell me about yourself and your background in programming."
    
    async def _generate_resume_question(self, context: Dict) -> str:
        """Generate question about resume"""
        resume_analysis = context.get('resume_analysis', {})
        
        # Ask about specific project
        projects = resume_analysis.get('projects', [])
        if projects:
            project = random.choice(projects)
            return f"I see you worked on '{project.get('name')}'. Can you walk me through the architecture and your specific contributions?"
        
        # Ask about experience
        experience = resume_analysis.get('experience', [])
        if experience:
            exp = random.choice(experience)
            return f"Tell me about your role as {exp.get('role')} at {exp.get('company')}. What were your main responsibilities?"
        
        # Generic
        return "Tell me about your most challenging project and how you approached it."
    
    async def _generate_technical_question(
        self,
        difficulty: str,
        context: Dict
    ) -> str:
        """Generate technical question using RAG"""
        
        # Determine topic based on weak areas or random
        weak_topics = context.get('weak_topics', [])
        topic = random.choice(weak_topics) if weak_topics else random.choice(list(self.topic_map.keys()))
        
        # Get asked questions to avoid repetition
        asked_questions = context.get('asked_question_ids', [])
        
        # Search vector DB
        questions = vector_store.search_questions(
            topic=topic,
            difficulty=difficulty,
            n_results=3,
            exclude_ids=asked_questions
        )
        
        if not questions:
            # Fallback: Generate with LLM
            prompt = f"Generate a {difficulty} level interview question about {topic}. Keep it concise and clear."
            return await get_llm_response(prompt)
        
        # Pick best question
        selected = questions[0]
        
        # Personalize with LLM
        prompt = f"""
        Rephrase this interview question to be more conversational:
        
        Original: {selected['question']}
        
        Make it sound natural, as if a real interviewer is asking. Keep the technical content the same.
        """
        
        personalized = await get_llm_response(prompt)
        return personalized.strip()
    
    async def _generate_behavioral_question(self, context: Dict) -> str:
        """Generate behavioral question"""
        behavioral_questions = [
            "Tell me about a time when you had to debug a critical production issue under pressure.",
            "Describe a situation where you disagreed with a team member. How did you handle it?",
            "Have you ever missed a deadline? What happened and what did you learn?",
            "Tell me about the most complex problem you've solved. How did you approach it?",
            "Describe a time when you had to learn a new technology quickly for a project."
        ]
        
        return random.choice(behavioral_questions)
    
    async def generate_followup(
        self,
        original_question: str,
        user_answer: str,
        evaluation: Dict
    ) -> str:
        """Generate intelligent follow-up question"""
        
        prompt = f"""
        You are an experienced technical interviewer. Based on the candidate's answer, generate a probing follow-up question.
        
        Original Question: {original_question}
        
        Candidate's Answer: {user_answer}
        
        Evaluation: {evaluation.get('feedback', '')}
        
        Generate a follow-up that:
        - Digs deeper into their understanding
        - Addresses gaps mentioned in evaluation
        - Is concise and specific
        
        Return only the follow-up question, nothing else.
        """
        
        followup = await get_llm_response(prompt)
        return followup.strip()

question_generator = QuestionGenerator()
```

---

## ANSWER EVALUATION

### Q: "How do you evaluate user answers?"

**Your Answer:**

"We use the LLM to evaluate answers across multiple dimensions: Technical Accuracy, Depth, Clarity, Completeness, and Communication.

#### **ANSWER EVALUATOR:**

**File:** `ai-service/services/answer_evaluator.py`

```python
from services.llm import get_llm_response
from typing import Dict
import json

class AnswerEvaluator:
    """Evaluate interview answers"""
    
    async def evaluate_answer(
        self,
        question: str,
        answer: str,
        context: Dict = None
    ) -> Dict:
        """Comprehensive answer evaluation"""
        
        prompt = f"""
        You are an expert technical interviewer. Evaluate this interview answer.
        
        Question: {question}
        
        Candidate's Answer: {answer}
        
        Evaluate on these dimensions (score 0-10 for each):
        1. technical_accuracy: Correctness of technical information
        2. depth: How deep is their understanding
        3. clarity: How clear and well-structured is the explanation
        4. completeness: Did they cover all important aspects
        5. communication: How well they communicate complex ideas
        
        Also provide:
        - overall_score: Average of all dimensions (0-10)
        - strengths: List of 2-3 things they did well
        - weaknesses: List of 2-3 areas for improvement
        - missed_concepts: Important concepts they didn't mention
        - feedback: Detailed constructive feedback (2-3 sentences)
        
        Return ONLY a valid JSON object with these fields. No extra text.
        """
        
        try:
            response = await get_llm_response(prompt)
            
            # Parse JSON
            evaluation = json.loads(response)
            
            # Validate structure
            required_fields = [
                'technical_accuracy', 'depth', 'clarity', 
                'completeness', 'communication', 'overall_score'
            ]
            
            for field in required_fields:
                if field not in evaluation:
                    evaluation[field] = 5.0  # Default
            
            # Ensure scores are in range
            for field in required_fields:
                evaluation[field] = max(0, min(10, float(evaluation[field])))
            
            # Add metadata
            evaluation['question'] = question
            evaluation['answer'] = answer
            
            return evaluation
            
        except json.JSONDecodeError:
            # Fallback: Basic evaluation
            return self._fallback_evaluation(answer)
        
        except Exception as e:
            print(f"Evaluation error: {e}")
            return self._fallback_evaluation(answer)
    
    def _fallback_evaluation(self, answer: str) -> Dict:
        """Simple fallback if LLM fails"""
        
        # Basic heuristics
        word_count = len(answer.split())
        
        if word_count < 20:
            score = 3.0
            feedback = "Answer is too brief. Provide more details."
        elif word_count < 50:
            score = 5.0
            feedback = "Decent answer but could be more detailed."
        elif word_count < 100:
            score = 7.0
            feedback = "Good answer with sufficient detail."
        else:
            score = 8.0
            feedback = "Comprehensive answer."
        
        return {
            'technical_accuracy': score,
            'depth': score,
            'clarity': score,
            'completeness': score,
            'communication': score,
            'overall_score': score,
            'strengths': ["Provided an answer"],
            'weaknesses': ["Could elaborate more"],
            'missed_concepts': [],
            'feedback': feedback
        }

answer_evaluator = AnswerEvaluator()
```

---

## DIFFICULTY ADAPTATION

### Q: "How does dynamic difficulty adjustment work?"

**Your Answer:**

"The system tracks recent performance and adjusts difficulty based on a sliding window of scores.

#### **DIFFICULTY ADAPTER:**

**File:** `ai-service/services/difficulty_adapter.py`

```python
from typing import List
from models.interview_session import DifficultyLevel

class DifficultyAdapter:
    """Dynamically adjust interview difficulty"""
    
    def __init__(self):
        self.thresholds = {
            'increase': 7.5,  # Increase difficulty if avg score > 7.5
            'decrease': 5.0   # Decrease difficulty if avg score < 5.0
        }
        
        self.difficulty_progression = {
            DifficultyLevel.BEGINNER: DifficultyLevel.INTERMEDIATE,
            DifficultyLevel.INTERMEDIATE: DifficultyLevel.ADVANCED,
            DifficultyLevel.ADVANCED: DifficultyLevel.ADVANCED  # Max level
        }
        
        self.difficulty_regression = {
            DifficultyLevel.ADVANCED: DifficultyLevel.INTERMEDIATE,
            DifficultyLevel.INTERMEDIATE: DifficultyLevel.BEGINNER,
            DifficultyLevel.BEGINNER: DifficultyLevel.BEGINNER  # Min level
        }
    
    def should_adjust_difficulty(
        self,
        performance_history: List[float],
        current_difficulty: DifficultyLevel
    ) -> tuple[bool, DifficultyLevel]:
        """Determine if difficulty should change"""
        
        if len(performance_history) < 3:
            # Need at least 3 questions
            return False, current_difficulty
        
        # Calculate average of last 3 scores
        recent_scores = performance_history[-3:]
        avg_score = sum(recent_scores) / len(recent_scores)
        
        # Check thresholds
        if avg_score > self.thresholds['increase']:
            # Increase difficulty
            new_difficulty = self.difficulty_progression.get(
                current_difficulty,
                current_difficulty
            )
            
            if new_difficulty != current_difficulty:
                return True, new_difficulty
        
        elif avg_score < self.thresholds['decrease']:
            # Decrease difficulty
            new_difficulty = self.difficulty_regression.get(
                current_difficulty,
                current_difficulty
            )
            
            if new_difficulty != current_difficulty:
                return True, new_difficulty
        
        return False, current_difficulty
    
    def get_adjustment_message(
        self,
        old_difficulty: DifficultyLevel,
        new_difficulty: DifficultyLevel
    ) -> str:
        """Generate message about difficulty change"""
        
        if new_difficulty > old_difficulty:
            return "Great job! Let's try some more challenging questions."
        else:
            return "Let's adjust the difficulty to better match your current level."

difficulty_adapter = DifficultyAdapter()
```

---

## REPORT GENERATION

### Q: "How do you generate the final interview report?"

**Your Answer:**

"The report aggregates all Q&A evaluations and generates a comprehensive assessment with hiring recommendation.

#### **REPORT GENERATOR:**

**File:** `ai-service/services/report_generator.py`

```python
from typing import Dict, List
from services.llm import get_llm_response
import json

class ReportGenerator:
    """Generate comprehensive interview report"""
    
    async def generate_report(
        self,
        session_data: Dict
    ) -> Dict:
        """Create final interview report"""
        
        questions_asked = session_data.get('questions_asked', [])
        
        if not questions_asked:
            return {
                'message': 'No questions answered',
                'overall_score': 0
            }
        
        # Calculate aggregate scores
        scores = self._calculate_aggregate_scores(questions_asked)
        
        # Generate insights with LLM
        insights = await self._generate_insights(questions_asked, scores)
        
        # Build report
        report = {
            'overall_score': scores['overall'],
            'dimension_scores': scores['dimensions'],
            'total_questions': len(questions_asked),
            'stages_completed': self._get_completed_stages(session_data),
            
            # Performance breakdown
            'performance_by_difficulty': self._analyze_by_difficulty(questions_asked),
            'performance_by_topic': self._analyze_by_topic(questions_asked),
            
            # Insights
            'strengths': insights.get('strengths', []),
            'weaknesses': insights.get('weaknesses', []),
            'topics_to_improve': insights.get('topics_to_improve', []),
            'missed_concepts': insights.get('missed_concepts', []),
            
            # Recommendations
            'hiring_recommendation': self._get_hiring_recommendation(scores['overall']),
            'learning_path': insights.get('learning_path', []),
            'suggested_problems': insights.get('suggested_problems', []),
            
            # Detailed Q&A
            'questions_and_answers': [
                {
                    'question': qa['question'],
                    'answer': qa['answer'],
                    'score': qa['evaluation']['overall_score'],
                    'feedback': qa['evaluation']['feedback']
                }
                for qa in questions_asked
            ]
        }
        
        return report
    
    def _calculate_aggregate_scores(self, questions_asked: List[Dict]) -> Dict:
        """Calculate overall and dimension scores"""
        
        dimensions = ['technical_accuracy', 'depth', 'clarity', 'completeness', 'communication']
        dimension_scores = {dim: [] for dim in dimensions}
        overall_scores = []
        
        for qa in questions_asked:
            eval_data = qa.get('evaluation', {})
            
            for dim in dimensions:
                if dim in eval_data:
                    dimension_scores[dim].append(eval_data[dim])
            
            if 'overall_score' in eval_data:
                overall_scores.append(eval_data['overall_score'])
        
        # Calculate averages
        avg_dimensions = {
            dim: round(sum(scores) / len(scores), 2) if scores else 0
            for dim, scores in dimension_scores.items()
        }
        
        avg_overall = round(sum(overall_scores) / len(overall_scores), 2) if overall_scores else 0
        
        return {
            'overall': avg_overall,
            'dimensions': avg_dimensions
        }
    
    async def _generate_insights(
        self,
        questions_asked: List[Dict],
        scores: Dict
    ) -> Dict:
        """Generate insights using LLM"""
        
        # Prepare data for LLM
        qa_summary = "\n".join([
            f"Q: {qa['question']}\nScore: {qa['evaluation']['overall_score']}/10\nFeedback: {qa['evaluation'].get('feedback', '')}\n"
            for qa in questions_asked
        ])
        
        prompt = f"""
        You are a senior technical interviewer. Based on this interview performance, provide detailed insights.
        
        Overall Score: {scores['overall']}/10
        Dimension Scores: {scores['dimensions']}
        
        Interview Q&A:
        {qa_summary}
        
        Provide insights in JSON format:
        {{
            "strengths": [List of 3-5 candidate's strengths],
            "weaknesses": [List of 3-5 areas for improvement],
            "topics_to_improve": [List of specific topics to study],
            "missed_concepts": [Important concepts they didn't demonstrate],
            "learning_path": [Step-by-step learning recommendations],
            "suggested_problems": [List of 5 LeetCode problems with difficulty]
        }}
        
        Return ONLY valid JSON.
        """
        
        try:
            response = await get_llm_response(prompt)
            insights = json.loads(response)
            return insights
        except:
            return self._fallback_insights(questions_asked)
    
    def _fallback_insights(self, questions_asked: List[Dict]) -> Dict:
        """Fallback insights if LLM fails"""
        return {
            'strengths': ["Attempted all questions"],
            'weaknesses': ["Needs more practice"],
            'topics_to_improve': ["General DSA"],
            'missed_concepts': [],
            'learning_path': ["Practice more problems"],
            'suggested_problems': [
                {"name": "Two Sum", "difficulty": "Easy"},
                {"name": "Valid Parentheses", "difficulty": "Easy"}
            ]
        }
    
    def _get_hiring_recommendation(self, overall_score: float) -> str:
        """Generate hiring recommendation"""
        if overall_score >= 8.5:
            return "Strong Hire - Exceptional performance"
        elif overall_score >= 7.0:
            return "Hire - Good performance with minor gaps"
        elif overall_score >= 5.5:
            return "Maybe - Shows potential but needs improvement"
        else:
            return "No Hire - Significant gaps in fundamentals"
    
    def _analyze_by_difficulty(self, questions_asked: List[Dict]) -> Dict:
        """Analyze performance by difficulty level"""
        difficulty_scores = {'beginner': [], 'intermediate': [], 'advanced': []}
        
        for qa in questions_asked:
            difficulty = qa.get('difficulty', 'intermediate')
            score = qa.get('evaluation', {}).get('overall_score', 0)
            if difficulty in difficulty_scores:
                difficulty_scores[difficulty].append(score)
        
        return {
            diff: round(sum(scores) / len(scores), 2) if scores else 0
            for diff, scores in difficulty_scores.items()
        }
    
    def _analyze_by_topic(self, questions_asked: List[Dict]) -> Dict:
        """Analyze performance by topic"""
        topic_scores = {}
        
        for qa in questions_asked:
            topic = qa.get('topic', 'general')
            score = qa.get('evaluation', {}).get('overall_score', 0)
            
            if topic not in topic_scores:
                topic_scores[topic] = []
            topic_scores[topic].append(score)
        
        return {
            topic: round(sum(scores) / len(scores), 2)
            for topic, scores in topic_scores.items()
        }
    
    def _get_completed_stages(self, session_data: Dict) -> List[str]:
        """Get list of completed stages"""
        # Track unique stages from questions
        stages = set()
        for qa in session_data.get('questions_asked', []):
            if 'stage' in qa:
                stages.add(qa['stage'])
        return list(stages)

report_generator = ReportGenerator()
```



---

## INTEGRATION WITH MAIN BACKEND

### Q: "How does the Node.js backend integrate with the AI Service?"

**Your Answer:**

"The Node.js backend acts as a proxy, aggregating user data and forwarding requests to the AI Service.

#### **NODE.JS CONTROLLER:**

**File:** `Backend/codeorbit_backend/controllers/ai-interview.controller.js`

```javascript
import axios from 'axios'
import FormData from 'form-data'
import User from '../models/User.js'

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8000'

// Start Interview
export const startInterview = async (req, res) => {
  try {
    const { interview_type, difficulty } = req.body
    const userId = req.userId
    
    // Get user's coding profile
    const user = await User.findById(userId)
    
    const codingProfile = {
      leetcode: user.platforms?.leetcode || null,
      codeforces: user.platforms?.codeforces || null,
      codechef: user.platforms?.codechef || null,
      github: user.platforms?.github || null
    }
    
    // Call AI Service
    const response = await axios.post(`${AI_SERVICE_URL}/interview/start`, {
      user_id: userId,
      interview_type,
      difficulty,
      coding_profile: codingProfile,
      user_info: {
        displayName: user.displayName,
        email: user.email
      }
    })
    
    res.json(response.data)
    
  } catch (error) {
    console.error('Start interview error:', error.response?.data || error.message)
    res.status(500).json({ 
      message: error.response?.data?.detail || 'Failed to start interview' 
    })
  }
}

// Upload Resume
export const uploadResume = async (req, res) => {
  try {
    const { session_id } = req.body
    const file = req.file  // From multer middleware
    
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' })
    }
    
    // Forward to AI Service
    const formData = new FormData()
    formData.append('file', file.buffer, {
      filename: file.originalname,
      contentType: file.mimetype
    })
    formData.append('session_id', session_id)
    
    const response = await axios.post(
      `${AI_SERVICE_URL}/resume/upload`,
      formData,
      {
        headers: formData.getHeaders()
      }
    )
    
    res.json(response.data)
    
  } catch (error) {
    console.error('Upload resume error:', error.response?.data || error.message)
    res.status(500).json({ 
      message: error.response?.data?.detail || 'Failed to upload resume' 
    })
  }
}

// Submit Answer
export const submitAnswer = async (req, res) => {
  try {
    const { session_id, answer } = req.body
    
    const response = await axios.post(`${AI_SERVICE_URL}/interview/answer`, {
      session_id,
      answer
    })
    
    res.json(response.data)
    
  } catch (error) {
    console.error('Submit answer error:', error.response?.data || error.message)
    res.status(500).json({ 
      message: error.response?.data?.detail || 'Failed to submit answer' 
    })
  }
}

// Get Follow-up Question
export const getFollowup = async (req, res) => {
  try {
    const { session_id } = req.body
    
    const response = await axios.post(`${AI_SERVICE_URL}/interview/followup`, {
      session_id
    })
    
    res.json(response.data)
    
  } catch (error) {
    console.error('Get followup error:', error.response?.data || error.message)
    res.status(500).json({ 
      message: error.response?.data?.detail || 'Failed to get followup' 
    })
  }
}

// End Interview
export const endInterview = async (req, res) => {
  try {
    const { session_id } = req.params
    
    const response = await axios.post(
      `${AI_SERVICE_URL}/interview/end/${session_id}`
    )
    
    res.json(response.data)
    
  } catch (error) {
    console.error('End interview error:', error.response?.data || error.message)
    res.status(500).json({ 
      message: error.response?.data?.detail || 'Failed to end interview' 
    })
  }
}

// Get Session Status
export const getSessionStatus = async (req, res) => {
  try {
    const { session_id } = req.params
    
    const response = await axios.get(
      `${AI_SERVICE_URL}/interview/session/${session_id}`
    )
    
    res.json(response.data)
    
  } catch (error) {
    console.error('Get session error:', error.response?.data || error.message)
    res.status(500).json({ 
      message: error.response?.data?.detail || 'Failed to get session' 
    })
  }
}
```

---

#### **ROUTES:**

**File:** `Backend/codeorbit_backend/routes/ai-interview.routes.js`

```javascript
import express from 'express'
import multer from 'multer'
import { auth } from '../middleware/auth.middleware.js'
import {
  startInterview,
  uploadResume,
  submitAnswer,
  getFollowup,
  endInterview,
  getSessionStatus
} from '../controllers/ai-interview.controller.js'

const router = express.Router()

// Multer for file upload
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },  // 5MB
  fileFilter: (req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true)
    } else {
      cb(new Error('Only PDF files allowed'))
    }
  }
})

// Routes
router.post('/start', auth, startInterview)
router.post('/upload-resume', auth, upload.single('resume'), uploadResume)
router.post('/answer', auth, submitAnswer)
router.post('/followup', auth, getFollowup)
router.post('/end/:session_id', auth, endInterview)
router.get('/session/:session_id', auth, getSessionStatus)

export default router
```

---

#### **FRONTEND API INTEGRATION:**

**File:** `codolio/lib/ai-interview-api.ts`

```typescript
import axios from 'axios'

const API_URL = process.env.NEXT_PUBLIC_API_URL

// Start interview
export async function startInterview(data: {
  interview_type: string
  difficulty: string
}) {
  const token = localStorage.getItem('token')
  
  const response = await axios.post(
    `${API_URL}/api/ai-interview/start`,
    data,
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  
  return response.data
}

// Upload resume
export async function uploadResume(file: File, sessionId: string) {
  const token = localStorage.getItem('token')
  
  const formData = new FormData()
  formData.append('resume', file)
  formData.append('session_id', sessionId)
  
  const response = await axios.post(
    `${API_URL}/api/ai-interview/upload-resume`,
    formData,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'multipart/form-data'
      }
    }
  )
  
  return response.data
}

// Submit answer
export async function submitAnswer(sessionId: string, answer: string) {
  const token = localStorage.getItem('token')
  
  const response = await axios.post(
    `${API_URL}/api/ai-interview/answer`,
    { session_id: sessionId, answer },
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  
  return response.data
}

// End interview
export async function endInterview(sessionId: string) {
  const token = localStorage.getItem('token')
  
  const response = await axios.post(
    `${API_URL}/api/ai-interview/end/${sessionId}`,
    {},
    {
      headers: { Authorization: `Bearer ${token}` }
    }
  )
  
  return response.data
}
```

---

#### **FRONTEND INTERVIEW ROOM:**

**File:** `codolio/components/pages/mock-interview/interview-room.tsx`

```typescript
"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { submitAnswer, endInterview } from "@/lib/ai-interview-api"
import { Loader2 } from "lucide-react"

export function InterviewRoom({ sessionId, initialQuestion }) {
  const [currentQuestion, setCurrentQuestion] = useState(initialQuestion)
  const [answer, setAnswer] = useState("")
  const [loading, setLoading] = useState(false)
  const [evaluation, setEvaluation] = useState(null)
  const [questionNumber, setQuestionNumber] = useState(1)
  
  const handleSubmit = async () => {
    if (!answer.trim()) return
    
    setLoading(true)
    
    try {
      const response = await submitAnswer(sessionId, answer)
      
      // Show evaluation
      setEvaluation(response.evaluation)
      
      // Set next question
      if (response.next_question) {
        setTimeout(() => {
          setCurrentQuestion(response.next_question)
          setAnswer("")
          setEvaluation(null)
          setQuestionNumber(prev => prev + 1)
        }, 5000)  // Show feedback for 5 seconds
      }
      
    } catch (error) {
      console.error("Submit error:", error)
      alert("Failed to submit answer")
    } finally {
      setLoading(false)
    }
  }
  
  const handleEndInterview = async () => {
    if (!confirm("Are you sure you want to end the interview?")) return
    
    try {
      const response = await endInterview(sessionId)
      // Navigate to report page
      window.location.href = `/mock-interview/report?data=${encodeURIComponent(JSON.stringify(response.report))}`
    } catch (error) {
      console.error("End interview error:", error)
    }
  }
  
  return (
    <div className="max-w-4xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">Question {questionNumber}</h2>
        <Button variant="destructive" onClick={handleEndInterview}>
          End Interview
        </Button>
      </div>
      
      {/* Question Card */}
      <Card>
        <CardHeader>
          <CardTitle>Interviewer</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-lg">{currentQuestion}</p>
        </CardContent>
      </Card>
      
      {/* Evaluation (if available) */}
      {evaluation && (
        <Card className="border-green-500">
          <CardHeader>
            <CardTitle>Feedback</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex items-center justify-between">
              <span>Score:</span>
              <span className="text-2xl font-bold">{evaluation.overall_score}/10</span>
            </div>
            <p className="text-sm text-muted-foreground">{evaluation.feedback}</p>
            
            {evaluation.strengths && (
              <div>
                <p className="font-semibold text-green-600">Strengths:</p>
                <ul className="text-sm list-disc pl-5">
                  {evaluation.strengths.map((s, i) => (
                    <li key={i}>{s}</li>
                  ))}
                </ul>
              </div>
            )}
            
            {evaluation.weaknesses && (
              <div>
                <p className="font-semibold text-orange-600">Improvements:</p>
                <ul className="text-sm list-disc pl-5">
                  {evaluation.weaknesses.map((w, i) => (
                    <li key={i}>{w}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      {/* Answer Input */}
      {!evaluation && (
        <Card>
          <CardHeader>
            <CardTitle>Your Answer</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Textarea
              placeholder="Type your answer here..."
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              rows={10}
              className="resize-none"
            />
            
            <Button 
              onClick={handleSubmit}
              disabled={loading || !answer.trim()}
              className="w-full"
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Evaluating...
                </>
              ) : (
                "Submit Answer"
              )}
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
```

---

## COMMON INTERVIEW QUESTIONS

### Q: "Why use a separate Python service instead of keeping everything in Node.js?"

A: "
**Technical Reasons:**
1. **Python Ecosystem:** Better libraries for AI/ML (LangChain, transformers, sentence-transformers)
2. **Type Safety:** Pydantic provides better data validation than plain JavaScript
3. **Performance:** Python's async/await with FastAPI is fast for I/O-bound tasks
4. **Specialized Libraries:** ChromaDB, PyPDF2 have no good Node.js equivalents

**Architectural Reasons:**
1. **Separation of Concerns:** AI logic isolated from business logic
2. **Independent Scaling:** Can deploy AI service on GPU instances
3. **Technology Freedom:** Use best tool for each job
4. **Fault Isolation:** AI failures don't crash main app
5. **Team Specialization:** ML engineers can work independently

**Trade-offs:**
- Added complexity (managing 2 services)
- Network latency between services
- Duplicate authentication logic
"

---

### Q: "How do you handle rate limiting with Groq API?"

A: "
1. **Request Queueing:** Queue requests if rate limit hit
2. **Exponential Backoff:** Wait 2^n seconds on 429 errors
3. **Token Counting:** Track tokens used per session
4. **Caching:** Cache common responses (greetings, closing)
5. **Fallback:** Switch to alternative LLM if Groq is down
"

---

### Q: "What if the LLM generates incorrect technical answers?"

A: "
1. **Prompt Engineering:** Use few-shot examples in prompts
2. **System Prompts:** Set strict guidelines for technical accuracy
3. **Validation:** Parse and validate JSON responses
4. **Fallback Logic:** If LLM fails, use rule-based evaluation
5. **Human Review:** (Future) Flag answers for human review
6. **Feedback Loop:** Log bad responses for prompt improvement
"

---

### Q: "How do you ensure data privacy?"

A: "
1. **No Persistent Storage:** Sessions are in-memory only
2. **Resume Deletion:** PDFs deleted immediately after parsing
3. **No Logging of Answers:** User responses not logged
4. **Encrypted Transit:** HTTPS for all communication
5. **Token Expiry:** Sessions auto-expire after 2 hours
6. **No Third-party Sharing:** Data never leaves our infrastructure
"

---

### Q: "Performance: How fast is the interview experience?"

A: "
**Latency Breakdown:**
- Question Generation: ~2-3 seconds (LLM + RAG)
- Answer Evaluation: ~3-4 seconds (LLM processing)
- Resume Parsing: ~1-2 seconds
- Report Generation: ~5-6 seconds

**Optimizations:**
1. **Streaming Responses:** (Future) Stream LLM output token-by-token
2. **Pre-loading:** Generate next question while user types
3. **Caching:** Common questions cached in Redis
4. **Parallel Processing:** Evaluate while generating next question
5. **Connection Pooling:** Reuse HTTP connections to Groq
"

---

## DEPLOYMENT

### Q: "How is the AI Service deployed?"

A: "
**Development:**
```bash
cd ai-service
uvicorn app:app --reload --port 8000
```

**Production (Railway/Render):**
```bash
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

EXPOSE 8000

CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "8000"]
```

**Environment Variables:**
- `GROQ_API_KEY`: Groq API key
- `ENVIRONMENT`: production/development
- `LOG_LEVEL`: info/debug

**Monitoring:**
- Health check endpoint: `/health`
- Metrics: Request count, latency, error rate
- Logging: Winston for structured logs
"

---

## SUMMARY - PHASE 3

**Key Components:**
✅ Session Management (In-memory with Pydantic)
✅ Resume Analysis (PyPDF2 + LLM extraction)
✅ Question Generation (RAG with ChromaDB)
✅ Answer Evaluation (Multi-dimensional scoring)
✅ Difficulty Adaptation (Dynamic adjustment)
✅ Report Generation (Comprehensive feedback)
✅ Backend Integration (Node.js proxy)

**Technologies:**
- FastAPI (Python web framework)
- LangChain (LLM orchestration)
- Groq + Llama 3.1 (LLM provider)
- ChromaDB (Vector database)
- Sentence Transformers (Embeddings)
- PyPDF2 (PDF parsing)
- Pydantic (Data validation)

**Data Flow:**
```
User → Next.js → Node.js Backend → AI Service → Groq LLM → Response
                      ↓
                MongoDB (User Profile)
                ChromaDB (Question Bank)
```

---

## 🎉 COMPLETE PROJECT SUMMARY

**CodeOrbit** is a full-stack competitive programming platform with 3 major pillars:

**1. PHASE 1 - Dashboard & Core Features:**
- Unified activity tracking across platforms
- Real-time stats aggregation
- Contest tracker
- Resources library

**2. PHASE 2 - Collaborative Space:**
- Friends system
- Real-time notifications
- Ping invitations
- Video calling (WebRTC)
- Shared whiteboard
- Stream Chat integration

**3. PHASE 3 - AI Service:**
- Resume-based mock interviews
- Adaptive difficulty
- Multi-dimensional evaluation
- Comprehensive reports
- Learning recommendations

**Total Tech Stack:**
- **Frontend:** Next.js, TypeScript, TailwindCSS
- **Backend:** Node.js, Express, MongoDB
- **Real-time:** Socket.io, WebRTC
- **AI:** Python FastAPI, LangChain, Groq, ChromaDB
- **Auth:** Firebase, JWT
- **Deployment:** Vercel, Render, Railway

---

## 💡 TIPS FOR INTERVIEW

1. **Start with Overview:** Explain the problem CodeOrbit solves
2. **System Design:** Draw architecture diagram on whiteboard
3. **Deep Dive:** Pick one feature and explain end-to-end
4. **Trade-offs:** Discuss why you made certain decisions
5. **Scalability:** Explain how you'd scale to 100k users
6. **Challenges:** Share real problems you faced and solved
7. **Future Work:** What features would you add next?

**Good Luck! 🚀**

