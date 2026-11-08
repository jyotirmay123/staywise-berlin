import SwiftUI

enum Tool: String, CaseIterable, Identifiable {
    case organize = "Organize"
    case merge = "Merge PDFs"
    case split = "Split & Extract"
    case compress = "Compress"
    case pdfToWord = "PDF to Word"
    case wordToPDF = "Word to PDF"
    case imageToPDF = "Images to PDF"
    case edit = "Edit PDF"
    case sign = "Sign PDF"
    case repair = "Repair PDF"
    case crop = "Crop PDF"
    case forms = "PDF Forms"
    case summarize = "AI Summarizer"
    case translate = "Translate PDF"

    var id: String { rawValue }

    var icon: String {
        switch self {
        case .organize: "square.grid.2x2"
        case .merge: "square.stack.3d.up"
        case .split: "scissors"
        case .compress: "arrow.down.right.and.arrow.up.left"
        case .pdfToWord: "doc.text"
        case .wordToPDF: "doc.richtext"
        case .imageToPDF: "photo.on.rectangle.angled"
        case .edit: "pencil.and.outline"
        case .sign: "signature"
        case .repair: "wrench.and.screwdriver"
        case .crop: "crop"
        case .forms: "list.bullet.clipboard"
        case .summarize: "sparkles"
        case .translate: "character.book.closed"
        }
    }

    var tint: Color {
        switch self {
        case .organize, .merge, .split: .blue
        case .compress, .repair: .orange
        case .pdfToWord, .wordToPDF, .imageToPDF: .indigo
        case .edit, .sign, .crop, .forms: .purple
        case .summarize, .translate: .mint
        }
    }

    static let sections: [(String, [Tool])] = [
        ("Pages", [.organize, .merge, .split]),
        ("Convert", [.compress, .pdfToWord, .wordToPDF, .imageToPDF]),
        ("Edit", [.edit, .sign, .crop, .forms, .repair]),
        ("AI", [.summarize, .translate]),
    ]
}
