import { Cpu } from 'lucide-react'
import { useCallback, useEffect, useRef, useState } from 'react'
import snakeSegmentImage from '../assets/favicon.png'

const DIRECTION_VECTORS = {
  UP: { x: 0, y: -1 },
  DOWN: { x: 0, y: 1 },
  LEFT: { x: -1, y: 0 },
  RIGHT: { x: 1, y: 0 },
}

const OPPOSITE_DIRECTION = {
  UP: 'DOWN',
  DOWN: 'UP',
  LEFT: 'RIGHT',
  RIGHT: 'LEFT',
}

const KEY_TO_DIRECTION = {
  ArrowUp: 'UP',
  ArrowDown: 'DOWN',
  ArrowLeft: 'LEFT',
  ArrowRight: 'RIGHT',
  w: 'UP',
  s: 'DOWN',
  a: 'LEFT',
  d: 'RIGHT',
}

const SCORE_STORAGE_KEY = 'snake-best-score'
const TICK_MS = 130
const SWIPE_THRESHOLD = 24

function getBoardSize() {
  if (typeof window === 'undefined') {
    return 20
  }

  return window.matchMedia('(max-width: 640px)').matches ? 14 : 20
}

function createInitialSnake(boardSize) {
  const middle = Math.floor(boardSize / 2)
  return [
    { x: middle + 1, y: middle },
    { x: middle, y: middle },
    { x: middle - 1, y: middle },
  ]
}

function toCellKey(cell) {
  return `${cell.x}-${cell.y}`
}

function createFood(snake, boardSize) {
  const occupied = new Set(snake.map(toCellKey))
  const freeCells = []

  for (let y = 0; y < boardSize; y += 1) {
    for (let x = 0; x < boardSize; x += 1) {
      const key = `${x}-${y}`
      if (!occupied.has(key)) {
        freeCells.push({ x, y })
      }
    }
  }

  if (!freeCells.length) {
    return null
  }

  const randomIndex = Math.floor(Math.random() * freeCells.length)
  return freeCells[randomIndex]
}

function readBestScore() {
  if (typeof window === 'undefined') {
    return 0
  }

  const stored = window.localStorage.getItem(SCORE_STORAGE_KEY)
  const parsed = Number.parseInt(stored ?? '0', 10)
  return Number.isFinite(parsed) && parsed > 0 ? parsed : 0
}

