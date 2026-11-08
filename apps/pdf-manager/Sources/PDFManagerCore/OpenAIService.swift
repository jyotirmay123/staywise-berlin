import Foundation

public struct OpenAIService {
    public let apiKey: String
    public let model: String
    private let endpoint: URL
    private let session: URLSession

    public init(
        apiKey: String,
        model: String = "gpt-5.6-terra",
        endpoint: URL = URL(string: "https://api.openai.com/v1/responses")!,
        session: URLSession = .shared
    ) {
        self.apiKey = apiKey
        self.model = model
        self.endpoint = endpoint
        self.session = session
    }

    public func summarize(_ text: String) async throws -> String {
        try await respond(
            instructions: """
            Summarize the document clearly. Start with a short executive summary, \
            then list key points, decisions, dates, obligations, risks, and action \
            items when present. Do not invent details.
            """,
            text: text
        )
    }

    public func translate(_ text: String, language: String) async throws -> String {
        try await respond(
            instructions: """
            Translate the document into \(language). Preserve headings, lists, \
            paragraph order, names, numbers, and legal or technical meaning. \
            Return only the translated document.
            """,
            text: text
        )
    }

    private func respond(instructions: String, text: String) async throws -> String {
        guard !apiKey.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty else {
            throw PDFManagerError.apiError(
                "Add an OpenAI API key in Settings. ChatGPT subscriptions do not include API access."
            )
        }
        var request = URLRequest(url: endpoint)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("Bearer \(apiKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: [
            "model": model,
            "reasoning": ["effort": "low"],
            "text": ["verbosity": "medium"],
            "instructions": instructions,
            "input": String(text.prefix(500_000)),
        ])
        let (data, response) = try await session.data(for: request)
        guard let http = response as? HTTPURLResponse else {
            throw PDFManagerError.invalidResponse
        }
        guard (200..<300).contains(http.statusCode) else {
            let object = try? JSONSerialization.jsonObject(with: data) as? [String: Any]
            let error = object?["error"] as? [String: Any]
            let message = error?["message"] as? String
            throw PDFManagerError.apiError(
                message ?? "OpenAI request failed with status \(http.statusCode)."
            )
        }
        let object = try JSONSerialization.jsonObject(with: data) as? [String: Any]
        if let text = object?["output_text"] as? String {
            return text
        }
        let output = object?["output"] as? [[String: Any]]
        let content = output?
            .compactMap { $0["content"] as? [[String: Any]] }
            .flatMap { $0 }
        if let text = content?.compactMap({ $0["text"] as? String }).joined(),
           !text.isEmpty {
            return text
        }
        throw PDFManagerError.invalidResponse
    }
}
