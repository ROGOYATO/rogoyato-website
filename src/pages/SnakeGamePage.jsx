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

function getBoardConfig() {
  if (typeof window === 'undefined') {
    return { cols: 32, rows: 18, isMobile: false }
  }

  const isMobile = window.matchMedia('(max-width: 640px)').matches
  if (isMobile) {
    return { cols: 14, rows: 14, isMobile: true }
  }

  return { cols: 32, rows: 18, isMobile: false }
}

function createInitialSnake(boardConfig) {
  const middleX = Math.floor(boardConfig.cols / 2)
  const middleY = Math.floor(boardConfig.rows / 2)
  return [
    { x: middleX + 1, y: middleY },
    { x: middleX, y: middleY },
    { x: middleX - 1, y: middleY },
  ]
}

function toCellKey(cell) {
  return `${cell.x}-${cell.y}`
}

function createFood(snake, boardConfig) {
  const occupied = new Set(snake.map(toCellKey))
  const freeCells = []

  for (let y = 0; y < boardConfig.rows; y += 1) {
    for (let x = 0; x < boardConfig.cols; x += 1) {
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
  const initialBoardConfig = getBoardConfig()

  const [boardConfig, setBoardConfig] = useState(initialBoardConfig)
  const [snake, setSnake] = useState(() => createInitialSnake(initialBoardConfig))
  const [direction, setDirection] = useState('RIGHT')
  const [food, setFood] = useState(() => createFood(createInitialSnake(initialBoardConfig), initialBoardConfig))
  const [score, setScore] = useState(0)
  const [bestScore, setBestScore] = useState(() => readBestScore())
  const [isGameOver, setIsGameOver] = useState(false)

  const directionRef = useRef(direction)
  const touchStartRef = useRef(null)
  const audioContextRef = useRef(null)

  const cellWidthPercent = 100 / boardConfig.cols
  const cellHeightPercent = 100 / boardConfig.rows
  const elementBleedPx = boardConfig.isMobile ? 4 : 8

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

  const playEatSound = useCallback(() => {
    if (typeof window === 'undefined') {
      return
    }

    const AudioContextClass = window.AudioContext || window.webkitAudioContext
    if (!AudioContextClass) {
      return
    }

    try {
      if (!audioContextRef.current) {
        audioContextRef.current = new AudioContextClass()
      }

      const context = audioContextRef.current
      if (!context) {
        return
      }

      if (context.state === 'suspended') {
        context.resume()
      }

      const now = context.currentTime
      const oscillator = context.createOscillator()
      const gain = context.createGain()

      oscillator.type = 'triangle'
      oscillator.frequency.setValueAtTime(540, now)
      oscillator.frequency.exponentialRampToValueAtTime(820, now + 0.07)

      gain.gain.setValueAtTime(0.0001, now)
      gain.gain.exponentialRampToValueAtTime(0.06, now + 0.015)
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.12)

      oscillator.connect(gain)
      gain.connect(context.destination)
      oscillator.start(now)
      oscillator.stop(now + 0.13)
    } catch {
      // No-op: audio feedback is optional.
    }
  }, [])

  const resetGame = useCallback((nextBoardConfig = boardConfig) => {
    const initialSnake = createInitialSnake(nextBoardConfig)
    directionRef.current = 'RIGHT'
    setDirection('RIGHT')
    setSnake(initialSnake)
    setFood(createFood(initialSnake, nextBoardConfig))
    setScore(0)
    setIsGameOver(false)
  }, [boardConfig])

  useEffect(() => {
    const handleResize = () => {
      setBoardConfig(getBoardConfig())
    }

    window.addEventListener('resize', handleResize)
    return () => {
      window.removeEventListener('resize', handleResize)
    }
  }, [])

  useEffect(() => {
    resetGame(boardConfig)
  }, [boardConfig, resetGame])

  useEffect(() => () => {
    const context = audioContextRef.current
    if (context && typeof context.close === 'function') {
      context.close().catch(() => {})
    }
  }, [])

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
          nextHead.x < 0 ||
          nextHead.y < 0 ||
          nextHead.x >= boardConfig.cols ||
          nextHead.y >= boardConfig.rows

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
          playEatSound()

          const nextFood = createFood(nextSnake, boardConfig)
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
  }, [boardConfig, food, isGameOver, playEatSound, updateBestScore])

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
          ...(boardConfig.isMobile
            ? {
                width: '100%',
                maxWidth: '520px',
                aspectRatio: '1 / 1',
              }
            : {
                width: '100%',
                maxWidth: '100%',
                height: 'min(62vh, calc(100vh - 230px))',
                minHeight: '320px',
              }),
        }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
      >
        {food ? (
          <div
            className="absolute flex items-center justify-center text-emerald-400 drop-shadow-[0_0_9px_rgba(16,185,129,0.65)]"
            style={{
              width: `calc(${cellWidthPercent}% + ${elementBleedPx}px)`,
              height: `calc(${cellHeightPercent}% + ${elementBleedPx}px)`,
              left: `calc(${food.x * cellWidthPercent}% - ${elementBleedPx / 2}px)`,
              top: `calc(${food.y * cellHeightPercent}% - ${elementBleedPx / 2}px)`,
            }}
          >
            <Cpu className="h-[88%] w-[88%]" strokeWidth={2.3} />
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
              width: `calc(${cellWidthPercent}% + ${elementBleedPx}px)`,
              height: `calc(${cellHeightPercent}% + ${elementBleedPx}px)`,
              left: `calc(${segment.x * cellWidthPercent}% - ${elementBleedPx / 2}px)`,
              top: `calc(${segment.y * cellHeightPercent}% - ${elementBleedPx / 2}px)`,
            }}
          />
        ))}
      </div>

      {isGameOver ? (
        <button
          type="button"
          onClick={() => resetGame()}
          className="rounded-full border border-slate-300/75 bg-white/85 px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-white/15 dark:bg-zinc-900/80 dark:text-slate-100 dark:hover:bg-zinc-800"
        >
          Restart
        </button>
      ) : null}
    </section>
  )
}
