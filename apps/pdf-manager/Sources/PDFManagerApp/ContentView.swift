import PDFKit
import PDFManagerCore
import SwiftUI
import UniformTypeIdentifiers

struct ContentView: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var isTargeted = false

    var body: some View {
        NavigationSplitView {
            Sidebar()
                .navigationSplitViewColumnWidth(min: 210, ideal: 230, max: 270)
        } content: {
            Workspace()
        } detail: {
            ToolInspector()
                .navigationSplitViewColumnWidth(min: 280, ideal: 320, max: 380)
        }
        .background(Color(nsColor: .windowBackgroundColor))
        .toolbar {
            ToolbarItemGroup {
                Button {
                    store.openPDF()
                } label: {
                    Label("Open", systemImage: "folder")
                }
                Button {
                    store.saveAs()
                } label: {
                    Label("Save As", systemImage: "square.and.arrow.down")
                }
                .disabled(store.document == nil)
            }
        }
        .safeAreaInset(edge: .bottom) {
            StatusBar()
        }
        .onDrop(of: [.fileURL], isTargeted: $isTargeted) { providers in
            guard let provider = providers.first else { return false }
            provider.loadItem(forTypeIdentifier: UTType.fileURL.identifier) { data, _ in
                guard
                    let data = data as? Data,
                    let url = URL(dataRepresentation: data, relativeTo: nil),
                    url.pathExtension.lowercased() == "pdf"
                else {
                    return
                }
                Task { @MainActor in
                    store.loadPDF(url)
                }
            }
            return true
        }
        .overlay {
            if isTargeted {
                RoundedRectangle(cornerRadius: 18)
                    .strokeBorder(
                        Color.accentColor,
                        style: StrokeStyle(lineWidth: 4, dash: [10])
                    )
                    .background(Color.accentColor.opacity(0.08))
                    .padding(8)
                    .allowsHitTesting(false)
            }
        }
    }
}

private struct Sidebar: View {
    @EnvironmentObject private var store: DocumentStore

    var body: some View {
        List(selection: $store.tool) {
            Section {
                HStack(spacing: 11) {
                    ZStack {
                        RoundedRectangle(cornerRadius: 10)
                            .fill(
                                LinearGradient(
                                    colors: [.red, .pink],
                                    startPoint: .topLeading,
                                    endPoint: .bottomTrailing
                                )
                            )
                        Image(systemName: "doc.richtext.fill")
                            .foregroundStyle(.white)
                            .font(.title3)
                    }
                    .frame(width: 38, height: 38)
                    VStack(alignment: .leading, spacing: 2) {
                        Text("PDF Manager")
                            .font(.headline)
                        Text("Private by default")
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }
                .padding(.vertical, 7)
            }

            ForEach(Tool.sections, id: \.0) { section, tools in
                Section(section) {
                    ForEach(tools) { tool in
                        Label(tool.rawValue, systemImage: tool.icon)
                            .foregroundStyle(
                                store.tool == tool ? tool.tint : .primary
                            )
                            .tag(tool)
                    }
                }
            }
        }
        .listStyle(.sidebar)
    }
}

private struct Workspace: View {
    @EnvironmentObject private var store: DocumentStore

    var body: some View {
        VStack(spacing: 0) {
            if let document = store.document {
                PDFPreview(
                    document: document,
                    pageIndex: store.selectedPageIndex
                )
                .id(document)
                .frame(maxWidth: .infinity, maxHeight: .infinity)

                Divider()
                thumbnailStrip(document)
                    .frame(height: 182)
                    .background(.regularMaterial)
            } else {
                EmptyWorkspace()
            }
        }
    }

    private func thumbnailStrip(_ document: PDFDocument) -> some View {
        ScrollView(.horizontal) {
            LazyHStack(spacing: 4) {
                ForEach(0..<document.pageCount, id: \.self) { index in
                    Button {
                        store.selectedPageIndex = index
                    } label: {
                        PageThumbnail(
                            page: document.page(at: index),
                            number: index + 1,
                            selected: index == store.selectedPageIndex
                        )
                    }
                    .buttonStyle(.plain)
                    .contextMenu {
                        Button("Move Left") { store.movePage(offset: -1) }
                        Button("Move Right") { store.movePage(offset: 1) }
                        Button("Rotate") { store.rotatePage() }
                        Button("Duplicate") { store.duplicatePage() }
                        Divider()
                        Button("Delete", role: .destructive) { store.deletePage() }
                    }
                }
            }
            .padding(.horizontal, 14)
        }
        .scrollIndicators(.visible)
    }
}

private struct EmptyWorkspace: View {
    @EnvironmentObject private var store: DocumentStore

