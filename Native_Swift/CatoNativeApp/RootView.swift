import SwiftUI
import CatoNativeCore

struct RootView: View {
    @StateObject private var auth = AuthViewModel()

    var body: some View {
        Group {
            switch auth.phase {
            case .loading:
                VStack(spacing: 12) {
                    ProgressView()
                    Text("Connecting to Cato")
                        .font(.subheadline.weight(.semibold))
                        .foregroundStyle(CatoTheme.muted)
                }
                .frame(maxWidth: .infinity, maxHeight: .infinity)
                .background(CatoTheme.background.ignoresSafeArea())
            case .signedIn(.recruiter):
                RecruiterShellView()
                    .environmentObject(auth)
            case .signedIn(.applicant):
                ApplicantOnboardingView()
                    .environmentObject(auth)
            case .signedOut:
                LoginView(auth: auth)
            }
        }
    }
}
