import CryptoKit
import Foundation
import Security

enum OAuthPKCE {
    static func codeVerifier(length: Int = 64) -> String {
        precondition((43...128).contains(length))
        let charset = Array("0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz-._~")
        var result = ""

        while result.count < length {
            var random: UInt8 = 0
            let status = SecRandomCopyBytes(kSecRandomDefault, 1, &random)

            if status != errSecSuccess {
                fatalError("Unable to generate a secure PKCE verifier.")
            }

            if random < charset.count {
                result.append(charset[Int(random)])
            }
        }

        return result
    }

    static func codeChallenge(for verifier: String) -> String {
        let digest = SHA256.hash(data: Data(verifier.utf8))
        return Data(digest).base64URLEncodedString()
    }
}

private extension Data {
    func base64URLEncodedString() -> String {
        base64EncodedString()
            .replacingOccurrences(of: "+", with: "-")
            .replacingOccurrences(of: "/", with: "_")
            .replacingOccurrences(of: "=", with: "")
    }
}
