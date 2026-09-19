import AuthenticationServices
import Foundation
import CatoNativeCore

@MainActor
final class AuthViewModel: ObservableObject {
    enum Phase: Equatable {
        case loading
        case signedOut
        case signedIn(CatoRole)
    }

    @Published private(set) var phase: Phase = .loading
    @Published private(set) var session: AuthSession?
    @Published var errorMessage: String?
    @Published var isWorking = false

    private let store = AuthSessionStore()
    private var authClient: SupabaseAuthClient?
    private var apiClient: CatoAPIClient?
    private var currentNonce: String?
    private var googleOAuthSession: GoogleOAuthSession?

    init() {
        Task {
            await bootstrap()
        }
    }

    var accessToken: String? {
        session?.accessToken
    }

    var catoAPIClient: CatoAPIClient? {
        apiClient
    }

    func bootstrap() async {
        do {
            let config = try CatoConfig.load()
            authClient = SupabaseAuthClient(config: config)
            apiClient = CatoAPIClient(config: config)

            guard var loadedSession = store.load() else {
                phase = .signedOut
                return
            }

            if loadedSession.isExpired {
                loadedSession = try await requireAuthClient().refreshSession(refreshToken: loadedSession.refreshToken)
                store.save(loadedSession)
            }

            session = loadedSession
            try await resolveRole(for: loadedSession, fallbackRole: nil)
        } catch {
            store.clear()
            session = nil
            errorMessage = error.localizedDescription
            phase = .signedOut
        }
    }

    func signInWithPassword(email: String, password: String, selectedRole: CatoRole) {
        Task {
            await runAuthAction {
                let authSession = try await self.requireAuthClient().signInWithPassword(email: email, password: password)
                try await self.completeSignIn(authSession, selectedRole: selectedRole)
            }
        }
    }

    func prepareAppleRequest(_ request: ASAuthorizationAppleIDRequest) {
        let rawNonce = AppleNonce.randomString()
        currentNonce = rawNonce
        request.requestedScopes = [.fullName, .email]
        request.nonce = AppleNonce.sha256(rawNonce)
    }

    func handleAppleCompletion(
        _ result: Result<ASAuthorization, Error>,
        selectedRole: CatoRole
    ) {
        Task {
            await runAuthAction {
                switch result {
                case .failure(let error):
                    if let authorizationError = error as? ASAuthorizationError,
                       authorizationError.code == .canceled {
                        return
                    }
                    throw error
                case .success(let authorization):
                    guard let credential = authorization.credential as? ASAuthorizationAppleIDCredential else {
                        throw AuthFlowError.missingAppleCredential
                    }
                    guard let tokenData = credential.identityToken,
                          let identityToken = String(data: tokenData, encoding: .utf8) else {
                        throw AuthFlowError.missingAppleToken
                    }
                    guard let rawNonce = self.currentNonce else {
                        throw AuthFlowError.missingAppleNonce
                    }

                    let authSession = try await self.requireAuthClient().signInWithApple(
                        identityToken: identityToken,
                        rawNonce: rawNonce
                    )

                    if let fullName = self.fullName(from: credential.fullName), !fullName.isEmpty {
                        try? await self.requireAuthClient().updateUserName(
                            accessToken: authSession.accessToken,
                            fullName: fullName
                        )
                    }

                    try await self.completeSignIn(authSession, selectedRole: selectedRole)
                }
            }
        }
    }

