export function APIError(params: {
  code: string
  statusCode: 400 | 401 | 403 | 404
  userMessage?: string
  devMessage?: string
  data?: any
}) {
  return {
    type: "API_ERROR",
    ...params
  };
}

export type APIError = ReturnType<typeof APIError>