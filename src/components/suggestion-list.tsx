interface Suggestion {
  value: string
  label: string
}

interface SuggestionListProps {
  /** Trùng với thuộc tính `list` của input dùng nó. */
  id: string
  options: readonly Suggestion[]
}

/**
 * `<datalist>` cho các ô nhập tự do có giá trị gợi ý (cấp độ, nhóm kỹ năng…).
 *
 * Dùng datalist thay vì Select vì backend nhận chuỗi tự do: Select sẽ âm thầm bỏ mất giá trị
 * lạ mà AI trả về, còn ở đây người dùng vừa có danh sách để chọn vừa gõ được giá trị khác.
 */
export default function SuggestionList({ id, options }: SuggestionListProps) {
  return (
    <datalist id={id}>
      {options.map((option) => (
        <option key={option.value} value={option.value} label={option.label} />
      ))}
    </datalist>
  )
}
