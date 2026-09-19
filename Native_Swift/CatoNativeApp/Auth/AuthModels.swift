import Foundation
import CatoNativeCore

struct AuthSession: Codable, Equatable {
    let accessToken: String
    let refreshToken: String
    let expiresAt: Date
    let user: SupabaseUser

    var isExpired: Bool {
        Date().addingTimeInterval(60) >= expiresAt
    }
}

struct SupabaseUser: Codable, Equatable {
    let id: String
    let email: String?
}

struct AuthRoleResponse: Decodable {
    let role: CatoRole?
}

struct AuthRoleClaimResponse: Decodable {
    let role: CatoRole
}

struct SupabaseAuthResponse: Decodable {
    let accessToken: String
    let refreshToken: String
    let expiresIn: Int
    let user: SupabaseUser

    enum CodingKeys: String, CodingKey {
        case accessToken = "access_token"
        case refreshToken = "refresh_token"
        case expiresIn = "expires_in"
        case user
    }

    func session() -> AuthSession {
        AuthSession(
            accessToken: accessToken,
            refreshToken: refreshToken,
            expiresAt: Date().addingTimeInterval(TimeInterval(expiresIn)),
            user: user
        )
    }
}

struct SupabaseErrorResponse: Decodable {
    let error: String?
    let errorDescription: String?
    let msg: String?
    let message: String?
    let code: String?

    enum CodingKeys: String, CodingKey {
        case error
        case errorDescription = "error_description"
        case msg
        case message
        case code
    }

    var bestMessage: String {
        errorDescription ?? message ?? msg ?? error ?? code ?? "Supabase request failed"
    }
}

struct APIErrorResponse: Decodable {
    let error: String?
    let message: String?

    var bestMessage: String {
        error ?? message ?? "API request failed"
    }
}
