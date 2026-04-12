import os
from datetime import datetime
from typing import Optional

from dotenv import load_dotenv
from fastapi import Depends, FastAPI, Query, Request, WebSocket
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session

from utils.ai import generate_quiz_with_ai
from utils.auth import authenticate_and_get_user_details
from database.database import Base, SessionLocal, engine, get_db
from game_manager import game_manager
from database.models import GameSession, PlayerSession, Quiz
from schemas import CreateQuizRequest

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(title="NewTrivia API")

origins = [o.strip() for o in os.getenv("ALLOW_ORIGINS", "http://localhost:5173").split(",")]
app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
async def root():
    return {"message": "NewTrivia API is up and running"}


@app.post("/create-quiz")
async def create_quiz(
    request: Request,
    body: CreateQuizRequest,
    db: Session = Depends(get_db),
):
    auth = authenticate_and_get_user_details(request)
    user_id = auth["user_id"]

    questions_data = generate_quiz_with_ai(body.topic, body.difficulty, body.quantity)

    quiz = Quiz(
        host_user_id=user_id,
        topic=body.topic,
        difficulty=body.difficulty,
        quantity=body.quantity,
    )
    db.add(quiz)
    db.flush()

    room_questions = [
        {
            "question_text": q["question"],
            "options": q["options"],
            "correct_answer_id": q["correct_answer_id"],
            "explanation": q["explanation"],
        }
        for q in questions_data
    ]

    room_code = game_manager.create_room(
        quiz_id=quiz.id,
        host_user_id=user_id,
        questions=room_questions,
        question_time=body.question_time,
        intermission_time=body.intermission_time,
        host_controlled=body.host_controlled,
    )

    session = GameSession(
        quiz_id=quiz.id,
        room_code=room_code,
    )
    db.add(session)
    db.commit()

    session_id = session.id

    # Attach stats-saving callback — fires when the game ends
    async def on_game_end(final_leaderboard):
        db2 = SessionLocal()
        try:
            s = db2.query(GameSession).filter_by(id=session_id).first()
            if s:
                s.ended_at = datetime.utcnow()
                s.is_active = False
                s.final_leaderboard = final_leaderboard
                for entry in final_leaderboard:
                    db2.add(PlayerSession(
                        game_session_id=session_id,
                        player_name=entry["name"],
                        score=entry["score"],
                        rank=entry["rank"],
                        is_winner=entry["rank"] == 1,
                    ))
                db2.commit()
        finally:
            db2.close()

    room = game_manager.get_room(room_code)
    if room:
        room.on_game_end = on_game_end

    return {
        "quiz_id": quiz.id,
        "room_code": room_code,
        "topic": body.topic,
        "quantity": len(questions_data),
    }


@app.get("/my-history")
async def my_history(
    request: Request,
    db: Session = Depends(get_db),
):
    auth = authenticate_and_get_user_details(request)
    user_id = auth["user_id"]

    sessions = (
        db.query(GameSession)
        .join(Quiz)
        .filter(Quiz.host_user_id == user_id)
        .order_by(GameSession.id.desc())
        .limit(20)
        .all()
    )

    history = []
    for s in sessions:
        player_sessions = s.player_sessions or []
        history.append({
            "id": s.id,
            "room_code": s.room_code,
            "topic": s.quiz.topic,
            "difficulty": s.quiz.difficulty,
            "quantity": s.quiz.quantity,
            "started_at": s.started_at,
            "ended_at": s.ended_at,
            "is_active": s.is_active,
            "player_count": len(player_sessions),
            "final_leaderboard": s.final_leaderboard or [],
        })

    return history


@app.websocket("/ws/game/{room_code}")
async def websocket_endpoint(
    websocket: WebSocket,
    room_code: str,
    name: Optional[str] = Query(default=None),
    user_id: Optional[str] = Query(default=None),
):
    await websocket.accept()

    room = game_manager.get_room(room_code)
    if not room:
        await websocket.send_json({"type": "error", "message": "Room not found"})
        await websocket.close()
        return

    is_host = user_id is not None and user_id == room.host_user_id

    if is_host:
        display_name = (name or "").strip()[:20] or "Host"
        connected = await game_manager.connect_host(websocket, room_code, user_id, display_name)
        player_name = display_name
    elif name:
        player_name = name.strip()[:20]
        if not player_name:
            await websocket.send_json({"type": "error", "message": "Invalid name"})
            await websocket.close()
            return
        connected = await game_manager.connect_player(websocket, room_code, player_name)
    else:
        await websocket.send_json({"type": "error", "message": "Provide name or user_id"})
        await websocket.close()
        return

    if not connected:
        return

    try:
        while True:
            data = await websocket.receive_json()
            await game_manager.handle_message(room_code, player_name, data)
    except Exception:
        pass
    finally:
        await game_manager.disconnect(room_code, player_name)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
