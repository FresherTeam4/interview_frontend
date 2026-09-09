import type {
  InterviewDifficulty,
  InterviewSession,
  InterviewSessionSummary,
  SessionMode,
  Turn,
} from '@/types/session'

const STORAGE_KEY = 'mock_interview_sessions_list'
const DETAIL_KEY_PREFIX = 'mock_session_detail_'

export function getStoredSessions(): InterviewSessionSummary[] {
  try {
    localStorage.removeItem('mock_session_detail_101')
    localStorage.removeItem('mock_session_detail_102')
    localStorage.removeItem('mock_session_detail_103')
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) {
      return []
    }
    const list = JSON.parse(raw) as InterviewSessionSummary[]
    // Loại bỏ hoàn toàn các phiên fake mẫu cũ (101, 102, 103 và mock timestamp)
    const cleaned = list.filter(
      (s) => s.id !== 101 && s.id !== 102 && s.id !== 103 && s.id < 1000000000000,
    )
    if (cleaned.length !== list.length) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(cleaned))
    }
    return cleaned
  } catch {
    return []
  }
}

export function getStoredSessionDetail(sessionId: number): InterviewSession | null {
  try {
    const raw = localStorage.getItem(`${DETAIL_KEY_PREFIX}${sessionId}`)
    if (raw) {
      return JSON.parse(raw) as InterviewSession
    }
    return null
  } catch {
    return null
  }
}

export function saveStoredSessionDetail(session: InterviewSession): void {
  try {
    localStorage.setItem(`${DETAIL_KEY_PREFIX}${session.id}`, JSON.stringify(session))
  } catch {
    // Ignore storage quota errors
  }
}

export function saveCreatedSession(session: {
  id: number
  profileId: number
  profileHeadline?: string
  title: string
  difficulty?: InterviewDifficulty
  mode?: SessionMode
  durationMinutes?: number
}): void {
  try {
    const current = getStoredSessions()
    const duration = session.durationMinutes || 30
    const newSession: InterviewSessionSummary = {
      id: session.id,
      profileId: session.profileId,
      profileHeadline: session.profileHeadline || 'Hồ sơ ứng viên',
      jobDescriptionId: session.id,
      jobDescriptionTitle: session.title,
      difficulty: session.difficulty || 'MEDIUM',
      mode: session.mode || 'VOICE_TURN_BASED',
      durationMinutes: duration,
      status: 'READY',
      awaitingAction: 'START_SESSION',
      overallScore: null,
      lastActivityAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    }
    const updated = [newSession, ...current.filter((s) => s.id !== session.id)]
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))

    // Khởi tạo chi tiết phiên với lượt mở đầu
    const initialDetail: InterviewSession = {
      id: session.id,
      profile: { id: session.profileId, headline: session.profileHeadline || 'Ứng viên tiềm năng' },
      jobDescription: { id: session.id, title: session.title },
      difficulty: session.difficulty || 'MEDIUM',
      mode: session.mode || 'VOICE_TURN_BASED',
      languageCode: 'vi',
      durationMinutes: duration,
      deadlineAt: new Date(Date.now() + duration * 60 * 1000).toISOString(),
      remainingSeconds: duration * 60,
      currentTurnIndex: 0,
      status: 'IN_PROGRESS',
      awaitingAction: 'CANDIDATE_ANSWER',
      version: 1,
      currentPrompt: {
        turnId: 1,
        baseQuestionId: 1,
        ordinal: 1,
        text: 'Chào bạn! Để bắt đầu buổi phỏng vấn hôm nay, bạn hãy chia sẻ ngắn gọn về bản thân, cũng như dự án thực tế tiêu biểu nhất trong CV mà bạn tự hào nhất nhé?',
        isFollowUp: false,
        followUpDepth: 0,
      },
      turns: [
        {
          id: 1,
          turnIndex: 0,
          role: 'INTERVIEWER',
          inputMode: 'TEXT',
          content: 'Chào bạn! Để bắt đầu buổi phỏng vấn hôm nay, bạn hãy chia sẻ ngắn gọn về bản thân, cũng như dự án thực tế tiêu biểu nhất trong CV mà bạn tự hào nhất nhé?',
          isFollowUp: false,
          followUpDepth: 0,
          createdAt: new Date().toISOString(),
        },
      ],
      voiceDraft: null,
      statusMessage: null,
      lastActivityAt: new Date().toISOString(),
      startedAt: new Date().toISOString(),
      completedAt: null,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    }
    saveStoredSessionDetail(initialDetail)
  } catch {
    // Ignore storage quota errors
  }
}

