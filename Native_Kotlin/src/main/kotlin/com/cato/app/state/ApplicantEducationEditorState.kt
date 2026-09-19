package com.cato.app.state

import com.cato.app.core.ApplicantEducation
import com.cato.app.core.ApplicantEducationCommand
import com.cato.app.core.ApplicantProfileResponse

data class ApplicantSettingsSemester(
    val label: String,
    val shortLabel: String,
    val value: Int,
) {
    companion object {
        val options = listOf(
            ApplicantSettingsSemester("Freshman / Semester 1", "Freshman\nSem 1", 1),
            ApplicantSettingsSemester("Freshman / Semester 2", "Freshman\nSem 2", 2),
            ApplicantSettingsSemester("Sophomore / Semester 3", "Sophomore\nSem 3", 3),
            ApplicantSettingsSemester("Sophomore / Semester 4", "Sophomore\nSem 4", 4),
            ApplicantSettingsSemester("Junior / Semester 5", "Junior\nSem 5", 5),
            ApplicantSettingsSemester("Junior / Semester 6", "Junior\nSem 6", 6),
            ApplicantSettingsSemester("Senior / Semester 7", "Senior\nSem 7", 7),
            ApplicantSettingsSemester("Senior / Semester 8", "Senior\nSem 8", 8),
            ApplicantSettingsSemester("Year 5+ / Semester 9", "Year 5+ / Sem 9", 9),
            ApplicantSettingsSemester("Year 5+ / Semester 10", "Year 5+ / Sem 10", 10),
            ApplicantSettingsSemester("Graduating this semester", "Graduating", 99),
            ApplicantSettingsSemester("Graduated", "Graduated", 100),
        )

        fun fromEducation(education: ApplicantEducation?): ApplicantSettingsSemester {
            return options.firstOrNull { it.value == education?.semesterNumber } ?: options.first()
        }
    }
}

data class ApplicantEducationEditorState(
    val name: String,
    val universityName: String,
    val selectedSemester: ApplicantSettingsSemester,
    val gpa: String = "",
    val major: String = "",
    val minor: String = "",
    val originalEducation: ApplicantEducation? = null,
    val isSaving: Boolean = false,
    val errorMessage: String? = null,
) {
    val canSave: Boolean
        get() = !isSaving && name.trim().isNotEmpty() && universityName.trim().isNotEmpty() && gpaError == null

    val gpaError: String?
        get() {
            val trimmed = gpa.trim()
            if (trimmed.isEmpty()) return null
            val value = trimmed.toDoubleOrNull() ?: return "GPA must be between 0 and 4."
            return if (value in 0.0..4.0) null else "GPA must be between 0 and 4."
        }

    val parsedGpa: Double?
        get() = gpa.trim().takeIf { it.isNotEmpty() }?.toDoubleOrNull()

    val educationCommand: ApplicantEducationCommand
        get() = ApplicantEducationCommand(
            universityName = universityName.trim(),
            universityMatchedFromEmail = originalEducation?.universityMatchedFromEmail ?: false,
            semesterLabel = selectedSemester.label,
            semesterNumber = selectedSemester.value,
            gpa = parsedGpa,
            major = major.trim().takeIf { it.isNotBlank() },
            minor = minor.trim().takeIf { it.isNotBlank() },
        )

    fun clearOptionalFields(): ApplicantEducationEditorState {
        return copy(gpa = "", major = "", minor = "")
    }

    companion object {
        fun fromProfile(profile: ApplicantProfileResponse): ApplicantEducationEditorState {
            val education = profile.education
            return ApplicantEducationEditorState(
                name = profile.applicant.displayName,
                universityName = education?.universityName.orEmpty(),
                selectedSemester = ApplicantSettingsSemester.fromEducation(education),
                gpa = education?.gpa?.let { "%.2f".format(it) }.orEmpty(),
                major = education?.major.orEmpty(),
                minor = education?.minor.orEmpty(),
                originalEducation = education,
            )
        }
    }
}