export default function SnakeGamePage() {
  const [boardSize, setBoardSize] = useState(() => getBoardSize())
  const [snake, setSnake] = useState(() => createInitialSnake(getBoardSize()))
  const [direction, setDirection] = useState('RIGHT')
  const [food, setFood] = useState(() => createFood(createInitialSnake(getBoardSize()), getBoardSize()))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => readBestScore())
  const [isGameOver, setIsGameOver] = useState(false)

  const directionRef = useRef(direction)
  const touchStartRef = useRef(null)

  const cellPercent = 100 / boardSize
  const elementBleedPx = boardSize <= 14 ? 4 : 6

  const updateBestScore = useCallback((nextScore) => {
    setBestScore((currentBest) => {
      if (nextScore <= currentBest) {
        return currentBest
      }

      if (typeof window !== 'undefined') {
        window.localStorage.setItem(SCORE_STORAGE_KEY, String(nextScore))
      }
      return nextScore
    })
  }, [])

  const requestDirection = useCallback((nextDirection) => {
    if (isGameOver || !nextDirection) {
      return
    }

    if (OPPOSITE_DIRECTION[directionRef.current] === nextDirection) {
      return
    }

    directionRef.current = nextDirection
    setDirection(nextDirection)
  }, [isGameOver])

  const resetGame = useCallback((nextBoardSize = boardSize) => {
    const initialSnake = createInitialSnake(nextBoardSize)
    directionRef.current = 'RIGHT'
    setDirection('RIGHT')
    setSnake(initialSnake)
    setFood(createFood(initialSnake, nextBoardSize))
    setScore(0)
    setIsGameOver(false)
  }, [boardSize])

  useEffect(() => {
    const handleResize = () => {
      setBoardSize(getBoardSize())
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    resetGame(boardSize)
  }, [boardSize, resetGame])

  useEffect(() => {
    const handleKeyDown = (event) => {
      const nextDirection = KEY_TO_DIRECTION[event.key]
      if (!nextDirection) {
        return
      }

      event.preventDefault()
      requestDirection(nextDirection)
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
    }
  }, [requestDirection])

  useEffect(() => {
    if (isGameOver) {
      return undefined
    }

    const intervalId = window.setInterval(() => {
      setSnake((currentSnake) => {
        const vector = DIRECTION_VECTORS[directionRef.current]
        const head = currentSnake[0]
        const nextHead = {
          x: head.x + vector.x,
          y: head.y + vector.y,
        }

        const wallCollision =
          nextHead.x < 0 || nextHead.y < 0 || nextHead.x >= boardSize || nextHead.y >= boardSize

        const bodyCollision = currentSnake.some((segment) => segment.x === nextHead.x && segment.y === nextHead.y)

        if (wallCollision || bodyCollision) {
          setIsGameOver(true)
          return currentSnake
        }

        const eatsFood = food && nextHead.x === food.x && nextHead.y === food.y
        const nextSnake = eatsFood
          ? [nextHead, ...currentSnake]
          : [nextHead, ...currentSnake.slice(0, currentSnake.length - 1)]

        if (eatsFood) {
          setScore((currentScore) => {
            const nextScore = currentScore + 1
            updateBestScore(nextScore)
            return nextScore
          })

          const nextFood = createFood(nextSnake, boardSize)
          if (!nextFood) {
            setIsGameOver(true)
          }
          setFood(nextFood)
        }

        return nextSnake
      })
    }, TICK_MS)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [boardSize, food, isGameOver, updateBestScore])

  const handleTouchStart = (event) => {
    const touch = event.changedTouches[0]
    if (!touch) {
      return
    }

    touchStartRef.current = { x: touch.clientX, y: touch.clientY }
  }

  const handleTouchEnd = (event) => {
    const start = touchStartRef.current
    if (!start) {
      return
    }

    const touch = event.changedTouches[0]
    if (!touch) {
      touchStartRef.current = null
      return
    }

    const deltaX = touch.clientX - start.x
    const deltaY = touch.clientY - start.y
    const absX = Math.abs(deltaX)
    const absY = Math.abs(deltaY)

    if (Math.max(absX, absY) < SWIPE_THRESHOLD) {
      touchStartRef.current = null
      return
    }

    if (absX > absY) {
      requestDirection(deltaX > 0 ? 'RIGHT' : 'LEFT')
    } else {
      requestDirection(deltaY > 0 ? 'DOWN' : 'UP')
    }

    touchStartRef.current = null
  }

  return (
    <section className="flex min-h-[calc(100vh-9rem)] w-full flex-col items-center justify-center gap-4">
      <div className="text-sm font-semibold tracking-wide text-slate-700 dark:text-slate-200">
        Skor: {score} | Best: {bestScore} {isGameOver ? '| Oyun Bitti' : ''}
      </div>

      <div
        className="relative w-full touch-none select-none rounded-2xl border border-slate-300/25 dark:border-white/12"
        style={{
          aspectRatio: '1 / 1',
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onClick={() => {
          if (isGameOver) {
            resetGame()
          }
        }}
      >
        {food ? (
          <div
            className="absolute flex items-center justify-center text-emerald-400 drop-shadow-[0_0_9px_rgba(16,185,129,0.65)]"
            style={{
              width: `calc(${cellPercent}% + ${elementBleedPx}px)`,
              height: `calc(${cellPercent}% + ${elementBleedPx}px)`,
              left: `calc(${food.x * cellPercent}% - ${elementBleedPx / 2}px)`,
              top: `calc(${food.y * cellPercent}% - ${elementBleedPx / 2}px)`,
            }}
          >
            <Cpu size={boardSize <= 14 ? 17 : 23} />
          </div>
        ) : null}

        {snake.map((segment, index) => (
          <img
            key={`${segment.x}-${segment.y}-${index}`}
            src={snakeSegmentImage}
            alt=""
            draggable="false"
            className={`pointer-events-none absolute select-none object-contain ${
              index === 0 ? 'drop-shadow-[0_0_10px_rgba(6,182,212,0.65)]' : 'opacity-95'
            }`}
            style={{
              width: `calc(${cellPercent}% + ${elementBleedPx}px)`,
              height: `calc(${cellPercent}% + ${elementBleedPx}px)`,
              left: `calc(${segment.x * cellPercent}% - ${elementBleedPx / 2}px)`,
              top: `calc(${segment.y * cellPercent}% - ${elementBleedPx / 2}px)`,
            }}
          />
        ))}
      </div>
    </section>
  )
}
