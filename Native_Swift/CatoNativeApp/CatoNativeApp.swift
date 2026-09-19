import SwiftUI
import UIKit

@main
struct CatoNativeApp: App {
    var body: some Scene {
        WindowGroup {
            RootView()
                .tint(CatoTheme.purple)
                .preferredColorScheme(.light)
                .onAppear {
                    KeyboardDismissInstaller.shared.install()
                }
        }
    }
}

final class KeyboardDismissInstaller: NSObject, UIGestureRecognizerDelegate {
    static let shared = KeyboardDismissInstaller()
    private let gestureName = "CatoKeyboardDismissTap"

    func install() {
        UIApplication.shared.connectedScenes
            .compactMap { $0 as? UIWindowScene }
            .flatMap(\.windows)
            .forEach { window in
                guard window.gestureRecognizers?.contains(where: { $0.name == gestureName }) != true else {
                    return
                }

                let recognizer = UITapGestureRecognizer(target: self, action: #selector(dismissKeyboard))
                recognizer.name = gestureName
                recognizer.cancelsTouchesInView = false
                recognizer.delegate = self
                window.addGestureRecognizer(recognizer)
            }
    }

    @objc private func dismissKeyboard() {
        UIApplication.shared.sendAction(#selector(UIResponder.resignFirstResponder), to: nil, from: nil, for: nil)
    }

    func gestureRecognizer(_ gestureRecognizer: UIGestureRecognizer, shouldReceive touch: UITouch) -> Bool {
        var view: UIView? = touch.view

        while let currentView = view {
            if currentView is UITextField || currentView is UITextView || currentView is UISearchBar {
                return false
            }

            view = currentView.superview
        }

        return true
    }
}

final class KeyboardVisibilityObserver: ObservableObject {
    @Published var isKeyboardVisible = false
    private var observers: [NSObjectProtocol] = []

    init() {
        let center = NotificationCenter.default
        observers = [
            center.addObserver(
                forName: UIResponder.keyboardWillShowNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.isKeyboardVisible = true
            },
            center.addObserver(
                forName: UIResponder.keyboardWillHideNotification,
                object: nil,
                queue: .main
            ) { [weak self] _ in
                self?.isKeyboardVisible = false
            }
        ]
    }

    deinit {
        observers.forEach(NotificationCenter.default.removeObserver)
    }
}
