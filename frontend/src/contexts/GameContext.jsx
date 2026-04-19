import {
  createContext,
  useContext,
  useReducer,
  useRef,
  useCallback,
} from "react";

const GameContext = createContext(null);

const initialState = {
  connected: false,
  roomCode: null,
  isHost: false,
  hostControlled: false,
  phase: "connecting",
  players: [],
  totalQuestions: 0,
  questionNum: 0,
  questionText: "",
  options: [],
  timeLimit: 20,
  hasAnswered: false,
  lastCorrect: null,
  lastPoints: 0,
  correctAnswerIdOnAnswer: null,
  correctAnswerId: null,
  explanation: null,
  leaderboard: [],
  previousLeaderboard: [],
  isLastQuestion: false,
  intermissionTime: 5,
  intermissionStartTime: null,
  answeredCount: 0,
  totalPlayers: 0,
  finalLeaderboard: [],
  error: null,
  personalStats: {
    correct: 0,
    total: 0,
    responses: [],
  },
};

function reducer(state, action) {
  switch (action.type) {
    case "WELCOME":
      return {
        ...state,
        connected: true,
        phase: "lobby",
        roomCode: action.payload.room_code,
        isHost: action.payload.is_host,
        hostControlled: action.payload.host_controlled ?? false,
        players: action.payload.players,
        totalQuestions: action.payload.total_questions,
      };
    case "PLAYER_JOINED":
      return { ...state, players: action.payload.players };
    case "GAME_STARTING":
      return { ...state, phase: "starting" };
    case "QUESTION":
      return {
        ...state,
        phase: "question",
        questionNum: action.payload.question_num,
        questionText: action.payload.question,
        options: action.payload.options,
        timeLimit: action.payload.time_limit,
        hasAnswered: false,
        lastCorrect: null,
        lastPoints: 0,
        correctAnswerIdOnAnswer: null,
        correctAnswerId: null,
        explanation: null,
        answeredCount: 0,
        // Snapshot current leaderboard as previousLeaderboard for rank reveal
        previousLeaderboard: state.leaderboard,
      };
    case "ANSWER_RECEIVED": {
      const response = {
        correct: action.payload.correct,
        timeMs: action.payload.timeMs,
        points: action.payload.points_earned,
      };
      const prev = state.personalStats;
      return {
        ...state,
        hasAnswered: true,
        lastCorrect: action.payload.correct,
        lastPoints: action.payload.points_earned,
        correctAnswerIdOnAnswer: action.payload.correct_answer_id ?? null,
        personalStats: {
          correct: prev.correct + (action.payload.correct ? 1 : 0),
          total: prev.total + 1,
          responses: [...prev.responses, response],
        },
      };
    }
    case "INTERMISSION":
      return {
        ...state,
        phase: "intermission",
        correctAnswerId: action.payload.correct_answer_id,
        explanation: action.payload.explanation,
        leaderboard: action.payload.leaderboard,
        isLastQuestion: action.payload.is_last_question,
        intermissionTime: action.payload.intermission_time ?? state.intermissionTime,
        intermissionStartTime: Date.now(),
      };
    case "ANSWER_PROGRESS":
      return {
        ...state,
        answeredCount: action.payload.answered,
        totalPlayers: action.payload.total,
      };
    case "GAME_OVER":
      return {
        ...state,
        phase: "finished",
        finalLeaderboard: action.payload.leaderboard,
      };
    case "ERROR":
      return { ...state, phase: "error", error: action.payload.message };
    default:
      return state;
  }
}

export function GameProvider({ children }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const wsRef = useRef(null);
  const questionStartTimeRef = useRef(null);

  const connect = useCallback((roomCode, name, userId) => {
    const params = new URLSearchParams();
    if (userId) {
      params.set("user_id", userId);
      if (name) params.set("name", name);
    } else if (name) {
      params.set("name", name);
    }

    const WS_BASE =
      import.meta.env.MODE === "development" ? "" : import.meta.env.VITE_WS_URL;

    const wsUrl = `${
      WS_BASE ||
      (window.location.protocol === "https:" ? "wss://" : "ws://") +
        window.location.host
    }/ws/game/${roomCode}?${params.toString()}`;
    const ws = new WebSocket(wsUrl);
    wsRef.current = ws;

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);
      switch (msg.type) {
        case "welcome":
          dispatch({ type: "WELCOME", payload: msg });
          break;
        case "player_joined":
          dispatch({ type: "PLAYER_JOINED", payload: msg });
          break;
        case "game_starting":
          dispatch({ type: "GAME_STARTING", payload: msg });
          break;
        case "question":
          questionStartTimeRef.current = Date.now();
          dispatch({ type: "QUESTION", payload: msg });
          break;
        case "answer_received": {
          const timeMs = questionStartTimeRef.current
            ? Date.now() - questionStartTimeRef.current
            : null;
          dispatch({ type: "ANSWER_RECEIVED", payload: { ...msg, timeMs } });
          break;
        }
        case "intermission":
          dispatch({ type: "INTERMISSION", payload: msg });
          break;
        case "answer_progress":
          dispatch({ type: "ANSWER_PROGRESS", payload: msg });
          break;
        case "game_over":
          dispatch({ type: "GAME_OVER", payload: msg });
          break;
        case "error":
          dispatch({ type: "ERROR", payload: msg });
          break;
        default:
          break;
      }
    };

    ws.onerror = () => {
      dispatch({
        type: "ERROR",
        payload: { message: "Connection failed. Is the backend running?" },
      });
    };
  }, []);

  const send = useCallback((message) => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(message));
    }
  }, []);

  const disconnect = useCallback(() => {
    if (wsRef.current) {
      wsRef.current.close();
      wsRef.current = null;
    }
  }, []);

  return (
    <GameContext.Provider value={{ state, connect, send, disconnect }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const ctx = useContext(GameContext);
  if (!ctx) throw new Error("useGame must be used within GameProvider");
  return ctx;
}
