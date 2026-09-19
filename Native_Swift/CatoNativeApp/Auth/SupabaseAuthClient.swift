import Foundation

final class SupabaseAuthClient {
    private let baseURL: URL
    private let anonKey: String
    private let session: URLSession
    private let decoder = JSONDecoder()

    init(config: CatoConfig, session: URLSession = .shared) {
        self.baseURL = config.supabaseURL
        self.anonKey = config.supabaseAnonKey
        self.session = session
    }

    func signInWithPassword(email: String, password: String) async throws -> AuthSession {
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/token",
            queryItems: [URLQueryItem(name: "grant_type", value: "password")],
            method: "POST",
            body: [
                "email": email,
                "password": password
            ],
            accessToken: nil
        )

        return response.session()
    }

    func signInWithApple(identityToken: String, rawNonce: String) async throws -> AuthSession {
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/token",
            queryItems: [URLQueryItem(name: "grant_type", value: "id_token")],
            method: "POST",
            body: [
                "provider": "apple",
                "id_token": identityToken,
                "nonce": rawNonce
            ],
            accessToken: nil
        )

        return response.session()
    }

    func googleOAuthURL(
        redirectTo: String,
        codeChallenge: String
    ) throws -> URL {
        var components = URLComponents(url: endpoint("/auth/v1/authorize"), resolvingAgainstBaseURL: false)
        components?.queryItems = [
            URLQueryItem(name: "provider", value: "google"),
            URLQueryItem(name: "redirect_to", value: redirectTo),
            URLQueryItem(name: "code_challenge", value: codeChallenge),
            URLQueryItem(name: "code_challenge_method", value: "s256"),
            URLQueryItem(name: "prompt", value: "select_account")
        ]

        guard let url = components?.url else {
            throw SupabaseClientError.invalidURL
        }

        return url
    }

    func exchangePKCECode(code: String, codeVerifier: String) async throws -> AuthSession {
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/token",
            queryItems: [URLQueryItem(name: "grant_type", value: "pkce")],
            method: "POST",
            body: [
                "auth_code": code,
                "code_verifier": codeVerifier
            ],
            accessToken: nil
        )

        return response.session()
    }

    func refreshSession(refreshToken: String) async throws -> AuthSession {
        let response: SupabaseAuthResponse = try await request(
            path: "/auth/v1/token",
            queryItems: [URLQueryItem(name: "grant_type", value: "refresh_token")],
            method: "POST",
            body: ["refresh_token": refreshToken],
            accessToken: nil
        )

        return response.session()
    }

    func updateUserName(accessToken: String, fullName: String) async throws {
        let _: EmptySupabaseResponse = try await request(
            path: "/auth/v1/user",
            queryItems: [],
            method: "PUT",
            body: [
                "data": [
                    "full_name": fullName,
                    "name": fullName
                ]
            ],
            accessToken: accessToken
        )
    }

    private func request<Response: Decodable>(
        path: String,
        queryItems: [URLQueryItem],
        method: String,
        body: [String: Any],
        accessToken: String?
    ) async throws -> Response {
        var components = URLComponents(url: endpoint(path), resolvingAgainstBaseURL: false)
        components?.queryItems = queryItems.isEmpty ? nil : queryItems

        guard let url = components?.url else {
            throw SupabaseClientError.invalidURL
        }

        var request = URLRequest(url: url)
        request.httpMethod = method
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue(anonKey, forHTTPHeaderField: "apikey")
        request.setValue("Bearer \(accessToken ?? anonKey)", forHTTPHeaderField: "Authorization")
        request.httpBody = try JSONSerialization.data(withJSONObject: body)

        let (data, response) = try await session.data(for: request)
        guard let httpResponse = response as? HTTPURLResponse else {
            throw SupabaseClientError.invalidResponse
        }

        guard (200..<300).contains(httpResponse.statusCode) else {
            if let parsed = try? decoder.decode(SupabaseErrorResponse.self, from: data) {
                throw SupabaseClientError.requestFailed("\(parsed.bestMessage) (\(httpResponse.statusCode))")
            }

            if let body = String(data: data, encoding: .utf8),
               !body.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty {
                throw SupabaseClientError.requestFailed("\(body) (\(httpResponse.statusCode))")
            }
            throw SupabaseClientError.requestFailed("Supabase request failed: \(httpResponse.statusCode)")
        }

        if Response.self == EmptySupabaseResponse.self, data.isEmpty {
            return EmptySupabaseResponse() as! Response
        }

        do {
            return try decoder.decode(Response.self, from: data)
        } catch {
            if let body = String(data: data, encoding: .utf8) {
                throw SupabaseClientError.requestFailed("Could not decode Supabase response: \(body)")
            }
            throw error
        }
    }

    private func endpoint(_ path: String) -> URL {
        baseURL.appendingPathComponent(path.trimmingCharacters(in: CharacterSet(charactersIn: "/")))
    }
}

struct EmptySupabaseResponse: Decodable {}

enum SupabaseClientError: LocalizedError {
    case invalidURL
    case invalidResponse
    case requestFailed(String)

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Supabase URL could not be built."
        case .invalidResponse:
            return "Supabase returned an invalid response."
        case .requestFailed(let message):
            return message
        }
    }
}
