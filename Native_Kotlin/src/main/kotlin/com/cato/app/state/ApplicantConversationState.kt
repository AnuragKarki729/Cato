package com.cato.app.state

import com.cato.app.core.ApplicantConversationMessage
import com.cato.app.core.ApplicantInterestRequest

data class ApplicantConversationState(
    val request: ApplicantInterestRequest,
    val messages: List<ApplicantConversationMessage> = emptyList(),
    val draft: String = "",
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val errorMessage: String? = null,
) {
    val screenSpec: ApplicantConversationScreenSpec
        get() = ApplicantConversationScreenSpec(
            title = request.displayCompany,
            subtitle = request.recruiterName ?: "Recruiting team",
            loadingMessage = "Loading conversation",
            emptyMessage = "Messages will appear here after this request is accepted.",
            draft = draft,
            sendButtonTitle = if (isSending) "Sending..." else "Send",
            canSend = canSend,
            rows = rows,
            firstUnreadMessageId = firstUnreadMessageId,
        )

    val trimmedDraft: String
        get() = draft.trim()

    val canSend: Boolean
        get() = !isSending && trimmedDraft.isNotEmpty()

    val firstUnreadMessageId: String?
        get() = messages.firstOrNull { it.isUnreadForViewer == true }?.id

    val rows: List<ApplicantConversationRow>
        get() = buildList {
            for (message in messages) {
                if (message.id == firstUnreadMessageId) {
                    add(ApplicantConversationRow.UnreadDivider)
                }
                add(ApplicantConversationRow.Message(message.toBubbleSpec()))
            }
        }

    fun withIncomingMessage(message: ApplicantConversationMessage): ApplicantConversationState {
        if (message.requestId != request.id) return this
        return copy(messages = upsertApplicantConversationMessage(messages, message))
    }
}

data class ApplicantConversationScreenSpec(
    val title: String,
    val subtitle: String,
    val loadingMessage: String,
    val emptyMessage: String,
    val draft: String,
    val sendButtonTitle: String,
    val canSend: Boolean,
    val rows: List<ApplicantConversationRow>,
    val firstUnreadMessageId: String?,
) {
    val isEmpty: Boolean
        get() = rows.isEmpty()
}

sealed interface ApplicantConversationRow {
    data object UnreadDivider : ApplicantConversationRow
    data class Message(val spec: ApplicantMessageBubbleSpec) : ApplicantConversationRow
}

data class ApplicantMessageBubbleSpec(
    val id: String,
    val body: String,
    val isMine: Boolean,
    val createdAt: String,
)

fun ApplicantConversationMessage.toBubbleSpec(): ApplicantMessageBubbleSpec {
    return ApplicantMessageBubbleSpec(
        id = id,
        body = body,
        isMine = isMineForApplicant,
        createdAt = createdAt,
    )
}

fun upsertApplicantConversationMessage(
    messages: List<ApplicantConversationMessage>,
    incoming: ApplicantConversationMessage,
): List<ApplicantConversationMessage> {
    return (messages.filterNot { it.id == incoming.id } + incoming)
        .sortedBy { it.createdAt }
}
