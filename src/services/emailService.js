import emailjs from '@emailjs/browser'

const SERVICE_ID  = import.meta.env.VITE_EMAILJS_SERVICE_ID
const TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID
const PUBLIC_KEY  = import.meta.env.VITE_EMAILJS_PUBLIC_KEY

// Inicializa o EmailJS com a public key (obrigatório na v4)
emailjs.init({ publicKey: PUBLIC_KEY })

/**
 * Envia email de notificação quando um presente é reservado.
 *
 * Variáveis disponíveis no template do EmailJS:
 *   {{guest_name}}     — Nome do convidado
 *   {{guest_message}}  — Mensagem para os noivos
 *   {{gift_title}}     — Nome do presente
 *   {{variant_title}}  — Variante escolhida (se houver)
 *   {{reserved_at}}    — Data e hora da reserva
 */
export async function sendGiftNotification({ guestName, guestMessage, giftTitle, variantTitle }) {
  const templateParams = {
    guest_name:    guestName,
    guest_message: guestMessage || '(sem mensagem)',
    gift_title:    giftTitle,
    variant_title: variantTitle || '—',
    reserved_at:   new Date().toLocaleString('pt-BR', { timeZone: 'America/Recife' }),
  }

  return emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams)
}
