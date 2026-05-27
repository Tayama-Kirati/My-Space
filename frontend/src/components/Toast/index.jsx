import React, { createContext, useContext, useCallback, useReducer } from 'react'

// ── Context ───────────────────────────────────────────────────────────────
const ToastCtx = createContext(null)

// ── Reducer ───────────────────────────────────────────────────────────────
function reducer(state, action) {
  switch (action.type) {
    case 'ADD':    return [...state, action.toast]
    case 'REMOVE': return state.filter(t => t.id !== action.id)
    default:       return state
  }
}

// ── Provider ──────────────────────────────────────────────────────────────
export function ToastProvider({ children }) {
  const [toasts, dispatch] = useReducer(reducer, [])

  const remove = useCallback((id) => dispatch({ type: 'REMOVE', id }), [])

  const add = useCallback((t) => {
    const id = Date.now() + Math.random()
    const toast = { id, duration: 4000, ...t }
    dispatch({ type: 'ADD', toast })
    if (toast.type !== 'confirm' && toast.duration > 0) {
      setTimeout(() => remove(id), toast.duration)
    }
    return id
  }, [remove])

  const toast = {
    success: (message, opts) => add({ type: 'success', message, ...opts }),
    error:   (message, opts) => add({ type: 'error',   message, ...opts }),
    info:    (message, opts) => add({ type: 'info',    message, ...opts }),
    confirm: (opts)          => add({ type: 'confirm', duration: 0, ...opts }),
  }

  return (
    <ToastCtx.Provider value={toast}>
      {children}
      <ToastContainer toasts={toasts} remove={remove} />
    </ToastCtx.Provider>
  )
}

// ── Hook ──────────────────────────────────────────────────────────────────
export function useToast() {
  return useContext(ToastCtx)
}

// ── Variant config ────────────────────────────────────────────────────────
const VARIANTS = {
  success: { icon: '✓', iconBg: '#4e7e40', border: '#a8d5a0', bg: '#f4faf2', color: '#1e4d18' },
  error:   { icon: '✕', iconBg: '#c0392b', border: '#f5a0a0', bg: '#fff5f5', color: '#8a1a1a' },
  info:    { icon: 'i', iconBg: '#2e5aa8', border: '#a0b8f0', bg: '#f0f5ff', color: '#1a3a7a' },
  confirm: { icon: '!', iconBg: '#8a6a40', border: '#d4c5a9', bg: '#fdfcf8', color: '#3a2d20' },
}

// ── Single toast item ─────────────────────────────────────────────────────
function ToastItem({ toast, remove }) {
  const {
    id, type, message,
    confirmLabel = 'Confirm', cancelLabel = 'Cancel',
    onConfirm, onCancel,
  } = toast
  const v = VARIANTS[type] || VARIANTS.info

  const handleConfirm = () => { onConfirm?.(); remove(id) }
  const handleCancel  = () => { onCancel?.();  remove(id) }

  return (
    <div style={{
      display: 'flex', alignItems: 'flex-start', gap: 12,
      padding: '13px 15px',
      background: v.bg,
      border: `1.5px solid ${v.border}`,
      borderRadius: 14,
      boxShadow: '0 6px 24px rgba(0,0,0,0.13)',
      minWidth: 280, maxWidth: 360,
      animation: 'toast-slide-in 0.2s ease',
      fontFamily: 'Lora, serif',
    }}>
      {/* icon badge */}
      <div style={{
        width: 26, height: 26, borderRadius: 7,
        background: v.iconBg, color: '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 12, fontWeight: 900, flexShrink: 0, marginTop: 1,
      }}>
        {v.icon}
      </div>

      {/* body */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ margin: 0, fontSize: '0.875rem', color: v.color, lineHeight: 1.45, fontWeight: 500 }}>
          {message}
        </p>

        {type === 'confirm' && (
          <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
            <button
              onClick={handleConfirm}
              style={{
                padding: '5px 14px', borderRadius: 7, border: 'none',
                background: '#c0392b', color: '#fff',
                fontSize: '0.77rem', fontWeight: 700, cursor: 'pointer',
                fontFamily: 'Lora, serif', transition: 'background 0.12s',
              }}
              onMouseEnter={e => e.currentTarget.style.background = '#a32920'}
              onMouseLeave={e => e.currentTarget.style.background = '#c0392b'}
            >
              {confirmLabel}
            </button>
            <button
              onClick={handleCancel}
              style={{
                padding: '5px 14px', borderRadius: 7,
                border: '1.5px solid #d4c5a9', background: 'transparent',
                color: '#7a6a50', fontSize: '0.77rem', fontWeight: 700,
                cursor: 'pointer', fontFamily: 'Lora, serif',
              }}
            >
              {cancelLabel}
            </button>
          </div>
        )}
      </div>

      {/* dismiss ×  (not shown for confirm — user must choose) */}
      {type !== 'confirm' && (
        <button
          onClick={() => remove(id)}
          style={{
            background: 'none', border: 'none', color: v.color,
            opacity: 0.35, cursor: 'pointer', fontSize: 18,
            lineHeight: 1, padding: '0 2px', flexShrink: 0,
          }}
        >
          ×
        </button>
      )}
    </div>
  )
}

// ── Container (fixed bottom-right) ────────────────────────────────────────
function ToastContainer({ toasts, remove }) {
  return (
    <>
      <style>{`
        @keyframes toast-slide-in {
          from { opacity: 0; transform: translateX(24px) scale(0.97); }
          to   { opacity: 1; transform: translateX(0)   scale(1);    }
        }
      `}</style>
      <div style={{
        position: 'fixed', bottom: 24, right: 24,
        display: 'flex', flexDirection: 'column', gap: 10,
        zIndex: 9999, pointerEvents: toasts.length ? 'auto' : 'none',
      }}>
        {toasts.map(t => <ToastItem key={t.id} toast={t} remove={remove} />)}
      </div>
    </>
  )
}
