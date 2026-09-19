import AuthenticationServices
import SwiftUI
import CatoNativeCore

struct LoginView: View {
    @ObservedObject var auth: AuthViewModel
    @State private var email = ""
    @State private var password = ""
    @State private var selectedRole: CatoRole = .recruiter

    var body: some View {
        NavigationStack {
            VStack(spacing: 26) {
                Spacer()

                CatoWordmark(fontSize: 44, leafSize: 34)

                Text("From search to strong shortlists.")
                    .font(.subheadline)
                    .foregroundStyle(CatoTheme.muted)

                VStack(spacing: 14) {
                    RoleSegmentedPill(selectedRole: $selectedRole)

                    LoginTextField(
                        placeholder: "Email",
                        text: $email,
                        contentType: .emailAddress,
                        keyboardType: .emailAddress
                    )

                    LoginTextField(
                        placeholder: "Password",
                        text: $password,
                        contentType: .password,
                        isSecure: true
                    )

                    Button {
                        auth.signInWithPassword(
                            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                            password: password,
                            selectedRole: selectedRole
                        )
                    } label: {
                        if auth.isWorking {
                            ProgressView()
                                .tint(.white)
                        } else {
                            Text("Login")
                        }
                    }
                    .buttonStyle(CatoPrimaryButtonStyle())
                    .disabled(auth.isWorking)

                    SignInWithAppleButton(.continue) { request in
                        auth.prepareAppleRequest(request)
                    } onCompletion: { result in
                        auth.handleAppleCompletion(result, selectedRole: selectedRole)
                    }
                    .signInWithAppleButtonStyle(.black)
                    .frame(height: 52)
                    .clipShape(RoundedRectangle(cornerRadius: 14))

                    Button {
                        auth.signInWithGoogle(selectedRole: selectedRole)
                    } label: {
                        HStack(spacing: 10) {
                            Image(systemName: "g.circle.fill")
                                .font(.title3)
                            Text("Continue with Google")
                                .font(.headline)
                        }
                        .foregroundStyle(CatoTheme.ink)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 15)
                        .background(CatoTheme.card)
                        .clipShape(RoundedRectangle(cornerRadius: 14))
                        .overlay(
                            RoundedRectangle(cornerRadius: 14)
                                .stroke(CatoTheme.border, lineWidth: 1)
                        )
                    }
                    .disabled(auth.isWorking)

                    if let errorMessage = auth.errorMessage {
                        Text(errorMessage)
                            .font(.footnote.weight(.semibold))
                            .foregroundStyle(.red)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                }

                Spacer()

                Text("Better hires, brighter futures.")
                    .font(.footnote)
                    .foregroundStyle(CatoTheme.muted)
            }
            .padding(24)
            .background(CatoTheme.background.ignoresSafeArea())
        }
    }
}

private struct RoleSegmentedPill: View {
    @Binding var selectedRole: CatoRole

    var body: some View {
        NativeRoleSegmentedControl(selectedRole: $selectedRole)
            .frame(height: 58)
            .background(Color.gray.opacity(0.18))
            .clipShape(Capsule())
            .overlay(
                Capsule()
                    .stroke(CatoTheme.border, lineWidth: 1)
            )
    }
}

private struct NativeRoleSegmentedControl: UIViewRepresentable {
    @Binding var selectedRole: CatoRole

    func makeUIView(context: Context) -> UISegmentedControl {
        let control = UISegmentedControl(items: ["Recruiter", "Applicant"])
        control.selectedSegmentIndex = selectedRole == .recruiter ? 0 : 1
        control.selectedSegmentTintColor = UIColor(CatoTheme.purple)
        control.backgroundColor = UIColor.clear
        control.setTitleTextAttributes(
            [
                .foregroundColor: UIColor.darkGray,
                .font: UIFont.systemFont(ofSize: 15, weight: .bold)
            ],
            for: .normal
        )
        control.setTitleTextAttributes(
            [
                .foregroundColor: UIColor.white,
                .font: UIFont.systemFont(ofSize: 15, weight: .bold)
            ],
            for: .selected
        )
        control.addTarget(context.coordinator, action: #selector(Coordinator.valueChanged(_:)), for: .valueChanged)
        return control
    }

    func updateUIView(_ control: UISegmentedControl, context: Context) {
        let index = selectedRole == .recruiter ? 0 : 1
        if control.selectedSegmentIndex != index {
            control.selectedSegmentIndex = index
        }
    }

    func makeCoordinator() -> Coordinator {
        Coordinator(selectedRole: $selectedRole)
    }

    final class Coordinator: NSObject {
        @Binding private var selectedRole: CatoRole

        init(selectedRole: Binding<CatoRole>) {
            _selectedRole = selectedRole
        }

        @objc func valueChanged(_ sender: UISegmentedControl) {
            selectedRole = sender.selectedSegmentIndex == 0 ? .recruiter : .applicant
        }
    }
}

private struct LoginTextField: View {
    let placeholder: String
    @Binding var text: String
    var contentType: UITextContentType?
    var keyboardType: UIKeyboardType = .default
    var isSecure = false

    var body: some View {
        Group {
            if isSecure {
                SecureField("", text: $text, prompt: Text(placeholder).foregroundColor(.gray))
                    .textContentType(contentType)
            } else {
                TextField("", text: $text, prompt: Text(placeholder).foregroundColor(.gray))
                    .textContentType(contentType)
                    .textInputAutocapitalization(.never)
                    .keyboardType(keyboardType)
            }
        }
        .foregroundStyle(CatoTheme.ink)
        .font(.body.weight(.semibold))
        .padding()
        .background(CatoTheme.card)
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(CatoTheme.border, lineWidth: 1)
        )
    }
}
