import SwiftUI

struct CandidateAvatar: View {
    let name: String
    let size: CGFloat

    var body: some View {
        RoundedRectangle(cornerRadius: size * 0.22)
            .fill(CatoTheme.purpleSoft)
            .frame(width: size, height: size)
            .overlay(
                Text(String(name.prefix(1)))
                    .font(.system(size: size * 0.34, weight: .bold))
                    .foregroundStyle(CatoTheme.purple)
            )
    }
}

struct MatchScoreBadge: View {
    let score: Int

    var body: some View {
        VStack(spacing: 2) {
            Text("\(score)%")
                .font(.headline.weight(.bold))
            Text("match")
                .font(.caption2.weight(.bold))
        }
        .foregroundStyle(CatoTheme.ink)
        .padding(.horizontal, 10)
        .padding(.vertical, 7)
        .background(CatoTheme.purpleSoft)
        .clipShape(RoundedRectangle(cornerRadius: 12))
    }
}

struct RecruiterEmptyStateView: View {
    let icon: String
    let title: String
    let message: String

    var body: some View {
        VStack(spacing: 12) {
            Image(systemName: icon)
                .font(.system(size: 40))
                .foregroundStyle(CatoTheme.purple)
            Text(title)
                .font(.system(size: 19, weight: .bold))
                .foregroundStyle(CatoTheme.ink)
            Text(message)
                .font(CatoTheme.body)
                .foregroundStyle(CatoTheme.muted)
                .multilineTextAlignment(.center)
        }
        .padding(CatoTheme.screenPadding)
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .background(CatoTheme.background.ignoresSafeArea())
    }
}
