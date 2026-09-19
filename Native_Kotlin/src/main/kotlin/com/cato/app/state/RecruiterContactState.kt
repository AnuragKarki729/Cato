package com.cato.app.state

import com.cato.app.core.RecruiterCandidate
import com.cato.app.core.RecruiterMessage

enum class RecruiterContactMode {
    REQUEST,
    MESSAGE,
}

data class RecruiterContactState(
    val candidateId: String,
    val mode: RecruiterContactMode,
    val candidate: RecruiterCandidate? = null,
    val bodyText: String = defaultBody(mode),
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val errorMessage: String? = null,
) {
    val screenSpec: RecruiterContactScreenSpec
        get() = RecruiterContactScreenSpec(
            title = title,
            subtitle = subtitle,
            candidateName = candidate?.displayName ?: "Candidate",
            bodyText = bodyText,
            buttonTitle = buttonTitle,
            canSend = canSend,
            loadingMessage = "Loading contact",
        )

    val title: String
        get() = if (mode == RecruiterContactMode.MESSAGE) "Message Candidate" else "Send Interest Request"

    val subtitle: String
        get() = if (mode == RecruiterContactMode.MESSAGE) {
            "Messaging is available after the applicant accepts your request."
        } else {
            "This protects applicants from spam. Messaging opens only after acceptance."
        }

    val buttonTitle: String
        get() = when {
            isSending -> "Sending..."
            mode == RecruiterContactMode.MESSAGE -> "Send Message"
            else -> "Send Interest Request"
        }

    val canSend: Boolean
        get() = !isSending && bodyText.trim().isNotEmpty()

    companion object {
        fun defaultBody(mode: RecruiterContactMode): String {
            return if (mode == RecruiterContactMode.MESSAGE) {
                "Hi, I would love to connect about an opportunity."
            } else {
                "Your profile stood out for this opportunity."
            }
        }
    }
}

data class RecruiterContactScreenSpec(
    val title: String,
    val subtitle: String,
    val candidateName: String,
    val bodyText: String,
    val buttonTitle: String,
    val canSend: Boolean,
    val loadingMessage: String,
)

data class RecruiterConversationState(
    val candidateId: String,
    val candidateName: String? = null,
    val messages: List<RecruiterMessage> = emptyList(),
    val draft: String = "",
    val isLoading: Boolean = false,
    val isSending: Boolean = false,
    val errorMessage: String? = null,
) {
    val screenSpec: RecruiterConversationScreenSpec
        get() = RecruiterConversationScreenSpec(
            title = title,
            loadingMessage = "Loading conversation",
            emptyMessage = "Messages will appear here after the applicant accepts your request.",
            draft = draft,
            sendButtonTitle = if (isSending) "Sending..." else "Send",
            canSend = canSend,
            rows = rows,
            firstUnreadMessageId = firstUnreadMessageId,
        )

    val title: String
        get() = candidateName ?: "Conversation"

    val trimmedDraft: String
        get() = draft.trim()

    val canSend: Boolean
        get() = !isSending && trimmedDraft.isNotEmpty()

    val firstUnreadMessageId: String?
        get() = messages.firstOrNull { it.isUnreadForViewer == true }?.id

    val rows: List<RecruiterConversationRow>
        get() = buildList {
            for (message in messages) {
                if (message.id == firstUnreadMessageId) {
                    add(RecruiterConversationRow.UnreadDivider)
                }
                add(RecruiterConversationRow.Message(message.toRecruiterBubbleSpec()))
            }
        }

    fun withIncomingMessage(message: RecruiterMessage): RecruiterConversationState {
        if (message.candidateId != candidateId) return this
        return copy(
            candidateName = message.candidateName ?: candidateName,
            messages = upsertRecruiterMessage(messages, message),
        )
    }
}

data class RecruiterConversationScreenSpec(
    val title: String,
    val loadingMessage: String,
    val emptyMessage: String,
    val draft: String,
    val sendButtonTitle: String,
    val canSend: Boolean,
    val rows: List<RecruiterConversationRow>,
    val firstUnreadMessageId: String?,
) {
    val isEmpty: Boolean
        get() = rows.isEmpty()
}

sealed interface RecruiterConversationRow {
    data object UnreadDivider : RecruiterConversationRow
    data class Message(val spec: RecruiterMessageBubbleSpec) : RecruiterConversationRow
}

data class RecruiterMessageBubbleSpec(
    val id: String,
    val body: String,
    val isMine: Boolean,
    val createdAt: String,
)

fun RecruiterMessage.toRecruiterBubbleSpec(): RecruiterMessageBubbleSpec {
    return RecruiterMessageBubbleSpec(
        id = id,
        body = body,
        isMine = (senderRole ?: "recruiter") == "recruiter",
        createdAt = createdAt,
    )
}

fun upsertRecruiterMessage(
    messages: List<RecruiterMessage>,
    incoming: RecruiterMessage,
): List<RecruiterMessage> {
    return (messages.filterNot { it.id == incoming.id } + incoming)
        .sortedBy { it.createdAt }
}
