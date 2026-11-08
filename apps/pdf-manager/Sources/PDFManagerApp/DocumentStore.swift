import AppKit
import Foundation
import PDFKit
import PDFManagerCore
import UniformTypeIdentifiers

@MainActor
final class DocumentStore: ObservableObject {
    @Published var document: PDFDocument?
    @Published var sourceURL: URL?
    @Published var selectedPageIndex = 0
    @Published var tool: Tool = .organize
    @Published var status = "Drop a PDF here or choose a tool."
    @Published var isWorking = false
    @Published var resultText = ""

    var pageCount: Int { document?.pageCount ?? 0 }

    func openPDF() {
        guard let url = openPanel(
            title: "Open PDF",
            types: ["pdf"],
            multiple: false
        ).first else {
            return
        }
        loadPDF(url)
    }

    func loadPDF(_ url: URL) {
        perform("Opening \(url.lastPathComponent)…") {
            let loaded = try PDFEngine.load(url)
            document = loaded
            sourceURL = url
            selectedPageIndex = 0
            status = "\(url.lastPathComponent) • \(loaded.pageCount) pages"
        }
    }

    func saveAs() {
        guard
            let document,
            let output = savePanel(
                title: "Save PDF",
                name: sourceURL?.deletingPathExtension().lastPathComponent
                    .appending("-edited.pdf") ?? "edited.pdf",
                type: "pdf"
            )
        else {
            return
        }
        perform("Saving…") {
            try PDFEngine.write(document, to: output)
            sourceURL = output
            status = "Saved \(output.lastPathComponent)"
        }
    }

    func mergePDFs() {
        let urls = openPanel(
            title: "Choose PDFs in Merge Order",
            types: ["pdf"],
            multiple: true
        )
        guard
            urls.count > 1,
            let output = savePanel(title: "Save Merged PDF", name: "merged.pdf", type: "pdf")
        else {
            return
        }
        perform("Merging \(urls.count) PDFs…") {
            try PDFEngine.merge(urls, to: output)
            loadPDF(output)
        }
    }

    func imagesToPDF() {
        let urls = openPanel(
            title: "Choose Images in Page Order",
            types: ["jpg", "jpeg", "png", "heic", "tiff", "gif", "bmp", "webp"],
            multiple: true
        )
        guard
            !urls.isEmpty,
            let output = savePanel(title: "Save Image PDF", name: "images.pdf", type: "pdf")
        else {
            return
        }
        perform("Converting \(urls.count) images…") {
            try PDFEngine.imagesToPDF(urls, to: output)
            loadPDF(output)
        }
    }

    func wordToPDF() {
        guard
            let input = openPanel(
                title: "Choose Word Document",
                types: ["docx"],
                multiple: false
            ).first,
            let output = savePanel(
                title: "Save PDF",
                name: "\(input.deletingPathExtension().lastPathComponent).pdf",
                type: "pdf"
            )
        else {
            return
        }
        perform("Converting Word document…") {
            try PDFEngine.wordToPDF(input, to: output)
            loadPDF(output)
        }
    }

    func pdfToWord() {
        guard
            let sourceURL,
            let output = savePanel(
                title: "Save Word Document",
                name: "\(sourceURL.deletingPathExtension().lastPathComponent).docx",
                type: "docx"
            )
        else {
            return
        }
        perform("Extracting text to Word…") {
            try PDFEngine.pdfToWord(sourceURL, to: output)
            status = "Created \(output.lastPathComponent)"
        }
    }

    func split(_ expression: String) {
        guard let sourceURL else { return }
        let panel = NSOpenPanel()
        panel.title = "Choose Output Folder"
        panel.canChooseDirectories = true
        panel.canChooseFiles = false
        panel.canCreateDirectories = true
        guard panel.runModal() == .OK, let directory = panel.url else { return }
        perform("Splitting PDF…") {
            let outputs = try PDFEngine.split(
                sourceURL,
                pageExpression: expression,
                to: directory
            )
            status = "Created \(outputs.count) PDF files"
        }
    }

    func compress(_ quality: CompressionQuality) {
        guard
            let sourceURL,
            let output = savePanel(
                title: "Save Compressed PDF",
                name: "\(sourceURL.deletingPathExtension().lastPathComponent)-compressed.pdf",
                type: "pdf"
            )
        else {
            return
        }
        perform("Compressing pages…") {
            try PDFEngine.compress(sourceURL, quality: quality, to: output)
            loadPDF(output)
        }
    }

    func crop(_ inset: CGFloat) {
        guard
            let sourceURL,
            let output = savePanel(
                title: "Save Cropped PDF",
                name: "\(sourceURL.deletingPathExtension().lastPathComponent)-cropped.pdf",
                type: "pdf"
            )
        else {
            return
        }
        perform("Cropping pages…") {
            try PDFEngine.crop(sourceURL, inset: inset, to: output)
            loadPDF(output)
        }
    }