export function updateStoredSessionSummary(
  sessionId: number,
  updates: Partial<InterviewSessionSummary>,
): void {
  try {
    const list = getStoredSessions()
    const updated = list.map((s) => (s.id === sessionId ? { ...s, ...updates } : s))
    localStorage.setItem(STORAGE_KEY, JSON.stringify(updated))
  } catch {
    // Ignore storage quota errors
  }
}

const TECHNICAL_QUESTIONS: { question: string; focus: string }[] = [
  {
    question:
      'Cảm ơn phần chia sẻ của bạn. Trong dự án bạn vừa nêu, bạn đã thiết kế và xử lý bài toán hiệu năng (ví dụ như caching, database index hoặc bất đồng bộ) như thế nào? Bạn có thể chia sẻ cụ thể giải pháp đã áp dụng không?',
    focus: 'Hiệu năng & Tối ưu dự án',
  },
  {
    question:
      'Giải pháp khá thực tế! Vậy khi hệ thống gặp lỗi ngoại lệ hoặc quá tải kết nối (connection timeout/failure), bạn đã thiết kế cơ chế xử lý lỗi, retry hoặc đảm bảo tính toàn vẹn dữ liệu (transaction) như thế nào?',
    focus: 'Xử lý lỗi & Transaction',
  },
  {
    question:
      'Rất tốt. Giả sử hệ thống cần mở rộng để phục vụ lượng người dùng tăng đột biến gấp 5 lần, bạn sẽ đề xuất những cải tiến kiến trúc hoặc phân vùng dữ liệu nào tiếp theo?',
    focus: 'Kiến trúc & Scalability',
  },
  {
    question:
      'Về nền tảng Java Core và xử lý đồng thời, bạn phân biệt HashMap và ConcurrentHashMap như thế nào? Trong môi trường đa luồng (Multi-threading), tại sao ConcurrentHashMap lại an toàn và tối ưu hơn so với việc dùng synchronized map?',
    focus: 'Java Core & Đa luồng (Concurrency)',
  },
  {
    question:
      'Trong hệ sinh thái Spring Boot, nguyên lý Inversion of Control (IoC) và Dependency Injection (DI) đem lại lợi ích gì? Bạn có thể giải thích vòng đời của một Spring Bean (Bean Lifecycle) và sự khác biệt giữa Scope Singleton với Prototype không?',
    focus: 'Spring Boot IoC & Bean Lifecycle',
  },
  {
    question:
      'Khi làm việc với cơ sở dữ liệu qua Spring Data JPA / Hibernate, vấn đề N+1 Query thường xuất hiện trong tình huống nào? Bạn áp dụng giải pháp nào (như JOIN FETCH, @EntityGraph hoặc batch size) để tối ưu triệt để?',
    focus: 'JPA / Hibernate & Tối ưu truy vấn SQL',
  },
  {
    question:
      'Về bảo mật hệ thống RESTful API, bạn đã từng tích hợp JWT (JSON Web Token) cùng Spring Security như thế nào? Bạn xử lý việc phân quyền (Role-based access control) và làm mới token (Refresh token) ra sao?',
    focus: 'Bảo mật API & Spring Security',
  },
  {
    question:
      'Trong quy trình phát triển, bạn viết Unit Test với JUnit 5 và Mockito như thế nào? Khi kiểm thử một Service có tương tác với Repository và External API bên ngoài, bạn thường mock dữ liệu và verify hành vi ra sao?',
    focus: 'Kiểm thử phần mềm & Unit Test',
  },
  {
    question:
      'Nếu một API trên môi trường Production đột ngột phản hồi rất chậm hoặc trả lỗi 500 bất thường, các bước bạn tiến hành để khoanh vùng và xử lý sự cố (logs, database slow query, monitoring metrics) là gì?',
    focus: 'Troubleshooting & Giám sát hệ thống',
  },
  {
    question:
      'Chúng ta đã trao đổi qua rất nhiều khía cạnh kỹ thuật chuyên sâu từ Java Core, Spring Boot cho đến Database và kiến trúc. Bạn có câu hỏi nào muốn đặt lại cho mình về dự án, định hướng công nghệ hay môi trường kỹ thuật tại công ty không?',
    focus: 'Trao đổi hai chiều & Tổng kết',
  },
]

