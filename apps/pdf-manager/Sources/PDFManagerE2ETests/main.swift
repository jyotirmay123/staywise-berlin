import AppKit
import Foundation
import PDFKit
import PDFManagerCore

enum VerificationError: LocalizedError {
    case failed(String)

    var errorDescription: String? {
        switch self {
        case let .failed(message): "Verification failed: \(message)"
        }
    }
}

@main
struct PDFManagerE2ETests {
    @MainActor
    static func main() async throws {
        let runner = Runner()
        try runner.prepare()
        try runner.mergeSplitRearrange()
        try runner.imageCompressCropRepair()
        try runner.wordRoundTrip()
        try runner.editSignForm()
        try await runner.aiRequest()
        print("PASS: 5 end-to-end workflows")
        print("Artifacts: \(runner.outputDirectory.path)")
    }
}

@MainActor
private struct Runner {
    let outputDirectory = URL(
        fileURLWithPath: FileManager.default.currentDirectoryPath
    ).appendingPathComponent("output/pdf")

    func prepare() throws {
        try FileManager.default.createDirectory(
            at: outputDirectory,
            withIntermediateDirectories: true
        )
    }

    func mergeSplitRearrange() throws {
        let first = output("fixture-first.pdf")
        let second = output("fixture-second.pdf")
        try makeTextPDF(["Alpha page", "Beta page"], at: first)
        try makeTextPDF(["Gamma page"], at: second)

        let merged = output("e2e-merged.pdf")
        try PDFEngine.merge([first, second], to: merged)
        try check(try PDFEngine.load(merged).pageCount == 3, "merge page count")

        let splitDirectory = outputDirectory.appendingPathComponent("e2e-split")
        let split = try PDFEngine.split(
            merged,
            pageExpression: "1-2,3",
            to: splitDirectory
        )
        try check(split.count == 2, "split output count")
        try check(try PDFEngine.load(split[0]).pageCount == 2, "split first group")
        try check(try PDFEngine.load(split[1]).pageCount == 1, "split second group")

        let rearranged = output("e2e-rearranged.pdf")
        try PDFEngine.rearrange(merged, order: [2, 0], to: rearranged)
        let text = try PDFEngine.text(from: PDFEngine.load(rearranged))
        try check(text.contains("Gamma page"), "rearranged includes chosen page")
        try check(!text.contains("Beta page"), "rearranged removes omitted page")
        print("PASS: merge, split, extract, rearrange")
    }

    func imageCompressCropRepair() throws {
        let imageA = output("fixture-red.png")
        let imageB = output("fixture-blue.jpg")
        try makeImage(color: .systemRed, label: "RED", at: imageA, type: .png)
        try makeImage(color: .systemBlue, label: "BLUE", at: imageB, type: .jpeg)

        let imagePDF = output("e2e-images.pdf")
        try PDFEngine.imagesToPDF([imageA, imageB], to: imagePDF)
        try check(try PDFEngine.load(imagePDF).pageCount == 2, "image PDF page count")

        let compressed = output("e2e-compressed.pdf")
        try PDFEngine.compress(imagePDF, quality: .screen, to: compressed)
        try check(try PDFEngine.load(compressed).pageCount == 2, "compressed page count")
        try check(try fileSize(compressed) > 0, "compressed file size")

        let cropped = output("e2e-cropped.pdf")
        try PDFEngine.crop(compressed, inset: 24, to: cropped)
        guard let page = try PDFEngine.load(cropped).page(at: 0) else {
            throw VerificationError.failed("cropped first page")
        }
        try check(
            page.bounds(for: .cropBox).width < page.bounds(for: .mediaBox).width,
            "crop box width"
        )

        let repaired = output("e2e-repaired.pdf")
        try PDFEngine.repair(cropped, to: repaired)
        try check(try PDFEngine.load(repaired).pageCount == 2, "repair page count")
        print("PASS: images, compress, crop, repair")
    }

