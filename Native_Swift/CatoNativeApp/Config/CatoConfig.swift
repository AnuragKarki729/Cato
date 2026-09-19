import Foundation

struct CatoConfig {
    let supabaseURL: URL
    let supabaseAnonKey: String
    let apiBaseURL: URL

    static func load() throws -> CatoConfig {
        let supabaseURL = try urlValue(
            environmentKey: "CATO_SUPABASE_URL",
            infoKey: "CatoSupabaseURL"
        )
        let supabaseAnonKey = try stringValue(
            environmentKey: "CATO_SUPABASE_ANON_KEY",
            infoKey: "CatoSupabaseAnonKey"
        )
        let apiBaseURL = try urlValue(
            environmentKey: "CATO_API_BASE_URL",
            infoKey: "CatoAPIBaseURL"
        )

        return CatoConfig(
            supabaseURL: supabaseURL,
            supabaseAnonKey: supabaseAnonKey,
            apiBaseURL: apiBaseURL
        )
    }

    private static func stringValue(environmentKey: String, infoKey: String) throws -> String {
        if let value = ProcessInfo.processInfo.environment[environmentKey]?.trimmingCharacters(in: .whitespacesAndNewlines),
           !value.isEmpty {
            return value
        }

        if let value = Bundle.main.object(forInfoDictionaryKey: infoKey) as? String {
            let trimmed = value.trimmingCharacters(in: .whitespacesAndNewlines)
            if !trimmed.isEmpty, !trimmed.hasPrefix("$(") {
                return trimmed
            }
        }

        throw CatoConfigError.missingValue(environmentKey)
    }

    private static func urlValue(environmentKey: String, infoKey: String) throws -> URL {
        let value = try stringValue(environmentKey: environmentKey, infoKey: infoKey)

        guard let url = URL(string: value) else {
            throw CatoConfigError.invalidURL(environmentKey)
        }

        return url
    }
}

enum CatoConfigError: LocalizedError {
    case missingValue(String)
    case invalidURL(String)

    var errorDescription: String? {
        switch self {
        case .missingValue(let key):
            return "Missing \(key). Add it to the CatoNative scheme environment or Info.plist."
        case .invalidURL(let key):
            return "\(key) must be a valid URL."
        }
    }
}
