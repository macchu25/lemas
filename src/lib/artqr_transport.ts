export async function artQRRequest(
  url: string,
  init: RequestInit = {},
  timeoutMs = 30000,
): Promise<Record<string, unknown>> {
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (init.signal?.aborted) controller.abort();
  init.signal?.addEventListener('abort', abort, { once: true });
  const timer = setTimeout(abort, timeoutMs);
  try {
    const response = await fetch(url, { ...init, signal: controller.signal, cache: 'no-store' });
    const text = await response.text();
    let data: Record<string, unknown> | undefined;
    try {
      const parsed: unknown = JSON.parse(text);
      if (parsed && typeof parsed === 'object' && !Array.isArray(parsed)) {
        data = parsed as Record<string, unknown>;
      }
    } catch { /* Report invalid JSON below, never fabricate a queued job. */ }
    if (!response.ok) {
      const message = data?.error || data?.message;
      throw new Error(typeof message === 'string' ? message : `API Art QR trả lỗi HTTP ${response.status}`);
    }
    if (!data) throw new Error('API Art QR trả dữ liệu không hợp lệ. Vui lòng thử lại.');
    return data;
  } catch (error) {
    if (controller.signal.aborted) {
      throw new Error('Hết thời gian chờ API Art QR. Yêu cầu có thể vẫn đang được xử lý.');
    }
    throw error;
  } finally {
    clearTimeout(timer);
    init.signal?.removeEventListener('abort', abort);
  }
}
