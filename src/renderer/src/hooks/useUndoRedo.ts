/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { useState, useCallback, useRef } from 'react'

interface UseUndoRedoOptions {
  debounceMs?: number
  maxHistory?: number
}

interface SetOptions {
  /**
   * Forzar un commit inmediato del valor pendiente actual al stack de
   * historial antes de registrar el nuevo valor como pendiente.
   *
   * Útil para operaciones estructurales (Enter, Tab, pegado, etc.) que
   * deben ser su propio punto de undo, en lugar de agruparse con la
   * edición inmediatamente anterior.
   */
  commit?: boolean
}

interface UseUndoRedoResult<T> {
  value: T
  set: (value: T, options?: SetOptions) => void
  reset: (value: T) => void
  undo: () => boolean
  redo: () => boolean
  flush: () => void
  canUndo: boolean
  canRedo: boolean
}

export function useUndoRedo<T>(initial: T, options?: UseUndoRedoOptions): UseUndoRedoResult<T> {
  const debounceMs = options?.debounceMs ?? 400
  const maxHistory = options?.maxHistory ?? 100

  const stackRef = useRef<{ past: T[]; future: T[] }>({ past: [], future: [] })
  const presentRef = useRef<T>(initial)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const pendingRef = useRef<T | null>(null)

  const [present, setPresentState] = useState<T>(initial)
  const [flags, setFlags] = useState<{ canUndo: boolean; canRedo: boolean }>({
    canUndo: false,
    canRedo: false
  })

  const updateFlags = useCallback(() => {
    const stack = stackRef.current
    const nextCanUndo = stack.past.length > 0 || pendingRef.current !== null
    const nextCanRedo = stack.future.length > 0
    setFlags((prev) =>
      prev.canUndo === nextCanUndo && prev.canRedo === nextCanRedo
        ? prev
        : { canUndo: nextCanUndo, canRedo: nextCanRedo }
    )
  }, [])

  const clearTimer = (): void => {
    if (timerRef.current) {
      clearTimeout(timerRef.current)
      timerRef.current = null
    }
  }

  const flush = useCallback((): void => {
    clearTimer()
    if (pendingRef.current === null) return
    const value = pendingRef.current
    pendingRef.current = null
    const stack = stackRef.current
    if (value !== presentRef.current) {
      stack.past.push(presentRef.current)
      if (stack.past.length > maxHistory) stack.past.shift()
      presentRef.current = value
      stack.future = []
      setPresentState(value)
      updateFlags()
    }
  }, [maxHistory, updateFlags])

  const set = useCallback(
    (value: T, options?: SetOptions): void => {
      if (options?.commit) {
        // Forzar un commit inmediato del valor pendiente actual antes
        // de registrar el nuevo como pendiente. Esto crea un punto de
        // undo claro para operaciones estructurales (Enter, Tab, etc.).
        clearTimer()
        if (pendingRef.current !== null) {
          const pending = pendingRef.current
          pendingRef.current = null
          const stack = stackRef.current
          if (pending !== presentRef.current) {
            stack.past.push(presentRef.current)
            if (stack.past.length > maxHistory) stack.past.shift()
            presentRef.current = pending
            stack.future = []
            setPresentState(pending)
          }
        }
      }

      // NOTA: No actualizamos presentRef.current aquí.
      // presentRef debe mantener el último valor *confirmado* (snapshot)
      // hasta que flush() lo comprometa y empuje el anterior al stack `past`.
      // Si lo actualizáramos aquí, flush() vería value === presentRef.current
      // y nunca registraría historial para undo.
      setPresentState(value)
      pendingRef.current = value
      clearTimer()
      timerRef.current = setTimeout(flush, debounceMs)
      updateFlags()
    },
    [debounceMs, flush, updateFlags, maxHistory]
  )

  const reset = useCallback(
    (value: T): void => {
      clearTimer()
      pendingRef.current = null
      stackRef.current = { past: [], future: [] }
      presentRef.current = value
      setPresentState(value)
      updateFlags()
    },
    [updateFlags]
  )

  const undo = useCallback((): boolean => {
    flush()
    const stack = stackRef.current
    if (stack.past.length === 0) return false
    stack.future.unshift(presentRef.current)
    const prev = stack.past.pop() as T
    presentRef.current = prev
    setPresentState(prev)
    pendingRef.current = null
    updateFlags()
    return true
  }, [flush, updateFlags])

  const redo = useCallback((): boolean => {
    flush()
    const stack = stackRef.current
    if (stack.future.length === 0) return false
    stack.past.push(presentRef.current)
    const next = stack.future.shift() as T
    presentRef.current = next
    setPresentState(next)
    pendingRef.current = null
    updateFlags()
    return true
  }, [flush, updateFlags])

  return {
    value: present,
    set,
    reset,
    undo,
    redo,
    flush,
    canUndo: flags.canUndo,
    canRedo: flags.canRedo
  }
}