    var body: some View {
        VStack(spacing: 24) {
            ZStack {
                Circle()
                    .fill(
                        LinearGradient(
                            colors: [.red.opacity(0.18), .pink.opacity(0.08)],
                            startPoint: .topLeading,
                            endPoint: .bottomTrailing
                        )
                    )
                Image(systemName: "doc.viewfinder")
                    .font(.system(size: 52, weight: .light))
                    .foregroundStyle(.red)
            }
            .frame(width: 118, height: 118)

            VStack(spacing: 8) {
                Text("Your PDF workbench")
                    .font(.system(size: 28, weight: .semibold, design: .rounded))
                Text("Drop a PDF anywhere, or open one to edit and organize pages.")
                    .foregroundStyle(.secondary)
            }

            HStack {
                Button("Open PDF…") {
                    store.openPDF()
                }
                .buttonStyle(.borderedProminent)
                .controlSize(.large)

                Button("Merge PDFs…") {
                    store.mergePDFs()
                }
                .controlSize(.large)
            }

            Text("PDFs stay on this Mac unless you explicitly use an AI tool.")
                .font(.caption)
                .foregroundStyle(.tertiary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

private struct ToolInspector: View {
    @EnvironmentObject private var store: DocumentStore

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 20) {
                HStack(spacing: 12) {
                    Image(systemName: store.tool.icon)
                        .font(.title2)
                        .foregroundStyle(store.tool.tint)
                        .frame(width: 40, height: 40)
                        .background(store.tool.tint.opacity(0.12))
                        .clipShape(RoundedRectangle(cornerRadius: 10))
                    VStack(alignment: .leading) {
                        Text(store.tool.rawValue)
                            .font(.title3.bold())
                        Text(toolSubtitle)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                    }
                }

                Divider()

                inspectorContent
            }
            .padding(20)
        }
        .background(Color(nsColor: .controlBackgroundColor).opacity(0.45))
    }

    @ViewBuilder
    private var inspectorContent: some View {
        switch store.tool {
        case .organize:
            OrganizePanel()
        case .merge:
            ActionPanel(
                text: "Select two or more PDFs. The chooser order becomes the page order.",
                button: "Choose PDFs & Merge",
                icon: "square.stack.3d.up"
            ) {
                store.mergePDFs()
            }
        case .split:
            SplitPanel()
        case .compress:
            CompressPanel()
        case .pdfToWord:
            ActionPanel(
                text: "Extract selectable PDF text into an editable .docx document.",
                button: "Export Word Document",
                icon: "doc.text"
            ) {
                store.pdfToWord()
            }
        case .wordToPDF:
            ActionPanel(
                text: "Convert a .docx file using macOS text rendering.",
                button: "Choose Word Document",
                icon: "doc.richtext"
            ) {
                store.wordToPDF()
            }
        case .imageToPDF:
            ActionPanel(
                text: "Combine JPG, PNG, HEIC, TIFF, GIF, BMP, or WebP images into a PDF.",
                button: "Choose Images",
                icon: "photo.on.rectangle.angled"
            ) {
                store.imagesToPDF()
            }
        case .edit:
            EditPanel()
        case .sign:
            SignaturePanel()
        case .repair:
            ActionPanel(
                text: "Rebuild every readable page into a clean PDF. Useful for malformed object trees.",
                button: "Repair & Save",
                icon: "wrench.and.screwdriver"
            ) {
                store.repair()
            }
        case .crop:
            CropPanel()
        case .forms:
            FormsPanel()
        case .summarize:
            AIPanel(mode: .summarize)
        case .translate:
            AIPanel(mode: .translate)
        }
    }

    private var toolSubtitle: String {
        switch store.tool {
        case .organize: "Reorder, rotate, add, and remove"
        case .merge: "Combine complete documents"
        case .split: "Create page groups or single pages"
        case .compress: "Reduce file size by re-rendering"
        case .pdfToWord: "Make PDF text editable"
        case .wordToPDF: "Create a shareable PDF"
        case .imageToPDF: "Turn images into pages"
        case .edit: "Add text annotations"
        case .sign: "Place a typed signature"
        case .repair: "Rebuild readable pages"
        case .crop: "Adjust visible page bounds"
        case .forms: "Fill interactive fields"
        case .summarize: "Understand long documents quickly"
        case .translate: "Translate extracted document text"
        }
    }
}

private struct OrganizePanel: View {
    @EnvironmentObject private var store: DocumentStore

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Selected page \(store.pageCount == 0 ? 0 : store.selectedPageIndex + 1) of \(store.pageCount)")
                .font(.headline)

