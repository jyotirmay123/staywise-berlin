import Foundation

public enum PDFManagerError: LocalizedError {
    case cannotOpen(URL)
    case cannotCreatePage
    case emptyDocument
    case invalidPageRange(String)
    case noText
    case processFailed(String)
    case invalidResponse
    case apiError(String)

    public var errorDescription: String? {
        switch self {
        case let .cannotOpen(url):
            return "Could not open \(url.lastPathComponent)."
        case .cannotCreatePage:
            return "A PDF page could not be created."
        case .emptyDocument:
            return "The document has no pages."
        case let .invalidPageRange(value):
            return "Invalid page range: \(value). Use values such as 1-3,5."
        case .noText:
            return "No selectable text was found in this PDF."
        case let .processFailed(message):
            return message
        case .invalidResponse:
            return "The service returned an invalid response."
        case let .apiError(message):
            return message
        }
    }
}
