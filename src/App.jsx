import { useState, useEffect, useCallback } from 'react'
import { giftsList } from './data/gifts'
import { sendGiftNotification } from './services/emailService'
import './App.css'

const WEDDING_DATE   = new Date('2026-05-23T20:00:00-03:00')
const DELIVERY_ADDR  = 'Rua Real da Torre, 1130, Torre Arbo, Apto 1502, Torre, Recife — CEP: 50710-025'

// ── Countdown ──────────────────────────────────────────────
function useCountdown(targetDate) {
  const calc = useCallback(() => {
    const diff = targetDate - new Date()
    if (diff <= 0) return { days: 0, hours: 0, minutes: 0, seconds: 0 }
    return {
      days:    Math.floor(diff / (1000 * 60 * 60 * 24)),
      hours:   Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
      minutes: Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60)),
      seconds: Math.floor((diff % (1000 * 60)) / 1000),
    }
  }, [targetDate])

  const [time, setTime] = useState(calc)
  useEffect(() => {
    const timer = setInterval(() => setTime(calc()), 1000)
    return () => clearInterval(timer)
  }, [calc])
  return time
}

function pad(n) { return String(n).padStart(2, '0') }

// ── Copiar PIX ─────────────────────────────────────────────
function CopyPixButton({ pix }) {
  const [copied, setCopied] = useState(false)
  const handleCopy = () => {
    navigator.clipboard.writeText(pix)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }
  return (
    <button className="pix-copy-btn" onClick={handleCopy} type="button">
      {copied ? 'Copiado! ✓' : 'Copiar chave'}
    </button>
  )
}

