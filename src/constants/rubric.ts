export interface RubricCriterionLevel {
  levelNo: number
  label: string
  descriptor: string
  scoreValue: number
}

export interface RubricCriterion {
  code: string
  name: string
  description: string
  weight: number
  maxScore: number
  levels: RubricCriterionLevel[]
}

export const MVP_RUBRIC: {
  code: string
  name: string
  description: string
  criteria: RubricCriterion[]
} = {
  code: 'TECH_INTERVIEW_FRESHER',
  name: 'Phỏng vấn kỹ thuật Fresher',
  description: 'Rubric đánh giá câu trả lời trong phỏng vấn kỹ thuật dành cho ứng viên Fresher.',
  criteria: [
    {
      code: 'TECHNICAL_ACCURACY',
      name: 'Độ chính xác kỹ thuật',
      description: 'Đánh giá tính đúng đắn của khái niệm, thuật ngữ, cơ chế và kết luận kỹ thuật.',
      weight: 0.3,
      maxScore: 4,
      levels: [
        { levelNo: 1, label: 'Không đạt', descriptor: 'Câu trả lời chứa lỗi kiến thức cốt lõi hoặc dẫn tới kết luận kỹ thuật sai.', scoreValue: 1 },
        { levelNo: 2, label: 'Cơ bản', descriptor: 'Nêu đúng phần kiến thức chính nhưng còn một số điểm thiếu chính xác hoặc nhầm thuật ngữ.', scoreValue: 2 },
        { levelNo: 3, label: 'Khá', descriptor: 'Hầu hết nội dung chính xác; sai sót nhỏ không làm thay đổi bản chất câu trả lời.', scoreValue: 3 },
        { levelNo: 4, label: 'Tốt', descriptor: 'Nội dung chính xác, dùng đúng thuật ngữ và nêu đúng điều kiện áp dụng của kết luận.', scoreValue: 4 },
      ],
    },
    {
      code: 'TECHNICAL_DEPTH',
      name: 'Chiều sâu kỹ thuật',
      description: 'Đánh giá khả năng giải thích cơ chế, nguyên nhân, giới hạn và đánh đổi kỹ thuật.',
      weight: 0.25,
      maxScore: 4,
      levels: [
        { levelNo: 1, label: 'Không đạt', descriptor: 'Chỉ nhắc lại từ khóa hoặc định nghĩa rời rạc, không giải thích được cơ chế liên quan.', scoreValue: 1 },
        { levelNo: 2, label: 'Cơ bản', descriptor: 'Giải thích được khái niệm và luồng cơ bản nhưng chưa làm rõ nguyên nhân hoặc giới hạn.', scoreValue: 2 },
        { levelNo: 3, label: 'Khá', descriptor: 'Giải thích được cơ chế, liên hệ các thành phần và đưa ra ví dụ kỹ thuật phù hợp.', scoreValue: 3 },
        { levelNo: 4, label: 'Tốt', descriptor: 'Phân tích rõ cơ chế bên trong, giới hạn, đánh đổi và tình huống nên hoặc không nên áp dụng.', scoreValue: 4 },
      ],
    },
    {
      code: 'PROBLEM_SOLVING',
      name: 'Tư duy giải quyết vấn đề',
      description: 'Đánh giá cách phân tích vấn đề, xây dựng hướng tiếp cận và kiểm chứng giải pháp.',
      weight: 0.2,
      maxScore: 4,
      levels: [
        { levelNo: 1, label: 'Không đạt', descriptor: 'Không xác định được vấn đề chính hoặc đề xuất giải pháp không thể thực hiện hay kiểm chứng.', scoreValue: 1 },
        { levelNo: 2, label: 'Cơ bản', descriptor: 'Đưa ra được một hướng xử lý nhưng các bước còn thiếu, dựa nhiều vào phỏng đoán chưa kiểm tra.', scoreValue: 2 },
        { levelNo: 3, label: 'Khá', descriptor: 'Phân tích có trình tự, đề xuất giải pháp khả thi và nêu được cách kiểm tra kết quả.', scoreValue: 3 },
        { levelNo: 4, label: 'Tốt', descriptor: 'Chia nhỏ vấn đề hợp lý, kiểm chứng giả thuyết, xét trường hợp biên và cân nhắc tối ưu hóa.', scoreValue: 4 },
      ],
    },
    {
      code: 'RELEVANCE_AND_STRUCTURE',
      name: 'Mức độ liên quan và cấu trúc',
      description: 'Đánh giá khả năng trả lời đúng trọng tâm và tổ chức nội dung theo trình tự hợp lý.',
      weight: 0.15,
      maxScore: 4,
      levels: [
        { levelNo: 1, label: 'Không đạt', descriptor: 'Phần lớn nội dung lệch câu hỏi, rời rạc hoặc không có kết luận có thể sử dụng.', scoreValue: 1 },
        { levelNo: 2, label: 'Cơ bản', descriptor: 'Có trả lời ý chính nhưng lẫn nhiều nội dung phụ và trình tự lập luận chưa rõ.', scoreValue: 2 },
        { levelNo: 3, label: 'Khá', descriptor: 'Trả lời đúng trọng tâm, các ý được sắp xếp hợp lý và có kết luận rõ ràng.', scoreValue: 3 },
        { levelNo: 4, label: 'Tốt', descriptor: 'Ưu tiên đúng thông tin quan trọng, trình bày súc tích và liên kết chặt chẽ từ lập luận đến kết luận.', scoreValue: 4 },
      ],
    },
    {
      code: 'COMMUNICATION_CLARITY',
      name: 'Độ rõ ràng khi trình bày',
      description: 'Đánh giá mức dễ hiểu, nhất quán và chính xác trong cách diễn đạt.',
      weight: 0.1,
      maxScore: 4,
      levels: [
        { levelNo: 1, label: 'Không đạt', descriptor: 'Cách diễn đạt khó hiểu, mâu thuẫn hoặc dùng thuật ngữ khiến người nghe hiểu sai.', scoreValue: 1 },
        { levelNo: 2, label: 'Cơ bản', descriptor: 'Có thể hiểu ý chính nhưng còn câu mơ hồ, lặp ý hoặc thuật ngữ chưa được giải thích.', scoreValue: 2 },
        { levelNo: 3, label: 'Khá', descriptor: 'Diễn đạt rõ ràng, dùng thuật ngữ nhất quán và giải thích vừa đủ để theo dõi.', scoreValue: 3 },
        { levelNo: 4, label: 'Tốt', descriptor: 'Trình bày chính xác, tự nhiên, điều chỉnh mức chi tiết phù hợp và làm rõ điểm dễ nhầm.', scoreValue: 4 },
      ],
    },
  ],
}
