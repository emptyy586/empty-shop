export default function apiErrorMessage(error) {
  if (!error?.response) {
    return 'Không kết nối được máy chủ. Hãy kiểm tra server đang chạy tại cổng 3000.';
  }

  const { status, data } = error.response;
  const responseText = typeof data === 'string'
    ? data
    : `${data?.message || ''} ${data?.error || ''}`;
  if (/proxy error|econnrefused|could not proxy request/i.test(responseText)) {
    return 'Không kết nối được máy chủ. Hãy kiểm tra server đang chạy tại cổng 3000.';
  }
  if (status >= 500) {
    return `Máy chủ gặp lỗi (HTTP ${status}). Vui lòng thử lại.`;
  }

  const message = data?.message;
  return message
    ? `Máy chủ từ chối yêu cầu: ${message}`
    : `Máy chủ từ chối yêu cầu (HTTP ${status}).`;
}
