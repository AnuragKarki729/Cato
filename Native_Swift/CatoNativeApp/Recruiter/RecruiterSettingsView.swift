import SwiftUI
import CatoNativeCore

struct RecruiterSettingsView: View {
    @EnvironmentObject private var auth: AuthViewModel
    @State private var recruiter: RecruiterAccount?
    @State private var errorMessage: String?
    @State private var isLoading = true
    @State private var isConfirmingLogout = false
    @State private var isConfirmingDelete = false

    var body: some View {
        NavigationStack {
            Group {
                if isLoading {
                    CatoLoadingView(message: "Loading settings")
                } else {
                    ScrollView {
                        VStack(alignment: .leading, spacing: 16) {
                            VStack(alignment: .leading, spacing: 6) {
                                Text("Settings")
                                    .font(CatoTheme.screenTitle)
                                Text("Manage your recruiter account and company profile.")
                                    .font(CatoTheme.body)
                                    .foregroundStyle(CatoTheme.muted)
                            }

                            if let errorMessage {
                                Text(errorMessage)
                                    .font(.footnote.weight(.semibold))
                                    .foregroundStyle(.red)
                                    .padding(12)
                                    .frame(maxWidth: .infinity, alignment: .leading)
                                    .background(Color.red.opacity(0.08))
                                    .clipShape(RoundedRectangle(cornerRadius: 12))
                            }

                            CatoCard {
                                VStack(alignment: .leading, spacing: 14) {
                                    HStack(spacing: 12) {
                                        CandidateAvatar(name: recruiter?.name ?? recruiter?.email ?? "Recruiter", size: 54)
                                        VStack(alignment: .leading, spacing: 4) {
                                            Text(recruiter?.name?.isEmpty == false ? recruiter!.name! : "Recruiter")
                                                .font(CatoTheme.cardTitle)
                                            Text(recruiter?.email ?? auth.session?.user.email ?? "Email unavailable")
                                                .font(CatoTheme.small)
                                                .foregroundStyle(CatoTheme.muted)
                                        }
                                    }

                                    Divider()

                                    SettingsInfoRow(label: "Company", value: recruiter?.companyName ?? "Not set")
                                    SettingsInfoRow(label: "Plan", value: recruiter?.plan?.capitalized ?? "Not set")
                                    SettingsInfoRow(label: "Account ID", value: recruiter?.id ?? "Unavailable")
                                }
                            }

                            CatoCard {
                                VStack(alignment: .leading, spacing: 12) {
                                    Text("Account")
                                        .font(CatoTheme.cardTitle)
                                    Button {
                                        isConfirmingLogout = true
                                    } label: {
                                        Label("Log out", systemImage: "rectangle.portrait.and.arrow.right")
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.bordered)
                                    .tint(CatoTheme.purple)
                                    .disabled(auth.isWorking)

                                    Button(role: .destructive) {
                                        isConfirmingDelete = true
                                    } label: {
                                        Label("Delete account", systemImage: "trash")
                                            .frame(maxWidth: .infinity)
                                    }
                                    .buttonStyle(.bordered)
                                    .disabled(auth.isWorking)

                                    if auth.isWorking {
                                        HStack(spacing: 8) {
                                            ProgressView()
                                            Text("Updating account...")
                                                .font(CatoTheme.small)
                                                .foregroundStyle(CatoTheme.muted)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(CatoTheme.screenPadding)
                    }
                    .background(CatoTheme.background.ignoresSafeArea())
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .task {
                await loadRecruiter()
            }
            .alert("Log out?", isPresented: $isConfirmingLogout) {
                Button("Cancel", role: .cancel) {}
                Button("Log out", role: .destructive) {
                    auth.signOut()
                }
            } message: {
                Text("You will return to the login screen.")
            }
            .alert("Delete recruiter account?", isPresented: $isConfirmingDelete) {
                Button("Cancel", role: .cancel) {}
                Button("Delete account", role: .destructive) {
                    auth.deleteRecruiterAccount()
                }
            } message: {
                Text("This permanently removes your recruiter account, saved filters, bookmarks, reviews, interest requests, and messages.")
            }
        }
    }

    private func loadRecruiter() async {
        guard let apiClient = auth.catoAPIClient, let accessToken = auth.accessToken else {
            errorMessage = "Sign in again to load settings."
            isLoading = false
            return
        }

        isLoading = true
        errorMessage = nil

        do {
            recruiter = try await apiClient.getRecruiterDashboard(accessToken: accessToken).recruiter
        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }
}

private struct SettingsInfoRow: View {
    let label: String
    let value: String

    var body: some View {
        HStack(alignment: .top) {
            Text(label)
                .font(CatoTheme.small)
                .foregroundStyle(CatoTheme.muted)
            Spacer(minLength: 12)
            Text(value)
                .font(.caption.weight(.semibold))
                .foregroundStyle(CatoTheme.ink)
                .multilineTextAlignment(.trailing)
        }
    }
}
