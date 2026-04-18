import { motion } from 'framer-motion'
import { ArrowLeft, Cpu } from 'lucide-react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import snakeSegmentImage from '../assets/favicon.png'
import PageTitleHero from '../components/PageTitleHero'

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

  const boardPixels = boardSize <= 14 ? 308 : 440

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
          const nextScore = score + 1
          setScore(nextScore)
          updateBestScore(nextScore)

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
  }, [boardSize, food, isGameOver, score, updateBestScore])

  const snakeCellSet = useMemo(() => new Set(snake.map(toCellKey)), [snake])
  const headKey = snake.length ? toCellKey(snake[0]) : ''
  const foodKey = food ? toCellKey(food) : ''

  const cells = useMemo(() => {
    const allCells = []
    for (let y = 0; y < boardSize; y += 1) {
      for (let x = 0; x < boardSize; x += 1) {
        allCells.push({ x, y, key: `${x}-${y}` })
      }
    }
    return allCells
  }, [boardSize])

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
    <motion.section
      initial={{ opacity: 0, y: 18 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: 'easeOut' }}
      className="space-y-6"
    >
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-cyan-700 hover:text-cyan-800 dark:text-cyan-200 dark:hover:text-cyan-100"
      >
        <ArrowLeft size={16} />
        Ana sayfaya dön
      </Link>

      <PageTitleHero title="Snake Easter Egg" />

      <section className="rounded-3xl border border-slate-200/90 bg-white/90 p-6 dark:border-white/10 dark:bg-zinc-900/75 sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-slate-600 dark:text-slate-300">
            Yonu degistirmek icin ok tuslari, WASD veya swipe kullan. Islemciyi yedikce yilan +1 favicon buyur.
          </p>
          <button
            type="button"
            onClick={() => resetGame()}
            className="rounded-full border border-slate-300/80 bg-white px-4 py-2 text-sm font-medium text-slate-800 transition hover:bg-slate-100 dark:border-white/15 dark:bg-zinc-900 dark:text-white dark:hover:bg-zinc-800"
          >
            Yeniden baslat
          </button>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-3 text-sm">
          <span className="rounded-full border border-cyan-300 bg-cyan-100 px-3 py-1 text-cyan-900 dark:border-cyan-300/30 dark:bg-cyan-300/15 dark:text-cyan-100">
            Skor: {score}
          </span>
          <span className="rounded-full border border-amber-300 bg-amber-100 px-3 py-1 text-amber-900 dark:border-amber-300/30 dark:bg-amber-300/15 dark:text-amber-100">
            Best: {bestScore}
          </span>
          {isGameOver ? (
            <span className="rounded-full border border-rose-300 bg-rose-100 px-3 py-1 text-rose-900 dark:border-rose-300/30 dark:bg-rose-300/15 dark:text-rose-100">
              Oyun bitti
            </span>
          ) : null}
        </div>

        <div className="mt-5 flex justify-center">
          <div
            className="touch-none overflow-hidden rounded-2xl border border-slate-300/80 bg-slate-200/70 p-1 dark:border-white/15 dark:bg-zinc-950/70"
            style={{ width: `min(92vw, ${boardPixels}px)` }}
            onTouchStart={handleTouchStart}
            onTouchEnd={handleTouchEnd}
          >
            <div
              className="grid gap-[2px]"
              style={{
                gridTemplateColumns: `repeat(${boardSize}, minmax(0, 1fr))`,
                gridTemplateRows: `repeat(${boardSize}, minmax(0, 1fr))`,
                aspectRatio: '1 / 1',
              }}
            >
              {cells.map((cell) => {
                const isSnake = snakeCellSet.has(cell.key)
                const isHead = cell.key === headKey
                const isFood = cell.key === foodKey

                return (
                  <div
                    key={cell.key}
                    className={`relative overflow-hidden rounded-[6px] ${
                      isSnake
                        ? 'border border-cyan-300/60 bg-slate-900/95 dark:border-cyan-200/40'
                        : 'border border-slate-300/80 bg-slate-100 dark:border-zinc-800 dark:bg-zinc-900'
                    }`}
                  >
                    {isSnake ? (
                      <div
                        className={`h-full w-full bg-center bg-no-repeat ${isHead ? 'scale-100' : 'scale-[0.92]'}`}
                        style={{
                          backgroundImage: `url(${snakeSegmentImage})`,
                          backgroundSize: '88% 88%',
                        }}
                      />
                    ) : null}

                    {isFood ? (
                      <div className="absolute inset-0 flex items-center justify-center bg-emerald-200/35 dark:bg-emerald-500/10">
                        <Cpu size={14} className="text-emerald-700 dark:text-emerald-300" />
                      </div>
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      </section>
    </motion.section>
  )
}
