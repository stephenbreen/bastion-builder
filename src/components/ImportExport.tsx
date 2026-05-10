import { useRef, useState, type ChangeEvent } from 'react'
import { useBastionStore } from '../store/useBastionStore'
import { buildExport } from '../store/reducers/transfer'

function slugify(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^\w-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-') || 'bastion'
}

export function ImportExport() {
  const bastion = useBastionStore((s) => s.bastions[s.activeBastionId])
  const importBastion = useBastionStore((s) => s.importBastion)
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  const [confirmation, setConfirmation] = useState<string | null>(null)

  const handleExport = () => {
    setError(null)
    const data = buildExport(bastion)
    const json = JSON.stringify(data, null, 2)
    const blob = new Blob([json], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `${slugify(bastion.name)}-w${bastion.inGameWeek}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setConfirmation(`Exported ${a.download}`)
    window.setTimeout(() => setConfirmation(null), 2500)
  }

  const handleImportClick = () => {
    setError(null)
    setConfirmation(null)
    inputRef.current?.click()
  }

  const handleFile = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    e.target.value = '' // allow reselecting the same file later
    if (!file) return
    try {
      const text = await file.text()
      const result = importBastion(text)
      if (result.ok) {
        setError(null)
        setConfirmation(`Imported ${file.name} (v${result.sourceVersion})`)
        window.setTimeout(() => setConfirmation(null), 2500)
      } else {
        setError(result.reason)
      }
    } catch (err) {
      setError((err as Error).message ?? 'Failed to read file.')
    }
  }

  return (
    <div className="flex items-center gap-3 flex-wrap">
      <input
        ref={inputRef}
        type="file"
        accept="application/json,.json"
        onChange={handleFile}
        className="hidden"
        aria-label="Import bastion JSON"
      />
      <button
        type="button"
        onClick={handleExport}
        className="rounded border border-bastion-gold/60 px-2.5 py-1 text-bastion-gold-bright hover:text-bastion-parchment hover:bg-bastion-gold/20 transition-colors font-semibold tracking-wide"
      >
        Export ↓
      </button>
      <button
        type="button"
        onClick={handleImportClick}
        className="rounded border border-bastion-gold/60 px-2.5 py-1 text-bastion-gold-bright hover:text-bastion-parchment hover:bg-bastion-gold/20 transition-colors font-semibold tracking-wide"
      >
        Import ↑
      </button>
      {confirmation && (
        <span className="text-bastion-verdant text-base italic">{confirmation}</span>
      )}
      {error && (
        <span className="text-bastion-crimson text-base" role="alert">
          {error}
        </span>
      )}
    </div>
  )
}
