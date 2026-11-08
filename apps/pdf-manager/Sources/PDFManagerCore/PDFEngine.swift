import AppKit
import CoreGraphics
import Foundation
import PDFKit

public enum CompressionQuality: String, CaseIterable, Identifiable {
    case screen
    case balanced
    case print

    public var id: String { rawValue }

    var scale: CGFloat {
        switch self {
        case .screen: 0.75
        case .balanced: 1.25
        case .print: 2
        }
    }

    var jpegQuality: CGFloat {
        switch self {
        case .screen: 0.45
        case .balanced: 0.68
        case .print: 0.85
        }
    }
}

public enum PDFEngine {
    public static func load(_ url: URL) throws -> PDFDocument {
        guard let document = PDFDocument(url: url) else {
            throw PDFManagerError.cannotOpen(url)
        }
        return document
    }

    public static func merge(_ urls: [URL], to outputURL: URL) throws {
        let output = PDFDocument()
        for url in urls {
            let input = try load(url)
            for index in 0..<input.pageCount {
                guard let page = input.page(at: index)?.copy() as? PDFPage else {
                    throw PDFManagerError.cannotCreatePage
                }
                output.insert(page, at: output.pageCount)
            }
        }
        try write(output, to: outputURL)
    }

    public static func split(
        _ inputURL: URL,
        pageExpression: String,
        to directoryURL: URL
    ) throws -> [URL] {
        let input = try load(inputURL)
        let groups = try parsePageGroups(pageExpression, pageCount: input.pageCount)
        try FileManager.default.createDirectory(
            at: directoryURL,
            withIntermediateDirectories: true
        )
        var outputs: [URL] = []
        for (groupIndex, indexes) in groups.enumerated() {
            let document = PDFDocument()
            for index in indexes {
                guard let page = input.page(at: index)?.copy() as? PDFPage else {
                    throw PDFManagerError.cannotCreatePage
                }
                document.insert(page, at: document.pageCount)
            }
            let outputURL = directoryURL.appendingPathComponent(
                "\(inputURL.deletingPathExtension().lastPathComponent)-part-\(groupIndex + 1).pdf"
            )
            try write(document, to: outputURL)
            outputs.append(outputURL)
        }
        return outputs
    }

    public static func extractPages(
        _ inputURL: URL,
        indexes: [Int],
        to outputURL: URL
    ) throws {
        let input = try load(inputURL)
        let output = PDFDocument()
        for index in indexes where index >= 0 && index < input.pageCount {
            guard let page = input.page(at: index)?.copy() as? PDFPage else {
                throw PDFManagerError.cannotCreatePage
            }
            output.insert(page, at: output.pageCount)
        }
        try write(output, to: outputURL)
    }

    public static func rearrange(
        _ inputURL: URL,
        order: [Int],
        to outputURL: URL
    ) throws {
        try extractPages(inputURL, indexes: order, to: outputURL)
    }

    public static func compress(
        _ inputURL: URL,
        quality: CompressionQuality,
        to outputURL: URL
    ) throws {
        let input = try load(inputURL)
        let output = PDFDocument()
        for pageIndex in 0..<input.pageCount {
            guard let page = input.page(at: pageIndex) else { continue }
            let bounds = page.bounds(for: .mediaBox)
            let pixelWidth = max(Int(bounds.width * quality.scale), 1)
            let pixelHeight = max(Int(bounds.height * quality.scale), 1)
            guard
                let tiff = page.thumbnail(
                    of: CGSize(width: pixelWidth, height: pixelHeight),
                    for: .mediaBox
                ).tiffRepresentation,
                let bitmap = NSBitmapImageRep(data: tiff),
                let jpeg = bitmap.representation(
                    using: .jpeg,
                    properties: [.compressionFactor: quality.jpegQuality]
                ),
                let image = NSImage(data: jpeg),
                let outputPage = PDFPage(image: image)
            else {
                throw PDFManagerError.cannotCreatePage
            }
            outputPage.setBounds(bounds, for: .mediaBox)
            output.insert(outputPage, at: output.pageCount)
        }
        try write(output, to: outputURL)
    }

    public static func imagesToPDF(_ imageURLs: [URL], to outputURL: URL) throws {
        let output = PDFDocument()
        for imageURL in imageURLs {
            guard
                let image = NSImage(contentsOf: imageURL),
                let page = PDFPage(image: image)
            else {
                throw PDFManagerError.cannotOpen(imageURL)
            }
            output.insert(page, at: output.pageCount)
        }
        try write(output, to: outputURL)
    }

    public static func crop(
        _ inputURL: URL,
        inset: CGFloat,
        to outputURL: URL
    ) throws {
        let document = try load(inputURL)
        for index in 0..<document.pageCount {
            guard let page = document.page(at: index) else { continue }
            let bounds = page.bounds(for: .mediaBox)
            let cropped = bounds.insetBy(dx: max(0, inset), dy: max(0, inset))
            if cropped.width > 0, cropped.height > 0 {
                page.setBounds(cropped, for: .cropBox)
            }
        }
        try write(document, to: outputURL)
    }