    func signInWithGoogle(selectedRole: CatoRole) {
        Task {
            await runAuthAction {
                let codeVerifier = OAuthPKCE.codeVerifier()
                let codeChallenge = OAuthPKCE.codeChallenge(for: codeVerifier)
                let redirectTo = "cato://auth/callback"
                let authorizeURL = try self.requireAuthClient().googleOAuthURL(
                    redirectTo: redirectTo,
                    codeChallenge: codeChallenge
                )
                let oauthSession = GoogleOAuthSession()
                self.googleOAuthSession = oauthSession
                let callbackURL = try await oauthSession.start(
                    url: authorizeURL,
                    callbackScheme: "cato"
                )
                self.googleOAuthSession = nil

                let callback = URLComponents(url: callbackURL, resolvingAgainstBaseURL: false)

                if let errorDescription = callback?.queryItems?.first(where: { $0.name == "error_description" })?.value {
                    throw GoogleOAuthError.providerError(errorDescription)
                }

                guard let code = callback?.queryItems?.first(where: { $0.name == "code" })?.value else {
                    throw GoogleOAuthError.missingCode
                }

                let authSession = try await self.requireAuthClient().exchangePKCECode(
                    code: code,
                    codeVerifier: codeVerifier
                )
                try await self.completeSignIn(authSession, selectedRole: selectedRole)
            }
        }
    }

    func signOut() {
        store.clear()
        session = nil
        phase = .signedOut
    }

    func deleteApplicantAccount() {
        Task {
            await runAuthAction {
                guard let session = self.session else {
                    throw AuthFlowError.missingSession
                }

                try await self.requireAPIClient().deleteApplicantAccount(accessToken: session.accessToken)
                self.store.clear()
                self.session = nil
                self.phase = .signedOut
            }
        }
    }

    func deleteRecruiterAccount() {
        Task {
            await runAuthAction {
                guard let session = self.session else {
                    throw AuthFlowError.missingSession
                }

                try await self.requireAPIClient().deleteRecruiterAccount(accessToken: session.accessToken)
                self.store.clear()
                self.session = nil
                self.phase = .signedOut
            }
        }
    }

    private func runAuthAction(_ action: @escaping () async throws -> Void) async {
        isWorking = true
        errorMessage = nil
        defer {
            isWorking = false
        }

        do {
            try await action()
        } catch {
            errorMessage = error.localizedDescription
        }
    }

    private func completeSignIn(_ authSession: AuthSession, selectedRole: CatoRole) async throws {
        store.save(authSession)
        session = authSession
        try await resolveRole(for: authSession, fallbackRole: selectedRole)
    }

    private func resolveRole(for authSession: AuthSession, fallbackRole: CatoRole?) async throws {
        let apiClient = try requireAPIClient()
        var role = try await apiClient.getRole(accessToken: authSession.accessToken)

        if role == nil, let fallbackRole {
            role = try await apiClient.claimRole(fallbackRole, accessToken: authSession.accessToken)
        }

        guard let resolvedRole = role else {
            phase = .signedOut
            throw AuthFlowError.missingRole
        }

        try await apiClient.syncRole(resolvedRole, accessToken: authSession.accessToken)
        phase = .signedIn(resolvedRole)
    }

    private func requireAuthClient() throws -> SupabaseAuthClient {
        guard let authClient else {
            throw AuthFlowError.clientNotConfigured
        }
        return authClient
    }

    private func requireAPIClient() throws -> CatoAPIClient {
        guard let apiClient else {
            throw AuthFlowError.clientNotConfigured
        }
        return apiClient
    }

    private func fullName(from components: PersonNameComponents?) -> String? {
        guard let components else {
            return nil
        }

        return [components.givenName, components.middleName, components.familyName]
            .compactMap { $0 }
            .joined(separator: " ")
            .trimmingCharacters(in: .whitespacesAndNewlines)
    }
}

enum AuthFlowError: LocalizedError {
    case clientNotConfigured
    case missingAppleCredential
    case missingAppleToken
    case missingAppleNonce
    case missingRole
    case missingSession

    var errorDescription: String? {
        switch self {
        case .clientNotConfigured:
            return "Auth is not configured yet."
        case .missingAppleCredential:
            return "Apple did not return a usable credential."
        case .missingAppleToken:
            return "Apple did not return an identity token."
        case .missingAppleNonce:
            return "Apple sign-in nonce was lost. Try again."
        case .missingRole:
            return "Choose applicant or recruiter before signing in."
        case .missingSession:
            return "Sign in again before deleting this account."
        }
    }
}
