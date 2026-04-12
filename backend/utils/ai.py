import os
import json
from google import genai
from dotenv import load_dotenv
from typing import Dict, Any, List
from pydantic import BaseModel

load_dotenv()

client = genai.Client(api_key=os.getenv("GEMINI_API_KEY"))

TOPIC_DESCRIPTIONS: Dict[str, str] = {
    "History": "world history, historical events, important dates, and famous figures",
    "Coding": "programming concepts, algorithms, data structures, and software engineering",
    "Science": "physics, chemistry, biology, astronomy, and scientific discoveries",
    "Football": "European Football (soccer): clubs, players, tournaments, records, and history",
    "Technology": "consumer technology, software, hardware, companies, and tech history",
    "Geography": "countries, capitals, landmarks, rivers, mountains, and world regions",
}

FALLBACK_QUESTIONS: Dict[str, List[Dict]] = {
    "History": [
        {
            "question": "In which year did World War II end?",
            "options": ["1943", "1944", "1945", "1946"],
            "correct_answer_id": 2,
            "explanation": "WWII ended in 1945 — Germany surrendered in May, Japan in September.",
        },
        {
            "question": "Who was the first President of the United States?",
            "options": ["John Adams", "Thomas Jefferson", "George Washington", "Benjamin Franklin"],
            "correct_answer_id": 2,
            "explanation": "George Washington served as the first President from 1789 to 1797.",
        },
        {
            "question": "The Berlin Wall fell in which year?",
            "options": ["1987", "1989", "1991", "1993"],
            "correct_answer_id": 1,
            "explanation": "The Berlin Wall fell on November 9, 1989.",
        },
    ],
    "Coding": [
        {
            "question": "Which data structure uses LIFO order?",
            "options": ["Queue", "Stack", "Linked List", "Tree"],
            "correct_answer_id": 1,
            "explanation": "A Stack uses Last In, First Out — the last element pushed is the first popped.",
        },
        {
            "question": "What is the time complexity of binary search?",
            "options": ["O(n)", "O(n²)", "O(log n)", "O(1)"],
            "correct_answer_id": 2,
            "explanation": "Binary search halves the search space each step, giving O(log n).",
        },
        {
            "question": "Which keyword defines a function in Python?",
            "options": ["func", "function", "define", "def"],
            "correct_answer_id": 3,
            "explanation": "Python uses 'def' to define functions.",
        },
    ],
    "Science": [
        {
            "question": "What is the chemical symbol for Gold?",
            "options": ["Go", "Gd", "Au", "Ag"],
            "correct_answer_id": 2,
            "explanation": "Gold's symbol is Au, from the Latin 'Aurum'.",
        },
        {
            "question": "How many bones are in the adult human body?",
            "options": ["186", "206", "226", "246"],
            "correct_answer_id": 1,
            "explanation": "The adult human body has 206 bones.",
        },
        {
            "question": "What is the speed of light in a vacuum?",
            "options": ["300,000 km/s", "150,000 km/s", "450,000 km/s", "600,000 km/s"],
            "correct_answer_id": 0,
            "explanation": "Light travels at approximately 299,792 km/s (~300,000 km/s) in a vacuum.",
        },
    ],
    "Football": [
        {
            "question": "Which club has won the most UEFA Champions League titles?",
            "options": ["Barcelona", "Bayern Munich", "Liverpool", "Real Madrid"],
            "correct_answer_id": 3,
            "explanation": "Real Madrid have won the Champions League more times than any other club.",
        },
        {
            "question": "Which country hosted the 2006 FIFA World Cup?",
            "options": ["France", "Germany", "Spain", "Italy"],
            "correct_answer_id": 1,
            "explanation": "Germany hosted the 2006 FIFA World Cup, with Italy winning the tournament.",
        },
        {
            "question": "Who won the Ballon d'Or for the first time in 2009?",
            "options": ["Ronaldo", "Messi", "Xavi", "Iniesta"],
            "correct_answer_id": 1,
            "explanation": "Lionel Messi won his first Ballon d'Or in 2009, beginning a record-breaking streak.",
        },
    ],
    "Technology": [
        {
            "question": "In what year was the first iPhone released?",
            "options": ["2005", "2006", "2007", "2008"],
            "correct_answer_id": 2,
            "explanation": "Apple released the original iPhone on June 29, 2007.",
        },
        {
            "question": "Which company developed the Android operating system?",
            "options": ["Samsung", "Google", "Microsoft", "Apple"],
            "correct_answer_id": 1,
            "explanation": "Android was developed by Android Inc. and later acquired by Google in 2005.",
        },
        {
            "question": "What does 'CPU' stand for?",
            "options": [
                "Central Processing Unit",
                "Computer Personal Unit",
                "Central Program Utility",
                "Core Processing Unit",
            ],
            "correct_answer_id": 0,
            "explanation": "CPU stands for Central Processing Unit — the primary chip that executes instructions.",
        },
    ],
    "Geography": [
        {
            "question": "What is the capital of Australia?",
            "options": ["Sydney", "Melbourne", "Canberra", "Brisbane"],
            "correct_answer_id": 2,
            "explanation": "Canberra is the capital of Australia, chosen as a compromise between Sydney and Melbourne.",
        },
        {
            "question": "Which is the longest river in the world?",
            "options": ["Amazon", "Nile", "Yangtze", "Mississippi"],
            "correct_answer_id": 1,
            "explanation": "The Nile is traditionally considered the world's longest river at ~6,650 km.",
        },
        {
            "question": "How many countries are in Africa?",
            "options": ["44", "49", "54", "58"],
            "correct_answer_id": 2,
            "explanation": "Africa has 54 recognized sovereign countries.",
        },
    ],
}


class Challenge(BaseModel):
    question: str
    options: List[str]
    correct_answer_id: int
    explanation: str


class QuizSchema(BaseModel):
    questions: List[Challenge]


def generate_quiz_with_ai(topic: str, difficulty: str, quantity: int) -> List[Dict[str, Any]]:
    topic_desc = TOPIC_DESCRIPTIONS.get(topic) or f"{topic} — general knowledge and trivia"

    system_prompt = (
        f"You are an expert quiz creator for a competitive multiplayer trivia game.\n"
        f"Generate exactly {quantity} unique {difficulty}-difficulty multiple choice questions about: {topic_desc}.\n"
        f"Each question must have exactly 4 answer options.\n"
        f"correct_answer_id must be 0, 1, 2, or 3 (the index of the correct option).\n"
        f"Keep questions engaging, factually accurate, and well-varied in style."
    )

    try:
        response = client.models.generate_content(
            model="gemini-3-flash-preview",
            contents=f"Generate {quantity} {difficulty} trivia questions about: {topic}.",
            config={
                "system_instruction": system_prompt,
                "response_mime_type": "application/json",
                "response_schema": QuizSchema,
            },
        )
        data = json.loads(response.text)
        questions = data.get("questions", [])
        return questions[:quantity] if len(questions) >= quantity else questions
    except Exception as e:
        print(f"AI generation error: {e}")
        return _get_fallback_questions(topic, quantity)


def _get_fallback_questions(topic: str, quantity: int) -> List[Dict[str, Any]]:
    base = FALLBACK_QUESTIONS.get(topic) or FALLBACK_QUESTIONS["Coding"]
    result = []
    while len(result) < quantity:
        result.extend(base)
    return result[:quantity]