            HStack {
                inspectorButton("Left", "arrow.left") { store.movePage(offset: -1) }
                inspectorButton("Right", "arrow.right") { store.movePage(offset: 1) }
            }
            HStack {
                inspectorButton("Rotate", "rotate.right") { store.rotatePage() }
                inspectorButton("Duplicate", "plus.square.on.square") {
                    store.duplicatePage()
                }
            }
            HStack {
                inspectorButton("Blank", "doc.badge.plus") { store.addBlankPage() }
                inspectorButton("From PDF", "square.and.arrow.down.on.square") {
                    store.addPagesFromPDF()
                }
            }
            Button(role: .destructive) {
                store.deletePage()
            } label: {
                Label("Remove Selected Page", systemImage: "trash")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.bordered)
            .disabled(store.pageCount < 2)

            Callout(
                icon: "lightbulb",
                text: "Use the thumbnail strip to select pages. Save As keeps the original untouched."
            )
        }
        .disabled(store.document == nil)
    }

    private func inspectorButton(
        _ title: String,
        _ icon: String,
        action: @escaping () -> Void
    ) -> some View {
        Button(action: action) {
            Label(title, systemImage: icon)
                .frame(maxWidth: .infinity)
        }
        .buttonStyle(.bordered)
    }
}

private struct SplitPanel: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var expression = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Page groups")
                .font(.headline)
            TextField("Example: 1-3,4,5-8", text: $expression)
                .textFieldStyle(.roundedBorder)
            Text(
                "Each comma-separated group becomes a PDF. Leave blank to extract every page individually."
            )
            .font(.caption)
            .foregroundStyle(.secondary)
            Button {
                store.split(expression)
            } label: {
                Label("Choose Folder & Split", systemImage: "scissors")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(store.document == nil)
        }
    }
}

private struct CompressPanel: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var quality: CompressionQuality = .balanced

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Picker("Quality", selection: $quality) {
                Text("Small • screen").tag(CompressionQuality.screen)
                Text("Balanced").tag(CompressionQuality.balanced)
                Text("High • print").tag(CompressionQuality.print)
            }
            .pickerStyle(.radioGroup)
            Callout(
                icon: "exclamationmark.triangle",
                text: "Compression rasterizes pages. Selectable text, forms, links, and signatures become flat."
            )
            Button {
                store.compress(quality)
            } label: {
                Label("Compress & Save", systemImage: "arrow.down.right.and.arrow.up.left")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(store.document == nil)
        }
    }
}

private struct EditPanel: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var text = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Add text to selected page")
                .font(.headline)
            TextEditor(text: $text)
                .frame(minHeight: 110)
                .font(.body)
                .scrollContentBackground(.hidden)
                .padding(6)
                .background(.background)
                .clipShape(RoundedRectangle(cornerRadius: 8))
                .overlay {
                    RoundedRectangle(cornerRadius: 8)
                        .stroke(.separator)
                }
            Button("Add Text Annotation") {
                store.addText(text)
                text = ""
            }
            .buttonStyle(.borderedProminent)
            .disabled(store.document == nil || text.isEmpty)
            Callout(
                icon: "cursorarrow.motionlines",
                text: "The annotation is placed near the lower-left of the selected page. You can drag it in Preview after saving."
            )
        }
    }
}

private struct SignaturePanel: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var signature = ""

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Typed signature")
                .font(.headline)
            TextField("Your name", text: $signature)
                .font(.system(size: 22, design: .serif).italic())
                .textFieldStyle(.roundedBorder)
            Button {
                store.addSignature(signature)
            } label: {
                Label("Place on Selected Page", systemImage: "signature")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(store.document == nil || signature.isEmpty)
            Callout(
                icon: "checkmark.shield",
                text: "This places a visual signature annotation. It is not a certificate-based cryptographic signature."
            )
        }
    }
}

