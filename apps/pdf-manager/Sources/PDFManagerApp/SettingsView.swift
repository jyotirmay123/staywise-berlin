import SwiftUI

struct SettingsView: View {
    @AppStorage("openAIModel") private var model = "gpt-5.6-terra"
    @State private var apiKey = ""
    @State private var status = ""

    var body: some View {
        Form {
            Section("OpenAI") {
                SecureField("API key", text: $apiKey)
                    .textFieldStyle(.roundedBorder)
                TextField("Model", text: $model)
                    .textFieldStyle(.roundedBorder)
                Text(
                    "Used only for Summarize and Translate. The key is stored in macOS Keychain. ChatGPT Plus and API billing are separate."
                )
                .font(.caption)
                .foregroundStyle(.secondary)
                HStack {
                    Button("Save Key") {
                        do {
                            try KeychainStore.saveAPIKey(apiKey)
                            status = "Saved securely"
                        } catch {
                            status = error.localizedDescription
                        }
                    }
                    Spacer()
                    Text(status)
                        .font(.caption)
                        .foregroundStyle(.secondary)
                }
            }
        }
        .formStyle(.grouped)
        .padding()
        .onAppear {
            apiKey = KeychainStore.loadAPIKey()
        }
    }
}
