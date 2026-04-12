import asyncio
import random
import string
import time
from typing import Callable, Dict, List, Optional

from fastapi import WebSocket


class Player:
    def __init__(self, ws: WebSocket, is_host: bool = False):
        self.ws = ws
        self.is_host = is_host
        self.score = 0
        self.answered_current = False


class Room:
    def __init__(
        self,
        room_code: str,
        quiz_id: int,
        host_user_id: str,
        questions: List[Dict],
        question_time: int = 20,
        intermission_time: int = 5,
        host_controlled: bool = False,
    ):
        self.room_code = room_code
        self.quiz_id = quiz_id
        self.host_user_id = host_user_id
        self.questions = questions
        self.question_time = question_time
        self.intermission_time = intermission_time
        self.host_controlled = host_controlled
        self.state = "lobby"
        self.players: Dict[str, Player] = {}
        self.current_q_idx = -1
        self.question_start_time: Optional[float] = None
        self.current_answers: Dict[str, int] = {}
        self.game_task: Optional[asyncio.Task] = None
        self.on_game_end: Optional[Callable] = None
        self.last_activity = time.time()
        # Event for host-controlled advancement
        self.advance_event: asyncio.Event = asyncio.Event()

    def get_leaderboard(self) -> List[Dict]:
        entries = [{"name": name, "score": p.score} for name, p in self.players.items()]
        entries.sort(key=lambda x: x["score"], reverse=True)
        for i, entry in enumerate(entries):
            entry["rank"] = i + 1
        return entries

    def player_list(self) -> List[Dict]:
        return [
            {"name": n, "is_host": p.is_host, "score": p.score}
            for n, p in self.players.items()
        ]

    async def broadcast(self, message: dict) -> None:
        dead = []
        for name, player in list(self.players.items()):
            try:
                await player.ws.send_json(message)
            except Exception:
                dead.append(name)
        for name in dead:
            self.players.pop(name, None)

    async def send_to(self, name: str, message: dict) -> None:
        player = self.players.get(name)
        if player:
            try:
                await player.ws.send_json(message)
            except Exception:
                pass


