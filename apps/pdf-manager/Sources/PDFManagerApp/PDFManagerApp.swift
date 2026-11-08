import SwiftUI

@main
struct PDFManagerApp: App {
    @StateObject private var store = DocumentStore()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(store)
                .frame(minWidth: 1080, minHeight: 720)
        }
        .windowStyle(.titleBar)
        .commands {
            CommandGroup(replacing: .newItem) {
                Button("Open PDF…") {
                    store.openPDF()
                }
                .keyboardShortcut("o")
            }
            CommandGroup(replacing: .saveItem) {
                Button("Save As…") {
                    store.saveAs()
                }
                .keyboardShortcut("s", modifiers: [.command, .shift])
                .disabled(store.document == nil)
            }
        }

        Settings {
            SettingsView()
                .frame(width: 480, height: 240)
        }
    }
}
