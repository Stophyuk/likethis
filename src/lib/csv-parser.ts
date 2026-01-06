export interface ChatMessage {
  date: string
  user: string
  message: string
}

// 시스템/봇 메시지 패턴
const SYSTEM_MESSAGE_PATTERNS = [
  /님이 들어왔습니다/,
  /님이 나갔습니다/,
  /님을 내보냈습니다/,
  /운영정책을 위반한 메시지/,
  /타인, 기관 등의 사칭에 유의/,
  /금전 또는 개인정보를 요구/,
  /카카오톡 이용에 제한/,
  /채팅방 관리자가 메시지를 가렸습니다/,
  /삭제된 메시지입니다/,
]

function isSystemMessage(message: string): boolean {
  return SYSTEM_MESSAGE_PATTERNS.some(pattern => pattern.test(message))
}

export function parseKakaoCsv(content: string): ChatMessage[] {
  const lines = content.split('\n').filter(line => line.trim())
  if (lines.length === 0) return []

  // 첫 줄이 헤더인지 확인
  const firstLine = lines[0].toLowerCase()
  const hasHeader = firstLine.includes('date') || firstLine.includes('user') || firstLine.includes('message')
  const dataLines = hasHeader ? lines.slice(1) : lines

  // 구분자 감지 (탭 또는 쉼표)
  const delimiter = lines[0].includes('\t') ? '\t' : ','

  return dataLines
    .map(line => {
      const parts = line.split(delimiter)
      if (parts.length < 3) return null
      return {
        date: parts[0]?.trim().replace(/^"|"$/g, ''),
        user: parts[1]?.trim().replace(/^"|"$/g, ''),
        message: parts.slice(2).join(delimiter).trim().replace(/^"|"$/g, '')
      }
    })
    .filter((m): m is ChatMessage => m !== null && m.date && m.user && m.message)
    .filter(m => !isSystemMessage(m.message))
}

export function messagesToText(messages: ChatMessage[]): string {
  return messages.map(m => `[${m.date}] ${m.user}: ${m.message}`).join('\n')
}