/**
 * Xử lý lưu câu trả lời của ứng viên, phân tích ý định (kết thúc / hỏi tiếp)
 * và sinh câu hỏi thích ứng theo tiến trình thời lượng
 */
export function appendMockCandidateAnswer(
  sessionId: number,
  candidateAnswer: string,
): InterviewSession {
  let session = getStoredSessionDetail(sessionId)
  if (!session) {
    session = {
      id: sessionId,
      profile: { id: 1, headline: 'Ứng viên tiềm năng' },
      jobDescription: { id: sessionId, title: 'Vị trí công việc' },
      difficulty: 'MEDIUM',
      mode: 'TEXT',
      languageCode: 'vi',
      durationMinutes: 30,
      deadlineAt: new Date(Date.now() + 25 * 60 * 1000).toISOString(),
      remainingSeconds: 25 * 60,
      currentTurnIndex: 0,
      status: 'IN_PROGRESS',
      awaitingAction: 'CANDIDATE_ANSWER',
      version: 1,
      currentPrompt: null,
      turns: [
        {
          id: 1,
          turnIndex: 0,
          role: 'INTERVIEWER',
          inputMode: 'TEXT',
          content:
            'Chào bạn! Để bắt đầu buổi phỏng vấn hôm nay, bạn hãy chia sẻ ngắn gọn về bản thân, cũng như dự án thực tế tiêu biểu nhất trong CV mà bạn tự hào nhất nhé?',
          isFollowUp: false,
          followUpDepth: 0,
          createdAt: new Date(Date.now() - 60000).toISOString(),
        },
      ],
      voiceDraft: null,
      statusMessage: null,
      lastActivityAt: new Date().toISOString(),
      startedAt: new Date(Date.now() - 60000).toISOString(),
      completedAt: null,
      createdAt: new Date(Date.now() - 120000).toISOString(),
      updatedAt: new Date().toISOString(),
    }
  }

  const turns = [...session.turns]
  const lastTurnIndex = turns.length > 0 ? turns[turns.length - 1].turnIndex : 0

  // 1. Lượt của ứng viên
  const candidateTurn: Turn = {
    id: Date.now(),
    turnIndex: lastTurnIndex + 1,
    role: 'CANDIDATE',
    inputMode: 'TEXT',
    content: candidateAnswer,
    isFollowUp: false,
    followUpDepth: 0,
    createdAt: new Date().toISOString(),
  }
  turns.push(candidateTurn)

  // 2. Phân tích ý định câu trả lời của ứng viên
  const lower = candidateAnswer.trim().toLowerCase()

  const isRequestEnd =
    /(kết thúc|dừng lại|mệt rồi|nghỉ thôi|dừng phỏng vấn|kết thúc đi|thôi kết thúc|không muốn hỏi nữa|nghỉ đi|không hỏi nữa|hết rồi|muốn dừng)/i.test(
      lower,
    )

  const isWantToContinue =
    /(tiếp tục|câu khác|hỏi tiếp|hỏi câu khác|chưa muốn kết thúc|sao lại kết thúc|tiếp đi|hỏi thêm|làm tốt|tệ quá|chưa xong|muốn làm tốt)/i.test(
      lower,
    )

  const isCannotAnswer =
    /(chưa biết|không biết|chưa rõ|chưa tìm hiểu|chưa làm|chưa có kinh nghiệm|bỏ qua|em chịu)/i.test(
      lower,
    )

  const isAskingInterviewer =
    /(\?|như thế nào ạ|thế nào ạ|anh nghĩ sao|công ty có|dự án bên mình|định hướng)/i.test(
      lower,
    )

  // 3. Nếu ứng viên yêu cầu dừng/kết thúc phỏng vấn
  if (isRequestEnd) {
    const closingMessage =
      'Cảm ơn bạn rất nhiều vì buổi trao đổi hôm nay! Những câu trả lời và chia sẻ thực tế của bạn đã được ghi nhận đầy đủ. Buổi phỏng vấn đến đây là kết thúc, hệ thống đang tổng hợp dữ liệu để xuất báo cáo đánh giá năng lực chi tiết.'

    const interviewerTurn: Turn = {
      id: Date.now() + 1,
      turnIndex: lastTurnIndex + 2,
      role: 'INTERVIEWER',
      inputMode: 'TEXT',
      content: closingMessage,
      isFollowUp: false,
      followUpDepth: 0,
      createdAt: new Date().toISOString(),
    }
    turns.push(interviewerTurn)

    const completedSession: InterviewSession = {
      ...session,
      turns,
      currentTurnIndex: interviewerTurn.turnIndex,
      currentPrompt: null,
      status: 'COMPLETED',
      awaitingAction: 'REPORT',
      completedAt: new Date().toISOString(),
      version: session.version + 1,
      lastActivityAt: new Date().toISOString(),
    }

    saveStoredSessionDetail(completedSession)
    updateStoredSessionSummary(sessionId, {
      status: 'COMPLETED',
      awaitingAction: 'REPORT',
      overallScore: 82,
    })
    return completedSession
  }

  // 4. Xác định câu hỏi tiếp theo dựa trên số lượt trao đổi thực tế
  const candidateTurnCount = turns.filter((t) => t.role === 'CANDIDATE').length

  let prefix = ''
  if (isWantToContinue) {
    prefix =
      'Rất hoan nghênh tinh thần cầu tiến và nỗ lực của bạn! Buổi phỏng vấn vẫn còn thời lượng nên chúng ta sẽ tiếp tục đào sâu các mảng kỹ năng chuyên môn khác nhé. '
  } else if (isCannotAnswer) {
    prefix =
      'Không sao, đó là bài toán tương đối nâng cao trong các hệ thống phân tán quy mô lớn. Hãy cùng chuyển sang một chủ đề nền tảng quen thuộc hơn nhé: '
  } else if (candidateTurnCount > 1) {
    prefix = 'Cảm ơn câu trả lời của bạn. '
  }

  // Tính toán chỉ số câu hỏi kỹ thuật theo lượt
  const qIndex = Math.min(candidateTurnCount - 1, TECHNICAL_QUESTIONS.length - 1)
  const currentTopic = TECHNICAL_QUESTIONS[qIndex]

  let aiResponseText: string

  if (qIndex === TECHNICAL_QUESTIONS.length - 1 && candidateTurnCount > TECHNICAL_QUESTIONS.length) {
    if (isAskingInterviewer) {
      aiResponseText =
        'Đó là một câu hỏi rất hay! Tại công ty, chúng tôi áp dụng kiến trúc Microservices trên nền tảng Docker/K8s, quy trình Agile và văn hóa code review chặt chẽ. Buổi trao đổi hôm nay đã diễn ra rất trọn vẹn. Bạn có thể nhấn nút "Kết thúc phiên & Nhận đánh giá" ở cột bên trái hoặc nhắn "kết thúc" để hệ thống xuất báo cáo chấm điểm chi tiết nhé!'
    } else {
      aiResponseText =
        'Cảm ơn phần chia sẻ của bạn. Toàn bộ các trọng tâm đánh giá theo CV và JD cho buổi hôm nay đã được hoàn thành rất tốt. Bạn có thể nhấn nút "Kết thúc phiên & Nhận đánh giá" ở cột bên trái để chuyển sang xem kết quả chấm điểm Rubric chi tiết nhé!'
    }
  } else {
    aiResponseText = prefix + currentTopic.question
  }

  const interviewerTurn: Turn = {
    id: Date.now() + 1,
    turnIndex: lastTurnIndex + 2,
    role: 'INTERVIEWER',
    inputMode: 'TEXT',
    content: aiResponseText,
    isFollowUp: candidateTurnCount > 1,
    followUpDepth: Math.min(candidateTurnCount, 3),
    createdAt: new Date().toISOString(),
  }
  turns.push(interviewerTurn)

  const updatedSession: InterviewSession = {
    ...session,
    turns,
    currentTurnIndex: interviewerTurn.turnIndex,
    currentPrompt: {
      turnId: interviewerTurn.id,
      baseQuestionId: interviewerTurn.id,
      ordinal: interviewerTurn.turnIndex + 1,
      text: interviewerTurn.content,
      isFollowUp: interviewerTurn.isFollowUp ?? false,
      followUpDepth: interviewerTurn.followUpDepth ?? 0,
    },
    version: session.version + 1,
    awaitingAction: 'CANDIDATE_ANSWER',
    lastActivityAt: new Date().toISOString(),
  }

  saveStoredSessionDetail(updatedSession)
  return updatedSession
}