    func repair() {
        guard
            let sourceURL,
            let output = savePanel(
                title: "Save Repaired PDF",
                name: "\(sourceURL.deletingPathExtension().lastPathComponent)-repaired.pdf",
                type: "pdf"
            )
        else {
            return
        }
        perform("Rebuilding PDF objects…") {
            try PDFEngine.repair(sourceURL, to: output)
            loadPDF(output)
        }
    }

    func movePage(offset: Int) {
        guard
            let document,
            selectedPageIndex >= 0,
            selectedPageIndex < document.pageCount
        else {
            return
        }
        let destination = selectedPageIndex + offset
        guard destination >= 0, destination < document.pageCount else { return }
        guard let page = document.page(at: selectedPageIndex) else { return }
        document.removePage(at: selectedPageIndex)
        document.insert(page, at: destination)
        selectedPageIndex = destination
        objectWillChange.send()
        status = "Page moved to position \(destination + 1)"
    }

    func deletePage() {
        guard let document, document.pageCount > 1 else { return }
        document.removePage(at: selectedPageIndex)
        selectedPageIndex = min(selectedPageIndex, document.pageCount - 1)
        objectWillChange.send()
        status = "Page removed"
    }

    func rotatePage() {
        guard let page = document?.page(at: selectedPageIndex) else { return }
        page.rotation = (page.rotation + 90) % 360
        objectWillChange.send()
        status = "Page rotated"
    }

    func duplicatePage() {
        guard
            let document,
            let page = document.page(at: selectedPageIndex)?.copy() as? PDFPage
        else {
            return
        }
        document.insert(page, at: selectedPageIndex + 1)
        selectedPageIndex += 1
        objectWillChange.send()
        status = "Page duplicated"
    }

    func addBlankPage() {
        guard let document else { return }
        perform("Adding page…") {
            try PDFEngine.addBlankPage(at: selectedPageIndex + 1, to: document)
            selectedPageIndex += 1
            objectWillChange.send()
            status = "Blank page added"
        }
    }

    func addPagesFromPDF() {
        guard
            let document,
            let url = openPanel(
                title: "Choose PDF to Insert",
                types: ["pdf"],
                multiple: false
            ).first
        else {
            return
        }
        perform("Adding pages…") {
            let input = try PDFEngine.load(url)
            var insertIndex = selectedPageIndex + 1
            for index in 0..<input.pageCount {
                guard let page = input.page(at: index)?.copy() as? PDFPage else { continue }
                document.insert(page, at: insertIndex)
                insertIndex += 1
            }
            objectWillChange.send()
            status = "Added \(input.pageCount) pages"
        }
    }

    func addText(_ text: String) {
        guard let document, !text.isEmpty else { return }
        PDFEngine.addText(
            text,
            pageIndex: selectedPageIndex,
            point: CGPoint(x: 72, y: 72),
            to: document
        )
        objectWillChange.send()
        status = "Text added to page \(selectedPageIndex + 1)"
    }

    func addSignature(_ signature: String) {
        guard let document, !signature.isEmpty else { return }
        PDFEngine.addSignature(
            signature,
            pageIndex: selectedPageIndex,
            point: CGPoint(x: 72, y: 72),
            to: document
        )
        objectWillChange.send()
        status = "Signature added to page \(selectedPageIndex + 1)"
    }

    func runAI(mode: Tool, language: String = "") {
        guard let document else { return }
        isWorking = true
        status = mode == .summarize ? "Summarizing document…" : "Translating document…"
        Task {
            do {
                let text = try PDFEngine.text(from: document)
                let service = OpenAIService(
                    apiKey: KeychainStore.loadAPIKey(),
                    model: UserDefaults.standard.string(forKey: "openAIModel")
                        ?? "gpt-5.6-terra"
                )
                resultText = if mode == .summarize {
                    try await service.summarize(text)
                } else {
                    try await service.translate(text, language: language)
                }
                status = "AI result ready"
            } catch {
                status = error.localizedDescription
            }
            isWorking = false
        }
    }

    func fillForm(_ values: [String: String]) {
        guard let document else { return }
        PDFEngine.fillForm(values, in: document)
        objectWillChange.send()
        status = "Form values updated"
    }

    private func perform(_ message: String, operation: () throws -> Void) {
        isWorking = true
        status = message
        do {
            try operation()
        } catch {
            status = error.localizedDescription
        }
        isWorking = false
    }

    private func openPanel(
        title: String,
        types: [String],
        multiple: Bool
    ) -> [URL] {
        let panel = NSOpenPanel()
        panel.title = title
        panel.allowedContentTypes = types.compactMap {
            UTType(filenameExtension: $0)
        }
        panel.allowsMultipleSelection = multiple
        panel.canChooseDirectories = false
        panel.canChooseFiles = true
        return panel.runModal() == .OK ? panel.urls : []
    }

    private func savePanel(title: String, name: String, type: String) -> URL? {
        let panel = NSSavePanel()
        panel.title = title
        panel.nameFieldStringValue = name
        panel.allowedContentTypes = [type].compactMap {
            UTType(filenameExtension: $0)
        }
        panel.canCreateDirectories = true
        return panel.runModal() == .OK ? panel.url : nil
    }
}
