import Foundation
import Security

enum KeychainStore {
    private static let service = "com.local.PDFManager"
    private static let account = "openAIAPIKey"

    static func loadAPIKey() -> String {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne,
        ]
        var item: CFTypeRef?
        guard
            SecItemCopyMatching(query as CFDictionary, &item) == errSecSuccess,
            let data = item as? Data,
            let value = String(data: data, encoding: .utf8)
        else {
            return ""
        }
        return value
    }

    static func saveAPIKey(_ value: String) throws {
        let data = Data(value.utf8)
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrService as String: service,
            kSecAttrAccount as String: account,
        ]
        let attributes = [kSecValueData as String: data]
        let status = SecItemUpdate(
            query as CFDictionary,
            attributes as CFDictionary
        )
        if status == errSecItemNotFound {
            var newItem = query
            newItem[kSecValueData as String] = data
            let addStatus = SecItemAdd(newItem as CFDictionary, nil)
            guard addStatus == errSecSuccess else {
                throw NSError(domain: NSOSStatusErrorDomain, code: Int(addStatus))
            }
        } else if status != errSecSuccess {
            throw NSError(domain: NSOSStatusErrorDomain, code: Int(status))
        }
    }
}
