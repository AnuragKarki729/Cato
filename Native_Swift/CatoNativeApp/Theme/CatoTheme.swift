import SwiftUI

enum CatoTheme {
    static let ink = Color(red: 0.05, green: 0.05, blue: 0.18)
    static let muted = Color(red: 0.42, green: 0.43, blue: 0.55)
    static let purple = Color(red: 0.35, green: 0.18, blue: 0.76)
    static let purpleDeep = Color(red: 0.19, green: 0.10, blue: 0.48)
    static let purpleSoft = Color(red: 0.94, green: 0.91, blue: 1.0)
    static let lavender = Color(red: 0.97, green: 0.95, blue: 1.0)
    static let background = Color(red: 0.97, green: 0.98, blue: 1.0)
    static let card = Color.white
    static let border = Color(red: 0.88, green: 0.88, blue: 0.94)

    static let corner: CGFloat = 16
    static let spacing: CGFloat = 14
    static let screenPadding: CGFloat = 16

    static let screenTitle = Font.system(size: 28, weight: .bold, design: .default)
    static let sectionTitle = Font.system(size: 16, weight: .bold, design: .default)
    static let cardTitle = Font.system(size: 15, weight: .bold, design: .default)
    static let body = Font.system(size: 14, weight: .regular, design: .default)
    static let small = Font.system(size: 12, weight: .regular, design: .default)
}

extension LinearGradient {
    static var catoPurple: LinearGradient {
        LinearGradient(
            colors: [CatoTheme.purple, CatoTheme.purpleDeep],
            startPoint: .topLeading,
            endPoint: .bottomTrailing
        )
    }
}

struct CatoPrimaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.bold))
            .foregroundStyle(.white)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(CatoTheme.purple.opacity(configuration.isPressed ? 0.82 : 1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct CatoSecondaryButtonStyle: ButtonStyle {
    func makeBody(configuration: Configuration) -> some View {
        configuration.label
            .font(.subheadline.weight(.bold))
            .foregroundStyle(CatoTheme.ink)
            .frame(maxWidth: .infinity)
            .padding(.vertical, 12)
            .background(CatoTheme.purpleSoft.opacity(configuration.isPressed ? 0.72 : 1))
            .clipShape(RoundedRectangle(cornerRadius: 12))
            .overlay(
                RoundedRectangle(cornerRadius: 12)
                    .stroke(CatoTheme.purple.opacity(0.24), lineWidth: 1)
            )
    }
}

struct CatoCard<Content: View>: View {
    let content: Content

    init(@ViewBuilder content: () -> Content) {
        self.content = content()
    }

    var body: some View {
        content
            .padding(14)
            .foregroundStyle(CatoTheme.ink)
            .background(CatoTheme.card)
            .clipShape(RoundedRectangle(cornerRadius: CatoTheme.corner))
            .overlay(
                RoundedRectangle(cornerRadius: CatoTheme.corner)
                    .stroke(CatoTheme.border, lineWidth: 1)
            )
    }
}

struct CatoLeafMark: View {
    var size: CGFloat = 22

    var body: some View {
        Image("CatoLeaf")
            .resizable()
            .scaledToFit()
            .frame(width: size, height: size)
            .accessibilityHidden(true)
    }
}

struct CatoWordmark: View {
    var fontSize: CGFloat = 30
    var leafSize: CGFloat = 24

    var body: some View {
        HStack(spacing: 5) {
            Text("Cato")
                .font(.system(size: fontSize, weight: .bold))
            CatoLeafMark(size: leafSize)
        }
        .foregroundStyle(CatoTheme.ink)
    }
}

struct CatoLoadingView: View {
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            ZStack {
                ProgressView()
                    .controlSize(.large)
                    .tint(CatoTheme.purple)
                CatoLeafMark(size: 18)
            }
            Text(message)
                .font(CatoTheme.body.weight(.semibold))
                .foregroundStyle(CatoTheme.muted)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

enum CatoDateText {
    private static let isoFormatterWithFractions: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime, .withFractionalSeconds]
        return formatter
    }()

    private static let isoFormatter: ISO8601DateFormatter = {
        let formatter = ISO8601DateFormatter()
        formatter.formatOptions = [.withInternetDateTime]
        return formatter
    }()

    private static let timeFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "h:mm a"
        return formatter
    }()

    private static let shortDateFormatter: DateFormatter = {
        let formatter = DateFormatter()
        formatter.dateFormat = "MMM d"
        return formatter
    }()

    static func chatTimestamp(_ value: String) -> String {
        guard let date = isoFormatterWithFractions.date(from: value) ?? isoFormatter.date(from: value) else {
            return String(value.prefix(10))
        }

        let calendar = Calendar.current
        let time = timeFormatter.string(from: date)

        if calendar.isDateInToday(date) {
            return "Today, \(time)"
        }

        if calendar.isDateInYesterday(date) {
            return "Yesterday, \(time)"
        }

        return "\(shortDateFormatter.string(from: date)), \(time)"
    }
}