private struct CropPanel: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var inset: Double = 18

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            Text("Inset all edges")
                .font(.headline)
            HStack {
                Slider(value: $inset, in: 0...144, step: 1)
                Text("\(Int(inset)) pt")
                    .monospacedDigit()
                    .frame(width: 54)
            }
            Text("72 points = 1 inch")
                .font(.caption)
                .foregroundStyle(.secondary)
            Button {
                store.crop(CGFloat(inset))
            } label: {
                Label("Crop & Save", systemImage: "crop")
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(store.document == nil)
        }
    }
}

private struct FormsPanel: View {
    @EnvironmentObject private var store: DocumentStore
    @State private var values: [String: String] = [:]

    private var fields: [String] {
        guard let document = store.document else { return [] }
        return PDFEngine.formFields(in: document)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            if fields.isEmpty {
                Callout(
                    icon: "rectangle.and.pencil.and.ellipsis",
                    text: store.document == nil
                        ? "Open a PDF to inspect its form fields."
                        : "No interactive form fields were found."
                )
            } else {
                Text("\(fields.count) fields")
                    .font(.headline)
                ForEach(fields, id: \.self) { field in
                    VStack(alignment: .leading, spacing: 4) {
                        Text(field)
                            .font(.caption)
                            .foregroundStyle(.secondary)
                        TextField("Value", text: Binding(
                            get: { values[field, default: ""] },
                            set: { values[field] = $0 }
                        ))
                        .textFieldStyle(.roundedBorder)
                    }
                }
                Button("Apply Form Values") {
                    store.fillForm(values)
                }
                .buttonStyle(.borderedProminent)
            }
        }
    }
}

private struct AIPanel: View {
    @EnvironmentObject private var store: DocumentStore
    let mode: Tool
    @State private var language = "German"

    var body: some View {
        VStack(alignment: .leading, spacing: 14) {
            if mode == .translate {
                TextField("Target language", text: $language)
                    .textFieldStyle(.roundedBorder)
            }
            Callout(
                icon: "lock.shield",
                text: "Only extracted text is sent to OpenAI. Scanned pages need OCR before AI tools can read them."
            )
            Button {
                store.runAI(mode: mode, language: language)
            } label: {
                Label(
                    mode == .summarize ? "Summarize PDF" : "Translate PDF",
                    systemImage: "sparkles"
                )
                .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
            .disabled(
                store.document == nil
                    || store.isWorking
                    || (mode == .translate && language.isEmpty)
            )

            if !store.resultText.isEmpty {
                HStack {
                    Text("Result")
                        .font(.headline)
                    Spacer()
                    Button("Copy") {
                        NSPasteboard.general.clearContents()
                        NSPasteboard.general.setString(store.resultText, forType: .string)
                    }
                }
                TextEditor(text: $store.resultText)
                    .frame(minHeight: 280)
                    .font(.body)
                    .scrollContentBackground(.hidden)
                    .padding(6)
                    .background(.background)
                    .clipShape(RoundedRectangle(cornerRadius: 8))
            }
        }
    }
}

private struct ActionPanel: View {
    let text: String
    let button: String
    let icon: String
    let action: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text(text)
                .foregroundStyle(.secondary)
            Button(action: action) {
                Label(button, systemImage: icon)
                    .frame(maxWidth: .infinity)
            }
            .buttonStyle(.borderedProminent)
        }
    }
}

private struct Callout: View {
    let icon: String
    let text: String

    var body: some View {
        HStack(alignment: .top, spacing: 9) {
            Image(systemName: icon)
                .foregroundStyle(.secondary)
            Text(text)
                .font(.caption)
                .foregroundStyle(.secondary)
        }
        .padding(10)
        .frame(maxWidth: .infinity, alignment: .leading)
        .background(.quaternary.opacity(0.5))
        .clipShape(RoundedRectangle(cornerRadius: 8))
    }
}

private struct StatusBar: View {
    @EnvironmentObject private var store: DocumentStore

    var body: some View {
        HStack(spacing: 9) {
            if store.isWorking {
                ProgressView()
                    .controlSize(.small)
            } else {
                Image(systemName: store.document == nil ? "circle.dashed" : "checkmark.circle")
                    .foregroundStyle(.secondary)
            }
            Text(store.status)
                .font(.caption)
                .lineLimit(1)
            Spacer()
            if store.pageCount > 0 {
                Text("\(store.pageCount) pages")
                    .font(.caption.monospacedDigit())
                    .foregroundStyle(.secondary)
            }
        }
        .padding(.horizontal, 12)
        .frame(height: 30)
        .background(.bar)
        .overlay(alignment: .top) { Divider() }
    }
}