// ── Modal (produtos e contribuições PIX) ───────────────────
function GiftModal({ gift, onClose, onConfirm }) {
  const isPixGift    = gift.isCashGift
  const hasVariants  = gift.variants && gift.variants.length > 0
  const multiVariant = hasVariants && gift.variants.length > 1

  const [selectedVariant, setSelectedVariant] = useState(
    hasVariants && !multiVariant ? gift.variants[0] : null
  )
  const [name, setName]       = useState('')
  const [message, setMessage] = useState('')
  const [sending, setSending] = useState(false)

  const currentLink = selectedVariant?.link || gift.link
  const canConfirm  = name.trim().length > 0 && (!multiVariant || selectedVariant !== null)

  useEffect(() => {
    const handler = (e) => { if (e.key === 'Escape') onClose() }
    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [onClose])

  useEffect(() => {
    document.body.style.overflow = 'hidden'
    return () => { document.body.style.overflow = '' }
  }, [])

  const handleConfirm = async () => {
    if (!canConfirm || sending) return
    setSending(true)
    try {
      await sendGiftNotification({
        guestName:    name.trim(),
        guestMessage: message.trim(),
        giftTitle:    gift.title,
        variantTitle: selectedVariant?.title || null,
        value:        gift.valueLabel || null,
      })
    } catch (err) {
      console.error('[EmailJS] Erro ao enviar notificação:', err)
    }
    onConfirm(gift, name.trim(), message.trim(), selectedVariant)
    setSending(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={e => e.stopPropagation()}>
        <button className="modal-close" onClick={onClose} aria-label="Fechar">×</button>

        {/* Cabeçalho */}
        <div className="modal-header">
          <p className="modal-pre">{isPixGift ? 'Contribuição especial' : 'Presentear com'}</p>
          <h2 className="modal-title">{gift.title}</h2>
          {isPixGift && (
            <p className="pix-value-badge">{gift.valueLabel}</p>
          )}
        </div>

        {/* ── PIX: mensagem engraçada + chave ── */}
        {isPixGift && (
          <div className="modal-section">
            <div className="pix-funny-box">
              <p className="pix-funny-text">{gift.funnyMessage}</p>
            </div>
            <div className="pix-info-box">
              <div className="pix-info-row">
                <span className="pix-info-label">Chave PIX</span>
                <strong className="pix-info-value">{gift.pix}</strong>
              </div>
              <CopyPixButton pix={gift.pix} />
            </div>
          </div>
        )}

        {/* ── Produto: variantes ── */}
        {!isPixGift && multiVariant && (
          <div className="modal-section">
            <p className="modal-section-label">Escolha uma opção e clique em "Ver produto" para pesquisar preços:</p>
            <div className="variants-list">
              {gift.variants.map(v => (
                <div
                  key={v.id}
                  className={`variant-card ${selectedVariant?.id === v.id ? 'selected' : ''}`}
                  onClick={() => setSelectedVariant(v)}
                >
                  <div className="variant-left">
                    {v.image
                      ? <img src={v.image} alt={v.title} className="variant-img" />
                      : <span className="variant-icon">🎁</span>
                    }
                    <span className="variant-title">{v.title}</span>
                  </div>
                  <div className="variant-right">
                    {selectedVariant?.id === v.id && <span className="variant-check">✓</span>}
                    <a
                      href={v.link}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="variant-link-btn"
                      onClick={e => e.stopPropagation()}
                    >
                      Ver produto →
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Produto: link direto ── */}
        {!isPixGift && !multiVariant && currentLink && (
          <div className="modal-section">
            <button
              type="button"
              className="view-product-btn"
              onClick={() => window.open(currentLink, '_blank', 'noopener,noreferrer')}
            >
              Ver produto →
            </button>
            <p className="view-product-hint">Analise preços antes de confirmar a compra.</p>
          </div>
        )}

        {/* ── Produto: endereço de entrega ── */}
        {!isPixGift && (
          <div className="address-box">
            <span className="address-icon">📦</span>
            <div>
              <p className="address-title">Prefere enviar para nossa casa?</p>
              <p className="address-text">
                Envie no nome do Noivo ou da Noiva!<br />
                {DELIVERY_ADDR}
              </p>
            </div>
          </div>
        )}

        {/* ── Campos nome e mensagem ── */}
        <div className="modal-section">
          <div className="field">
            <label className="field-label" htmlFor="guest-name">
              Seu nome <span className="required">*</span>
            </label>
            <input
              id="guest-name"
              type="text"
              className="field-input"
              placeholder="Como você se chama?"
              value={name}
              onChange={e => setName(e.target.value)}
              autoFocus
            />
          </div>
          <div className="field">
            <label className="field-label" htmlFor="guest-message">
              Mensagem para os noivos
            </label>
            <textarea
              id="guest-message"
              className="field-input field-textarea"
              placeholder="Deixe uma mensagem carinhosa (opcional)"
              value={message}
              onChange={e => setMessage(e.target.value)}
              rows={3}
            />
          </div>
        </div>

        <button
          className="modal-confirm-btn"
          onClick={handleConfirm}
          disabled={!canConfirm || sending}
          type="button"
        >
          {sending
            ? 'Confirmando...'
            : isPixGift
              ? 'Confirmar contribuição ✓'
              : 'Confirmar reserva ✓'}
        </button>
        <p className="modal-hint">
          {isPixGift
            ? 'Após confirmar, enviaremos muito amor e gratidão pelo PIX recebido!'
            : 'Ao confirmar, o presente fica marcado como reservado para não ser comprado duas vezes.'}
        </p>
      </div>
    </div>
  )
}

// ── Gift Card ──────────────────────────────────────────────
function GiftCard({ gift, reservationCount, onSelect }) {
  const isPixGift     = gift.isCashGift
  const multiVariant  = gift.variants && gift.variants.length > 1
  const maxRes        = gift.maxReservations || 1
  const fullyReserved = !isPixGift && reservationCount >= maxRes
  const remaining     = maxRes - reservationCount

  return (
    <div className={`gift-card ${isPixGift ? 'pix-gift' : ''} ${fullyReserved ? 'reserved' : ''}`}>
      {fullyReserved && <div className="status-badge badge-reserved">Reservado ✓</div>}
      {!fullyReserved && !isPixGift && maxRes > 1 && reservationCount > 0 && (
        <div className="status-badge badge-partial">
          {remaining === 1 ? 'Última unidade' : `${remaining} disponíveis`}
        </div>
      )}
      {isPixGift && (
        <div className="status-badge badge-pix-value">{gift.valueLabel}</div>
      )}

      <h3 className="gift-title">{gift.title}</h3>

      <div className="gift-footer">
        <button
          className="gift-btn"
          onClick={() => !fullyReserved && onSelect(gift)}
          disabled={fullyReserved}
          type="button"
        >
          {fullyReserved
            ? 'Reservado'
            : isPixGift
              ? 'Contribuir via PIX'
              : multiVariant ? 'Ver opções' : 'Ver presente'}
        </button>
      </div>
    </div>
  )
}

// ── App ────────────────────────────────────────────────────
function App() {
  const countdown = useCountdown(WEDDING_DATE)

  const [selectedGift, setSelectedGift] = useState(null)

  const [reservationCounts, setReservationCounts] = useState(() => {
    try {
      const log = JSON.parse(localStorage.getItem('gift_log') || '[]')
      return log.reduce((acc, r) => {
        acc[r.giftId] = (acc[r.giftId] || 0) + 1
        return acc
      }, {})
    } catch { return {} }
  })

  const handleConfirm = useCallback((gift, name, message, selectedVariant) => {
    const log = JSON.parse(localStorage.getItem('gift_log') || '[]')
    log.push({
      giftId:       gift.id,
      giftTitle:    gift.title,
      variantTitle: selectedVariant?.title || null,
      value:        gift.valueLabel || null,
      name,
      message,
      timestamp:    new Date().toISOString(),
    })
    localStorage.setItem('gift_log', JSON.stringify(log))

    // PIX gifts: conta mas nunca bloqueia. Produtos: bloqueia ao atingir maxReservations.
    setReservationCounts(prev => ({
      ...prev,
      [gift.id]: (prev[gift.id] || 0) + 1,
    }))
    setSelectedGift(null)
  }, [])

  const regularGifts = giftsList.filter(g => !g.isCashGift)
  const pixGifts     = giftsList.filter(g => g.isCashGift)

  return (
    <div className="page">
      {/* ── Header ── */}
      <header className="hero-header">
        <p className="pre-title">Lista de Presentes</p>
        <h1 className="couple-names">Lumena <span className="amp">&</span> Victor</h1>
        <p className="wedding-date">23 de maio de 2026</p>

        <div className="countdown">
          <div className="countdown-block">
            <span className="countdown-num">{pad(countdown.days)}</span>
            <span className="countdown-label">dias</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-block">
            <span className="countdown-num">{pad(countdown.hours)}</span>
            <span className="countdown-label">horas</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-block">
            <span className="countdown-num">{pad(countdown.minutes)}</span>
            <span className="countdown-label">min</span>
          </div>
          <span className="countdown-sep">:</span>
          <div className="countdown-block">
            <span className="countdown-num">{pad(countdown.seconds)}</span>
            <span className="countdown-label">seg</span>
          </div>
        </div>

        <p className="hero-message">
          Sua presença já é o maior presente. Mas se quiser nos presentear,
          aqui estão algumas sugestões que escolhemos com carinho.
        </p>
      </header>

      {/* ── Presentes ── */}
      <main className="gifts-section">
        <div className="gifts-grid">
          {regularGifts.map(gift => (
            <GiftCard
              key={gift.id}
              gift={gift}
              reservationCount={reservationCounts[gift.id] || 0}
              onSelect={setSelectedGift}
            />
          ))}
        </div>

        {pixGifts.length > 0 && (
          <div className="cash-section">
            <h2 className="section-title">Contribuições Especiais</h2>
            <p className="section-subtitle">
              Sem limite de contribuições — qualquer valor é bem-vindo com muito amor!
            </p>
            <div className="pix-grid">
              {pixGifts.map(gift => (
                <GiftCard
                  key={gift.id}
                  gift={gift}
                  reservationCount={reservationCounts[gift.id] || 0}
                  onSelect={setSelectedGift}
                />
              ))}
            </div>
          </div>
        )}
      </main>

      <footer className="site-footer">
        <p>Feito com amor — Lumena & Victor · 23.05.2026</p>
      </footer>

      {selectedGift && (
        <GiftModal
          gift={selectedGift}
          onClose={() => setSelectedGift(null)}
          onConfirm={handleConfirm}
        />
      )}
    </div>
  )
}

export default App
