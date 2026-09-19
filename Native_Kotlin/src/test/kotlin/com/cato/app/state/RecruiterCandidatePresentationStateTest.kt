package com.cato.app.state

import com.cato.app.core.ApplicantAccomplishment
import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterCandidateProfileMediaResponse
import com.cato.app.core.RecruiterInternship
import com.cato.app.core.RecruiterProject
import com.cato.app.core.RecruiterSoftSkill
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertTrue

class RecruiterCandidatePresentationStateTest {
    @Test
    fun recruiterResultsScreenSpecMirrorsSwiftListCopyAndRoutes() {
        val candidate = RecruiterCandidate(
            id = "c1",
            applicantId = "a1",
            name = "Zoe Chen",
            major = "Computer Science",
            universityName = "Stanford University",
            semesterLabel = "Sophomore / Semester 4",
            matchScore = 75,
            matchStrength = "strong_match",
            hasResume = true,
            hasDeeperSignal = true,
        )
        val state = RecruiterResultsState(
            title = "Tech interns",
            candidates = listOf(candidate),
        )

        val spec = state.screenSpec

        assertEquals("Tech interns", spec.title)
        assertEquals("Loading candidates", spec.loadingMessage)
        assertEquals("1 candidates", spec.countLabel)
        assertEquals("Sort", spec.sortLabel)
        assertEquals("arrow.up.arrow.down", spec.sortIconName)
        assertEquals("Filter", spec.filterLabel)
        assertEquals("line.3.horizontal.decrease.circle", spec.filterIconName)
        assertTrue(spec.helperText.contains("profile completeness"))
        assertEquals("No candidates found", spec.empty.title)
        assertEquals("Try adjusting the search or clearing filters.", spec.empty.message)
        assertEquals("View profile", spec.rows.single().viewProfileLabel)
        assertEquals(RecruiterRoute.CandidateReview("c1"), spec.rows.single().route)
    }

    @Test
    fun resultRowMirrorsSwiftCandidateSummary() {
        val candidate = RecruiterCandidate(
            id = "c1",
            applicantId = "a1",
            name = "Zoe Chen",
            major = "Computer Science",
            universityName = "Stanford University",
            semesterLabel = "Sophomore / Semester 4",
            matchScore = 75,
            matchStrength = "strong_match",
            hasResume = true,
            hasDeeperSignal = true,
            bookmarked = true,
            softSkills = listOf(
                RecruiterSoftSkill("Clarity", 4.2, "Clear answer", "high"),
                RecruiterSoftSkill("Ownership", 4.0, "Led work", "medium"),
            ),
        )

        val row = candidate.toResultRowSpec()

        assertEquals("Zoe Chen", row.displayName)
        assertEquals("Computer Science • Stanford University", row.subtitle)
        assertEquals("75%", row.matchScoreLabel)
        assertEquals("Strong match", row.matchStrengthLabel)
        assertEquals(listOf("Computer Science", "Sophomore / Semester 4", "Clarity"), row.tags)
        assertEquals("Resume", row.resumeLabel)
        assertEquals("Deeper signal", row.videoLabel)
        assertEquals("View profile", row.viewProfileLabel)
        assertEquals(RecruiterRoute.CandidateReview("c1"), row.route)
        assertTrue(row.bookmarked)
    }

    @Test
    fun candidateDetailHeaderAndMoreTabExposeRecruiterVisibleFacts() {
        val candidate = RecruiterCandidate(
            id = "c1",
            applicantId = "a1",
            name = "Zoe Chen",
            major = "Computer Science",
            universityName = "Stanford University",
            gpa = 3.8,
            profileStrength = 97,
            matchScore = 75,
            hasResume = true,
            projects = listOf(RecruiterProject(id = "p", title = "Portfolio", type = "built_project", description = "Built app")),
            internships = listOf(RecruiterInternship(id = "i", company = "Acme", roleDepartment = "Engineering", durationMonths = 3)),
        )
        val state = CandidateDetailState(candidate, selectedTab = CandidateDetailTab.MORE)

        assertEquals("Zoe Chen", state.header.displayName)
        assertTrue("Profile 97%" in state.header.factPills)
        assertTrue("GPA 3.80" in state.header.factPills)
        assertEquals(listOf("Projects", "Internships"), state.visibleSections.map { it.title })
    }

    @Test
    fun candidateDetailMoreTabIncludesAccomplishmentsFromProfileMedia() {
        val candidate = RecruiterCandidate(
            id = "c1",
            applicantId = "a1",
            name = "Zoe Chen",
            profileStrength = 85,
        )
        val media = RecruiterCandidateProfileMediaResponse(
            accomplishments = listOf(
                ApplicantAccomplishment(
                    id = "a1",
                    title = "Published campus research",
                    description = "Presented a data project",
                    linkUrl = "https://example.com/research",
                )
            )
        )

        val state = CandidateDetailState(
            candidate = candidate,
            selectedTab = CandidateDetailTab.MORE,
            profileMedia = media,
        )

        assertTrue("1 accomplishments" in state.header.factPills)
        assertEquals(listOf("Accomplishments"), state.visibleSections.map { it.title })
        assertEquals(listOf("Published campus research • Link available"), state.visibleSections.single().rows)
    }

    @Test
    fun candidateDetailOmitsUnavailableSectionsInsteadOfShowingNoDataPlaceholders() {
        val candidate = RecruiterCandidate(
            id = "c1",
            applicantId = "a1",
            name = "Zoe Chen",
            hasResume = false,
            tenSecondVideoUrl = null,
            thirtySecondVideoUrl = null,
        )

        assertEquals(emptyList(), CandidateDetailState(candidate, selectedTab = CandidateDetailTab.RESUME).visibleSections)
        assertEquals(emptyList(), CandidateDetailState(candidate, selectedTab = CandidateDetailTab.VIDEO).visibleSections)
        assertEquals(emptyList(), CandidateDetailState(candidate, selectedTab = CandidateDetailTab.MORE).visibleSections)
    }
}
