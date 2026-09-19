import AuthenticationServices
import Foundation
import UIKit

@MainActor
final class GoogleOAuthSession: NSObject, ASWebAuthenticationPresentationContextProviding {
    private var session: ASWebAuthenticationSession?

    func start(url: URL, callbackScheme: String) async throws -> URL {
        try await withCheckedThrowingContinuation { continuation in
            let session = ASWebAuthenticationSession(
                url: url,
                callbackURLScheme: callbackScheme
            ) { callbackURL, error in
                if let error {
                    if let authError = error as? ASWebAuthenticationSessionError,
                       authError.code == .canceledLogin {
                        continuation.resume(throwing: GoogleOAuthError.cancelled)
                        return
                    }

                    continuation.resume(throwing: error)
                    return
                }

                guard let callbackURL else {
                    continuation.resume(throwing: GoogleOAuthError.missingCallbackURL)
                    return
                }

                continuation.resume(returning: callbackURL)
            }

            session.presentationContextProvider = self
            session.prefersEphemeralWebBrowserSession = false
            self.session = session

            if !session.start() {
                continuation.resume(throwing: GoogleOAuthError.couldNotStart)
            }
        }
    }

    func presentationAnchor(for session: ASWebAuthenticationSession) -> ASPresentationAnchor {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .first { $0.isKeyWindow } ?? ASPresentationAnchor()
    }
}

enum GoogleOAuthError: LocalizedError {
    case cancelled
    case couldNotStart
    case missingCallbackURL
    case missingCode
    case providerError(String)

    var errorDescription: String? {
        switch self {
        case .cancelled:
            return "Google sign-in was cancelled."
        case .couldNotStart:
            return "Google sign-in could not be started."
        case .missingCallbackURL:
            return "Google sign-in did not return to Cato."
        case .missingCode:
            return "Google sign-in did not return an auth code."
        case .providerError(let message):
            return message
        }
    }
}
