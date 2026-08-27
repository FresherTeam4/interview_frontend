export type CompareLayout = 'cv' | 'split' | 'form'

const STORAGE_KEY = 'cv-profile:compare-layout'

/** Chỉ ghi nhớ tỉ lệ bố cục. URL presigned của CV không bao giờ được lưu lại. */
export function readStoredCompareLayout(): CompareLayout {
  try {
    const stored = window.localStorage.getItem(STORAGE_KEY)
    return stored === 'cv' || stored === 'split' || stored === 'form' ? stored : 'split'
  } catch {
    return 'split'
  }
}

export function storeCompareLayout(layout: CompareLayout) {
  try {
    window.localStorage.setItem(STORAGE_KEY, layout)
  } catch {
    // Trình duyệt chặn localStorage thì bỏ qua, bố cục chỉ mất khi tải lại trang.
  }
}