    func wordRoundTrip() throws {
        let source = output("fixture-word-source.pdf")
        try makeTextPDF(
            ["Quarterly Report", "Revenue increased by 18 percent."],
            at: source
        )
        let word = output("e2e-export.docx")
        try PDFEngine.pdfToWord(source, to: word)
        try check(try fileSize(word) > 500, "Word export size")

        let converted = output("e2e-word-roundtrip.pdf")
        try PDFEngine.wordToPDF(word, to: converted)
        let document = try PDFEngine.load(converted)
        try check(document.pageCount >= 1, "Word import page count")
        try check(
            try PDFEngine.text(from: document).contains("Quarterly Report"),
            "Word round-trip text"
        )
        print("PASS: PDF to Word and Word to PDF")
    }

    func editSignForm() throws {
        let source = output("fixture-edit.pdf")
        try makeTextPDF(["Agreement"], at: source)
        let document = try PDFEngine.load(source)

        PDFEngine.addText(
            "Approved",
            pageIndex: 0,
            point: CGPoint(x: 80, y: 80),
            to: document
        )
        PDFEngine.addSignature(
            "Alex Example",
            pageIndex: 0,
            point: CGPoint(x: 80, y: 130),
            to: document
        )
        try PDFEngine.addBlankPage(at: 1, to: document)
        try check(document.pageCount == 2, "blank page insertion")
        try check(document.page(at: 0)?.annotations.count == 2, "edit annotations")

        let formURL = output("fixture-form.pdf")
        try makeFormPDF(at: formURL)
        let formDocument = try PDFEngine.load(formURL)
        try check(
            PDFEngine.formFields(in: formDocument) == ["customer_name"],
            "form discovery"
        )
        PDFEngine.fillForm(["customer_name": "Taylor"], in: formDocument)
        let formAnnotation = formDocument.page(at: 0)?.annotations.first
        try check(formAnnotation?.widgetStringValue == "Taylor", "form fill")
        try PDFEngine.write(formDocument, to: output("e2e-filled-form.pdf"))

        let edited = output("e2e-edited-signed-form.pdf")
        try PDFEngine.write(document, to: edited)
        try check(try PDFEngine.load(edited).pageCount == 2, "edited save")
        print("PASS: edit, sign, add page, form fill")
    }

    func aiRequest() async throws {
        MockURLProtocol.handler = { request in
            let response = HTTPURLResponse(
                url: request.url!,
                statusCode: 200,
                httpVersion: nil,
                headerFields: ["Content-Type": "application/json"]
            )!
            let data = """
            {"output":[{"type":"message","content":[{"type":"output_text","text":"A concise summary."}]}]}
            """.data(using: .utf8)!
            return (response, data)
        }
        let configuration = URLSessionConfiguration.ephemeral
        configuration.protocolClasses = [MockURLProtocol.self]
        let service = OpenAIService(
            apiKey: "test-key",
            endpoint: URL(string: "https://example.test/v1/responses")!,
            session: URLSession(configuration: configuration)
        )
        let result = try await service.summarize("A long report")
        try check(result == "A concise summary.", "AI response parsing")
        print("PASS: AI summarizer request and response")
    }

    private func output(_ name: String) -> URL {
        outputDirectory.appendingPathComponent(name)
    }

    private func makeTextPDF(_ pages: [String], at url: URL) throws {
        let document = PDFDocument()
        for (index, text) in pages.enumerated() {
            let textView = NSTextView(
                frame: CGRect(x: 0, y: 0, width: 612, height: 792)
            )
            textView.textContainerInset = CGSize(width: 64, height: 64)
            textView.string = "\(text)\n\nPage \(index + 1)"
            textView.font = .systemFont(ofSize: 24, weight: .medium)
            textView.textColor = .black
            textView.backgroundColor = .white
            let data = textView.dataWithPDF(inside: textView.bounds)
            guard
                let pageDocument = PDFDocument(data: data),
                let page = pageDocument.page(at: 0)?.copy() as? PDFPage
            else {
                throw VerificationError.failed("text fixture creation")
            }
            document.insert(page, at: document.pageCount)
        }
        try PDFEngine.write(document, to: url)
    }

