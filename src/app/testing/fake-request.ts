// Un XMLHttpRequest de mentira, para probar lo que se sube con su avance (platform/server/upload.ts):
// guarda lo que se le pidió y contesta cuando la prueba quiere. `last` es el último que se creó.
export class FakeRequest {
  static last: FakeRequest;
  headers: Record<string, string> = {};
  method = '';
  path = '';
  body: unknown;
  status = 0;
  responseText = '';
  responseHeaders = '';
  upload: { onprogress?: (event: { loaded: number; total: number }) => void } = {};
  onload?: () => void;
  onerror?: () => void;
  onabort?: () => void;
  constructor() {
    FakeRequest.last = this;
  }
  open(method: string, path: string) {
    this.method = method;
    this.path = path;
  }
  setRequestHeader(name: string, value: string) {
    this.headers[name] = value;
  }
  getAllResponseHeaders() {
    return this.responseHeaders;
  }
  send(body: unknown) {
    this.body = body;
  }
  abort() {
    this.onabort?.();
  }
  answer(status: number, body: unknown, headers = 'content-type: application/json\r\n') {
    this.status = status;
    this.responseText = JSON.stringify(body);
    this.responseHeaders = headers;
    this.onload?.();
  }
}
