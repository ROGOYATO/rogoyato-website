import { Library } from 'lucide-react'
import { useState } from 'react'
import { libraryAlternatives } from './compiler/browserCompiler'

// The libraries the last build used. A Library Manager library can be
// swapped for another one that provides the same header (e.g. a different
// LiquidCrystal_I2C), as a student may have installed that one in the IDE.
export default function LibraryList({ libraries, prefer, onPrefer }) {
  const [choosing, setChoosing] = useState(null) // { header, options }
  if (!libraries?.length) return null

  const choose = async (library) => {
    if (choosing?.header === library.header) {
      setChoosing(null)
      return
    }
    setChoosing({ header: library.header, options: null })
    const options = await libraryAlternatives(library.header)
    setChoosing({ header: library.header, options: Array.isArray(options) ? options : [] })
  }

  return (
    <div className="mt-1 space-y-1 text-slate-600 dark:text-slate-300">
      <p className="flex flex-wrap items-center gap-x-2 gap-y-1">
        <Library size={13} className="shrink-0" />
        Kütüphaneler:
        {libraries.map((library) =>
          library.source === 'manager' ? (
            <button
              key={library.name}
              type="button"
              onClick={() => choose(library)}
              title={`${library.header} için başka bir kütüphane seç`}
              className="rounded border border-slate-300 px-1.5 py-px hover:border-teal-600 hover:text-teal-800 dark:border-white/15 dark:hover:text-teal-200"
            >
              {library.name} {library.version} ▾
            </button>
          ) : (
            <span key={library.name} title="Arduino AVR kartlarıyla gelen kütüphane">
              {library.name}
            </span>
          ),
        )}
      </p>
      {choosing ? (
        <label className="flex flex-wrap items-center gap-2">
          <span>“{choosing.header}” için:</span>
          {choosing.options ? (
            <select
              value={prefer[choosing.header] ?? libraries.find((library) => library.header === choosing.header)?.name ?? ''}
              onChange={(event) => {
                onPrefer(choosing.header, event.target.value)
                setChoosing(null)
              }}
              className="rounded border border-slate-300 bg-white px-1.5 py-0.5 dark:border-white/15 dark:bg-[#0b1517]"
            >
              {choosing.options.map((option) => (
                <option key={option.name} value={option.name}>
                  {option.name} {option.version}
                </option>
              ))}
            </select>
          ) : (
            <span>yükleniyor…</span>
          )}
        </label>
      ) : null}
    </div>
  )
}