    private func makeImage(
        color: NSColor,
        label: String,
        at url: URL,
        type: NSBitmapImageRep.FileType
    ) throws {
        let image = NSImage(size: CGSize(width: 900, height: 1200))
        image.lockFocus()
        color.setFill()
        NSRect(x: 0, y: 0, width: 900, height: 1200).fill()
        label.draw(
            at: CGPoint(x: 300, y: 540),
            withAttributes: [
                .font: NSFont.systemFont(ofSize: 110, weight: .bold),
                .foregroundColor: NSColor.white,
            ]
        )
        image.unlockFocus()
        guard
            let data = image.tiffRepresentation,
            let bitmap = NSBitmapImageRep(data: data),
            let encoded = bitmap.representation(
                using: type,
                properties: [.compressionFactor: 0.9]
            )
        else {
            throw VerificationError.failed("image fixture creation")
        }
        try encoded.write(to: url)
    }

    private func makeFormPDF(at url: URL) throws {
        let pageContent = "BT /F1 20 Tf 80 700 Td (Customer Form) Tj ET"
        let objects = [
            "<< /Type /Catalog /Pages 2 0 R /AcroForm 5 0 R >>",
            "<< /Type /Pages /Kids [3 0 R] /Count 1 >>",
            "<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 7 0 R >> >> /Annots [4 0 R] /Contents 6 0 R >>",
            "<< /Type /Annot /Subtype /Widget /FT /Tx /T (customer_name) /Rect [80 620 320 654] /V () /DA (/Helv 14 Tf 0 g) /F 4 >>",
            "<< /Fields [4 0 R] /NeedAppearances true /DR << /Font << /Helv 7 0 R >> >> >>",
            "<< /Length \(pageContent.utf8.count) >>\nstream\n\(pageContent)\nendstream",
            "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
        ]
        var pdf = "%PDF-1.4\n"
        var offsets = [0]
        for (index, object) in objects.enumerated() {
            offsets.append(pdf.utf8.count)
            pdf += "\(index + 1) 0 obj\n\(object)\nendobj\n"
        }
        let xrefOffset = pdf.utf8.count
        pdf += "xref\n0 \(objects.count + 1)\n"
        pdf += "0000000000 65535 f \n"
        for offset in offsets.dropFirst() {
            pdf += String(format: "%010d 00000 n \n", offset)
        }
        pdf += """
        trailer
        << /Size \(objects.count + 1) /Root 1 0 R >>
        startxref
        \(xrefOffset)
        %%EOF

        """
        guard let data = pdf.data(using: .ascii) else {
            throw VerificationError.failed("form fixture encoding")
        }
        try data.write(to: url)
    }

    private func fileSize(_ url: URL) throws -> Int {
        let attributes = try FileManager.default.attributesOfItem(atPath: url.path)
        guard let size = attributes[.size] as? Int else {
            throw VerificationError.failed("file size")
        }
        return size
    }
}

private func check(_ condition: Bool, _ message: String) throws {
    if !condition {
        throw VerificationError.failed(message)
    }
}

private final class MockURLProtocol: URLProtocol {
    nonisolated(unsafe) static var handler:
        ((URLRequest) throws -> (HTTPURLResponse, Data))?

    override class func canInit(with request: URLRequest) -> Bool { true }
    override class func canonicalRequest(for request: URLRequest) -> URLRequest { request }

    override func startLoading() {
        guard let handler = Self.handler else { return }
        do {
            let (response, data) = try handler(request)
            client?.urlProtocol(self, didReceive: response, cacheStoragePolicy: .notAllowed)
            client?.urlProtocol(self, didLoad: data)
            client?.urlProtocolDidFinishLoading(self)
        } catch {
            client?.urlProtocol(self, didFailWithError: error)
        }
    }

    override func stopLoading() {}
}
