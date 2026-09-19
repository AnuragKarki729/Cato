package com.cato.app.state

import com.cato.app.core.RecruiterMessage
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

class RecruiterContactStateTest {
    @Test
    fun contactStateUsesModeSpecificCopyAndDefaults() {
        val request = RecruiterContactState(candidateId = "c1", mode = RecruiterContactMode.REQUEST)
        val message = RecruiterContactState(candidateId = "c1", mode = RecruiterContactMode.MESSAGE)

        assertEquals("Send Interest Request", request.title)
        assertEquals("Your profile stood out for this opportunity.", request.bodyText)
        assertEquals("Message Candidate", message.title)
        assertEquals("Hi, I would love to connect about an opportunity.", message.bodyText)
        assertTrue(request.canSend)
        assertEquals("Send Interest Request", request.screenSpec.title)
        assertTrue(request.screenSpec.subtitle.contains("protects applicants from spam"))
        assertEquals("Candidate", request.screenSpec.candidateName)
        assertEquals("Send Interest Request", request.screenSpec.buttonTitle)
        assertTrue(request.screenSpec.canSend)
        assertEquals("Message Candidate", message.screenSpec.title)
        assertEquals("Send Message", message.screenSpec.buttonTitle)
    }

    @Test
    fun recruiterConversationRowsInsertUnreadDividerAndMarkRecruiterMessagesMine() {
        val state = RecruiterConversationState(
            candidateId = "c1",
            candidateName = "Zoe",
            messages = listOf(
                RecruiterMessage(
                    id = "m1",
                    candidateId = "c1",
                    senderRole = "applicant",
                    isUnreadForViewer = true,
                    body = "Hello",
                    createdAt = "2026-01-01",
                ),
                RecruiterMessage(
                    id = "m2",
                    candidateId = "c1",
                    senderRole = "recruiter",
                    body = "Hi",
                    createdAt = "2026-01-01",
                ),
            ),
            draft = "  reply  ",
        )

        assertEquals("Zoe", state.title)
        assertTrue(state.canSend)
        assertTrue(state.rows.first() is RecruiterConversationRow.UnreadDivider)
        val firstMessage = state.rows[1] as RecruiterConversationRow.Message
        val secondMessage = state.rows[2] as RecruiterConversationRow.Message
        assertFalse(firstMessage.spec.isMine)
        assertTrue(secondMessage.spec.isMine)

        val spec = state.screenSpec
        assertEquals("Zoe", spec.title)
        assertEquals("Loading conversation", spec.loadingMessage)
        assertEquals("Send", spec.sendButtonTitle)
        assertTrue(spec.canSend)
        assertEquals("m1", spec.firstUnreadMessageId)
    }

    @Test
    fun recruiterConversationUpsertsIncomingMessagesForSameCandidateOnly() {
        val state = RecruiterConversationState(
            candidateId = "c1",
            candidateName = "Candidate",
            messages = listOf(
                RecruiterMessage(
                    id = "m1",
                    candidateId = "c1",
                    candidateName = "Zoe",
                    senderRole = "applicant",
                    body = "Old",
                    createdAt = "2026-01-02",
                ),
            ),
        )

        val ignored = state.withIncomingMessage(
            RecruiterMessage(
                id = "other",
                candidateId = "c2",
                senderRole = "applicant",
                body = "Ignore",
                createdAt = "2026-01-01",
            )
        )
        val updated = state.withIncomingMessage(
            RecruiterMessage(
                id = "m1",
                candidateId = "c1",
                candidateName = "Zoe Chen",
                senderRole = "applicant",
                body = "Updated",
                createdAt = "2026-01-03",
            )
        ).withIncomingMessage(
            RecruiterMessage(
                id = "m2",
                candidateId = "c1",
                senderRole = "recruiter",
                body = "Earlier",
                createdAt = "2026-01-01",
            )
        )

        assertEquals(listOf("m1"), ignored.messages.map { it.id })
        assertEquals(listOf("m2", "m1"), updated.messages.map { it.id })
        assertEquals("Zoe Chen", updated.candidateName)
        assertEquals("Updated", updated.messages.last().body)
    }
}