    public static func repair(_ inputURL: URL, to outputURL: URL) throws {
        let input = try load(inputURL)
        let output = PDFDocument()
        for index in 0..<input.pageCount {
            guard
                let data = input.page(at: index)?.dataRepresentation,
                let rebuilt = PDFDocument(data: data),
                let page = rebuilt.page(at: 0)?.copy() as? PDFPage
            else {
                continue
            }
            output.insert(page, at: output.pageCount)
        }
        try write(output, to: outputURL)
    }

    public static func addText(
        _ text: String,
        pageIndex: Int,
        point: CGPoint,
        to document: PDFDocument
    ) {
        guard let page = document.page(at: pageIndex) else { return }
        let annotation = PDFAnnotation(
            bounds: CGRect(x: point.x, y: point.y, width: 260, height: 56),
            forType: .freeText,
            withProperties: nil
        )
        annotation.contents = text
        annotation.font = .systemFont(ofSize: 16)
        annotation.fontColor = .labelColor
        annotation.color = .clear
        page.addAnnotation(annotation)
    }

    public static func addSignature(
        _ signature: String,
        pageIndex: Int,
        point: CGPoint,
        to document: PDFDocument
    ) {
        guard let page = document.page(at: pageIndex) else { return }
        let annotation = PDFAnnotation(
            bounds: CGRect(x: point.x, y: point.y, width: 240, height: 72),
            forType: .freeText,
            withProperties: nil
        )
        annotation.contents = signature
        annotation.font = NSFont(name: "Snell Roundhand", size: 34)
            ?? NSFontManager.shared.convert(
                NSFont.systemFont(ofSize: 30),
                toHaveTrait: .italicFontMask
            )
        annotation.fontColor = .black
        annotation.color = .clear
        page.addAnnotation(annotation)
    }

    public static func addBlankPage(
        size: CGSize = CGSize(width: 612, height: 792),
        at index: Int,
        to document: PDFDocument
    ) throws {
        let image = NSImage(size: size)
        image.lockFocus()
        NSColor.white.setFill()
        NSRect(origin: .zero, size: size).fill()
        image.unlockFocus()
        guard let page = PDFPage(image: image) else {
            throw PDFManagerError.cannotCreatePage
        }
        document.insert(page, at: min(max(index, 0), document.pageCount))
    }

    public static func formFields(in document: PDFDocument) -> [String] {
        var names = Set<String>()
        for pageIndex in 0..<document.pageCount {
            guard let page = document.page(at: pageIndex) else { continue }
            for annotation in page.annotations {
                let name = annotation.fieldName
                    ?? annotation.value(forAnnotationKey: .textLabel) as? String
                if let name {
                    names.insert(name)
                }
            }
        }
        return names.filter { !$0.isEmpty }.sorted()
    }

    public static func fillForm(
        _ values: [String: String],
        in document: PDFDocument
    ) {
        for pageIndex in 0..<document.pageCount {
            guard let page = document.page(at: pageIndex) else { continue }
            for annotation in page.annotations {
                let fieldName = annotation.fieldName
                    ?? annotation.value(forAnnotationKey: .textLabel) as? String
                guard
                    let name = fieldName,
                    let value = values[name]
                else {
                    continue
                }
                annotation.widgetStringValue = value
            }
        }
    }

    public static func text(from document: PDFDocument) throws -> String {
        let text = (0..<document.pageCount)
            .compactMap { document.page(at: $0)?.string }
            .joined(separator: "\n\n")
            .trimmingCharacters(in: .whitespacesAndNewlines)
        guard !text.isEmpty else {
            throw PDFManagerError.noText
        }
        return text
    }

    public static func pdfToWord(_ inputURL: URL, to outputURL: URL) throws {
        let document = try load(inputURL)
        let plainText = try text(from: document)
        let workURL = FileManager.default.temporaryDirectory
            .appendingPathComponent(UUID().uuidString)
        try FileManager.default.createDirectory(
            at: workURL.appendingPathComponent("_rels"),
            withIntermediateDirectories: true
        )
        try FileManager.default.createDirectory(
            at: workURL.appendingPathComponent("word/_rels"),
            withIntermediateDirectories: true
        )

        let contentTypes = """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Types xmlns="http://schemas.openxmlformats.org/package/2006/content-types">
          <Default Extension="rels" ContentType="application/vnd.openxmlformats-package.relationships+xml"/>
          <Default Extension="xml" ContentType="application/xml"/>
          <Override PartName="/word/document.xml" ContentType="application/vnd.openxmlformats-officedocument.wordprocessingml.document.main+xml"/>
        </Types>
        """
        let relationships = """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">
          <Relationship Id="rId1" Type="http://schemas.openxmlformats.org/officeDocument/2006/relationships/officeDocument" Target="word/document.xml"/>
        </Relationships>
        """
        let paragraphs = plainText
            .components(separatedBy: .newlines)
            .map { "<w:p><w:r><w:t xml:space=\"preserve\">\(xmlEscape($0))</w:t></w:r></w:p>" }
            .joined()
        let documentXML = """
        <?xml version="1.0" encoding="UTF-8" standalone="yes"?>
        <w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
          <w:body>\(paragraphs)<w:sectPr><w:pgSz w:w="12240" w:h="15840"/><w:pgMar w:top="1440" w:right="1440" w:bottom="1440" w:left="1440"/></w:sectPr></w:body>
        </w:document>
        """
        try contentTypes.write(
            to: workURL.appendingPathComponent("[Content_Types].xml"),
            atomically: true,
            encoding: .utf8
        )
        try relationships.write(
            to: workURL.appendingPathComponent("_rels/.rels"),
            atomically: true,
            encoding: .utf8
        )
        try documentXML.write(
            to: workURL.appendingPathComponent("word/document.xml"),
            atomically: true,
            encoding: .utf8
        )

        try? FileManager.default.removeItem(at: outputURL)
        let process = Process()
        process.executableURL = URL(fileURLWithPath: "/usr/bin/zip")
        process.currentDirectoryURL = workURL
        process.arguments = ["-q", "-r", outputURL.path, "."]
        try process.run()
        process.waitUntilExit()
        try? FileManager.default.removeItem(at: workURL)
        guard process.terminationStatus == 0 else {
            throw PDFManagerError.processFailed("Could not create the Word document.")
        }
    }

