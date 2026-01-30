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

// 무의미한 메시지 패턴 (분석 가치 없음)
const MEANINGLESS_PATTERNS = [
  /^사진$/,
  /^사진 \d+장$/,
  /^동영상$/,
  /^이모티콘$/,
  /^스티커$/,
  /^음성메시지$/,
  /^파일:/,
  /^파일 :/,
  /^(ㅋ+|ㅎ+|ㄷ+|ㅜ+|ㅠ+|ㅇ+|ㄱ+)$/,  // ㅋㅋㅋ, ㅎㅎㅎ 등
  /^(ㅋ+ㅎ+|ㅎ+ㅋ+)+$/,
  /^\.+$/,  // ...
  /^!+$/,   // !!!
  /^\?+$/,  // ???
  /^~+$/,   // ~~~
  /^(네|넵|넹|응|엉|웅|ㅇㅇ|ㅇㅋ|ㅇㅇㅇ|ok|OK|ㄱㄱ)$/i,  // 단순 응답
  /^(감사합니다|감사해요|고마워요|ㄱㅅ|ㄱㅅㅇ)$/,  // 단순 감사
  /^https?:\/\/[^\s]+$/,  // URL만 있는 메시지 (링크만)
]

function isSystemMessage(message: string): boolean {
  return SYSTEM_MESSAGE_PATTERNS.some(pattern => pattern.test(message))
}

function isMeaninglessMessage(message: string): boolean {
  const trimmed = message.trim()
  // 너무 짧은 메시지 (3자 이하)
  if (trimmed.length <= 3) return true
  // 패턴 매칭
  return MEANINGLESS_PATTERNS.some(pattern => pattern.test(trimmed))
}

// 분석 가치 있는 메시지만 필터링
export function filterForAnalysis(messages: ChatMessage[]): ChatMessage[] {
  return messages.filter(m => {
    const msg = m.message.trim()
    // 시스템 메시지 제외
    if (isSystemMessage(msg)) return false
    // 무의미한 메시지 제외
    if (isMeaninglessMessage(msg)) return false
    // 최소 길이 (5자 이상)
    if (msg.length < 5) return false
    return true
  })
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
    .filter((m): m is ChatMessage => m !== null && Boolean(m.date) && Boolean(m.user) && Boolean(m.message))
    .filter(m => !isSystemMessage(m.message))
}

export function messagesToText(messages: ChatMessage[]): string {
  return messages.map(m => `[${m.date}] ${m.user}: ${m.message}`).join('\n')
}
