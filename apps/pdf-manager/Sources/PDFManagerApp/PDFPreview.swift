import PDFKit
import SwiftUI

struct PDFPreview: NSViewRepresentable {
    let document: PDFDocument?
    let pageIndex: Int

    func makeNSView(context: Context) -> PDFView {
        let view = PDFView()
        view.autoScales = true
        view.displayMode = .singlePageContinuous
        view.displayDirection = .vertical
        view.backgroundColor = .windowBackgroundColor
        return view
    }

    func updateNSView(_ view: PDFView, context: Context) {
        if view.document !== document {
            view.document = document
        }
        if
            let document,
            pageIndex >= 0,
            pageIndex < document.pageCount,
            let page = document.page(at: pageIndex),
            view.currentPage !== page
        {
            view.go(to: page)
        }
    }
}

struct PageThumbnail: View {
    let page: PDFPage?
    let number: Int
    let selected: Bool

    var body: some View {
        VStack(spacing: 7) {
            Group {
                if let image = page?.thumbnail(
                    of: CGSize(width: 112, height: 144),
                    for: .cropBox
                ) {
                    Image(nsImage: image)
                        .resizable()
                        .scaledToFit()
                } else {
                    Rectangle().fill(.white)
                }
            }
            .frame(width: 100, height: 132)
            .background(.white)
            .clipShape(RoundedRectangle(cornerRadius: 4))
            .shadow(color: .black.opacity(0.12), radius: 3, y: 1)
            .overlay {
                RoundedRectangle(cornerRadius: 5)
                    .stroke(selected ? Color.accentColor : .clear, lineWidth: 3)
            }

            Text("\(number)")
                .font(.caption2.monospacedDigit())
                .foregroundStyle(selected ? Color.accentColor : .secondary)
        }
        .padding(5)
    }
}