class GameManager:
    def __init__(self):
        self.rooms: Dict[str, Room] = {}

    def _generate_code(self) -> str:
        chars = string.ascii_uppercase + string.digits
        while True:
            code = "".join(random.choices(chars, k=6))
            if code not in self.rooms:
                return code

    def create_room(
        self,
        quiz_id: int,
        host_user_id: str,
        questions: List[Dict],
        question_time: int = 20,
        intermission_time: int = 5,
        host_controlled: bool = False,
    ) -> str:
        code = self._generate_code()
        self.rooms[code] = Room(
            code, quiz_id, host_user_id, questions,
            question_time, intermission_time, host_controlled,
        )
        return code

    def get_room(self, room_code: str) -> Optional[Room]:
        return self.rooms.get(room_code)

    # -------------------------------------------------------------------------
    # Connection helpers
    # -------------------------------------------------------------------------

    async def connect_host(
        self,
        websocket: WebSocket,
        room_code: str,
        host_user_id: str,
        display_name: str,
    ) -> bool:
        room = self.get_room(room_code)
        if not room:
            await websocket.send_json({"type": "error", "message": "Room not found"})
            await websocket.close()
            return False

        if room.host_user_id != host_user_id:
            await websocket.send_json({"type": "error", "message": "Not the host"})
            await websocket.close()
            return False

        room.players[display_name] = Player(websocket, is_host=True)

        await websocket.send_json({
            "type": "welcome",
            "is_host": True,
            "room_code": room_code,
            "total_questions": len(room.questions),
            "players": room.player_list(),
            "host_controlled": room.host_controlled,
        })
        await room.broadcast({
            "type": "player_joined",
            "players": room.player_list(),
        })
        return True

    async def connect_player(
        self, websocket: WebSocket, room_code: str, name: str
    ) -> bool:
        room = self.get_room(room_code)
        if not room:
            await websocket.send_json({"type": "error", "message": "Room not found"})
            await websocket.close()
            return False

        if room.state != "lobby":
            await websocket.send_json({"type": "error", "message": "Game already in progress"})
            await websocket.close()
            return False

        if name in room.players:
            await websocket.send_json({"type": "error", "message": "Name already taken"})
            await websocket.close()
            return False

        room.players[name] = Player(websocket, is_host=False)

        await websocket.send_json({
            "type": "welcome",
            "is_host": False,
            "room_code": room_code,
            "total_questions": len(room.questions),
            "players": room.player_list(),
            "host_controlled": room.host_controlled,
        })
        await room.broadcast({
            "type": "player_joined",
            "players": room.player_list(),
        })
        return True

    # -------------------------------------------------------------------------
    # Message handling
    # -------------------------------------------------------------------------

    async def handle_message(
        self, room_code: str, sender_name: str, message: dict
    ) -> None:
        room = self.get_room(room_code)
        if not room:
            return

        room.last_activity = time.time()
        msg_type = message.get("type")
        sender = room.players.get(sender_name)
        if not sender:
            return

        if msg_type == "start_game" and room.state == "lobby":
            if len(room.players) >= 1:
                room.game_task = asyncio.create_task(self._run_game(room))

        elif msg_type == "submit_answer" and room.state == "question":
            if sender_name not in room.current_answers:
                answer_id = message.get("answer_id")
                if isinstance(answer_id, int) and 0 <= answer_id <= 3:
                    room.current_answers[sender_name] = answer_id
                    sender.answered_current = True

                    q = room.questions[room.current_q_idx]
                    time_used = time.time() - (room.question_start_time or time.time())
                    time_limit = float(room.question_time)

                    if answer_id == q["correct_answer_id"]:
                        pts = int(1000 * (1 - (min(time_used, time_limit) / time_limit * 0.5)))
                        pts = max(500, min(1000, pts))
                        sender.score += pts
                        correct = True
                    else:
                        pts = 0
                        correct = False

                    await room.send_to(sender_name, {
                        "type": "answer_received",
                        "correct": correct,
                        "points_earned": pts,
                        "correct_answer_id": q["correct_answer_id"],
                    })

        elif msg_type == "advance_game" and sender.is_host:
            # Host manually advances from question OR intermission
            if room.state in ("question", "intermission"):
                room.advance_event.set()

    # -------------------------------------------------------------------------
    # Game loop
    # -------------------------------------------------------------------------

    async def _run_game(self, room: Room) -> None:
        room.state = "starting"
        await room.broadcast({
            "type": "game_starting",
            "total_questions": len(room.questions),
        })
        await asyncio.sleep(3)
        await self._run_autopilot(room)

    async def _run_autopilot(self, room: Room) -> None:
        for i in range(len(room.questions)):
            room.current_q_idx = i
            await self._show_question(room)

            # ── Question phase: wait for all answers, timeout, or host advance ──
            deadline = time.time() + room.question_time
            room.advance_event.clear()
            while time.time() < deadline:
                await asyncio.sleep(0.3)
                if room.state == "finished":
                    return
                if room.players and all(n in room.current_answers for n in room.players):
                    break
                # Host can always skip remaining question time
                if room.advance_event.is_set():
                    room.advance_event.clear()
                    break

            await self._show_intermission(room)

            # ── Intermission phase: host_controlled = wait indefinitely;
            #    otherwise auto-advance but host can still skip early ──
            room.advance_event.clear()
            if room.host_controlled:
                # Wait up to 5 minutes; host must manually advance
                try:
                    await asyncio.wait_for(room.advance_event.wait(), timeout=300)
                except asyncio.TimeoutError:
                    pass
            else:
                # Auto-advance after intermission_time, but host can skip
                try:
                    await asyncio.wait_for(
                        room.advance_event.wait(), timeout=room.intermission_time
                    )
                except asyncio.TimeoutError:
                    pass
            room.advance_event.clear()

        await self._end_game(room)

    async def _show_question(self, room: Room) -> None:
        q = room.questions[room.current_q_idx]
        room.state = "question"
        room.question_start_time = time.time()
        room.current_answers = {}
        for p in room.players.values():
            p.answered_current = False

        await room.broadcast({
            "type": "question",
            "question_num": room.current_q_idx + 1,
            "total": len(room.questions),
            "question": q["question_text"],
            "options": q["options"],
            "time_limit": room.question_time,
        })

    async def _show_intermission(self, room: Room) -> None:
        if room.state not in ("question", "starting"):
            return
        room.state = "intermission"
        q = room.questions[room.current_q_idx]

        await room.broadcast({
            "type": "intermission",
            "correct_answer_id": q["correct_answer_id"],
            "explanation": q["explanation"],
            "leaderboard": room.get_leaderboard()[:5],
            "is_last_question": room.current_q_idx == len(room.questions) - 1,
        })

    async def _end_game(self, room: Room) -> List[Dict]:
        room.state = "finished"
        final = room.get_leaderboard()
        await room.broadcast({"type": "game_over", "leaderboard": final})
        if room.on_game_end:
            try:
                await room.on_game_end(final)
            except Exception as e:
                print(f"on_game_end callback error: {e}")
        return final

    # -------------------------------------------------------------------------
    # Disconnect
    # -------------------------------------------------------------------------

    async def disconnect(self, room_code: str, player_name: str) -> None:
        room = self.get_room(room_code)
        if not room:
            return
        room.players.pop(player_name, None)
        if room.state == "lobby" and room.players:
            await room.broadcast({
                "type": "player_joined",
                "players": room.player_list(),
            })


game_manager = GameManager()
