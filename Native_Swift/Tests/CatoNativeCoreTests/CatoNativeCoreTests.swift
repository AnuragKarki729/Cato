import XCTest
@testable import CatoNativeCore

final class CatoNativeCoreTests: XCTestCase {
    func testDashboardFixtureHasLaunchMetrics() {
        let dashboard = CatoFixtures.dashboard

        XCTAssertEqual(dashboard.newMatches, 128)
        XCTAssertEqual(dashboard.bookmarked, 36)
        XCTAssertFalse(dashboard.quickSearches.isEmpty)
    }

    func testCandidateFixtureUsesMatchSignals() {
        let candidate = CatoFixtures.candidates[0]

        XCTAssertEqual(candidate.matchStrength, "Strong Match")
        XCTAssertGreaterThan(candidate.matchScore, 80)
        XCTAssertTrue(candidate.tags.contains("Python"))
    }
}