    public static func wordToPDF(_ inputURL: URL, to outputURL: URL) throws {
        let options: [NSAttributedString.DocumentReadingOptionKey: Any] = [
            .documentType: NSAttributedString.DocumentType.officeOpenXML
        ]
        let attributed = try NSAttributedString(
            url: inputURL,
            options: options,
            documentAttributes: nil
        )
        let pageSize = CGSize(width: 612, height: 792)
        let textView = NSTextView(frame: CGRect(origin: .zero, size: pageSize))
        textView.textContainerInset = CGSize(width: 54, height: 54)
        textView.textStorage?.setAttributedString(attributed)
        textView.isHorizontallyResizable = false
        textView.isVerticallyResizable = true
        textView.textContainer?.containerSize = CGSize(
            width: pageSize.width - 108,
            height: .greatestFiniteMagnitude
        )
        textView.textContainer?.widthTracksTextView = true
        textView.layoutManager?.ensureLayout(for: textView.textContainer!)
        let usedHeight = textView.layoutManager?
            .usedRect(for: textView.textContainer!).height ?? 0
        textView.frame.size.height = max(usedHeight + 108, pageSize.height - 108)
        let printInfo = NSPrintInfo()
        printInfo.paperSize = pageSize
        printInfo.topMargin = 54
        printInfo.bottomMargin = 54
        printInfo.leftMargin = 54
        printInfo.rightMargin = 54
        printInfo.horizontalPagination = .fit
        printInfo.verticalPagination = .automatic
        printInfo.isHorizontallyCentered = false
        printInfo.isVerticallyCentered = false
        printInfo.jobDisposition = .save
        let savingKey: NSPrintInfo.AttributeKey = .jobSavingURL
        printInfo.dictionary()[savingKey] = outputURL
        let operation = NSPrintOperation(view: textView, printInfo: printInfo)
        operation.showsPrintPanel = false
        operation.showsProgressPanel = false
        guard operation.run() else {
            throw PDFManagerError.processFailed("Could not render the Word document.")
        }
    }

    public static func write(_ document: PDFDocument, to url: URL) throws {
        guard document.pageCount > 0 else {
            throw PDFManagerError.emptyDocument
        }
        guard document.write(to: url) else {
            throw PDFManagerError.processFailed(
                "Could not write \(url.lastPathComponent)."
            )
        }
    }

    static func parsePageGroups(
        _ expression: String,
        pageCount: Int
    ) throws -> [[Int]] {
        let trimmed = expression.trimmingCharacters(in: .whitespacesAndNewlines)
        if trimmed.isEmpty {
            return (0..<pageCount).map { [$0] }
        }
        var groups: [[Int]] = []
        for rawGroup in trimmed.split(separator: ",") {
            let value = rawGroup.trimmingCharacters(in: .whitespaces)
            if value.contains("-") {
                let parts = value.split(separator: "-", omittingEmptySubsequences: false)
                guard
                    parts.count == 2,
                    let start = Int(parts[0]),
                    let end = Int(parts[1]),
                    start >= 1,
                    end >= start,
                    end <= pageCount
                else {
                    throw PDFManagerError.invalidPageRange(expression)
                }
                groups.append(Array((start - 1)...(end - 1)))
            } else if let page = Int(value), page >= 1, page <= pageCount {
                groups.append([page - 1])
            } else {
                throw PDFManagerError.invalidPageRange(expression)
            }
        }
        return groups
    }

    private static func xmlEscape(_ value: String) -> String {
        value
            .replacingOccurrences(of: "&", with: "&amp;")
            .replacingOccurrences(of: "<", with: "&lt;")
            .replacingOccurrences(of: ">", with: "&gt;")
            .replacingOccurrences(of: "\"", with: "&quot;")
            .replacingOccurrences(of: "'", with: "&apos;")
    }
}
