package com.cato.app.state

import com.cato.app.core.ApplicantInterestRequest
import com.cato.app.core.ApplicantInterestRequestStatus

data class ApplicantRequestsState(
    val requests: List<ApplicantInterestRequest> = emptyList(),
    val workingRequestId: String? = null,
    val actionMessage: String? = null,
) {
    val screenSpec: ApplicantRequestsScreenSpec
        get() = ApplicantRequestsScreenSpec(
            title = "Requests",
            loadingMessage = "Loading requests",
            emptyIconName = "envelope.badge",
            emptyTitle = "No requests yet",
            emptyMessage = "Recruiters who are interested in your profile will appear here.",
            actionMessage = actionMessage,
            unreadCount = unreadRequestCount,
            cards = requests.map { request ->
                ApplicantRequestListCardSpec(
                    requestId = request.id,
                    card = request.toCardSpec(),
                    isWorking = workingRequestId == request.id,
                    acceptLabel = "Accept",
                    declineLabel = "Decline",
                )
            },
        )

    val unreadRequestCount: Int
        get() = requests.count { it.hasUnreadMessages }

    fun replaceRequest(updated: ApplicantInterestRequest, message: String? = null): ApplicantRequestsState {
        return copy(
            requests = requests.map { if (it.id == updated.id) updated else it },
            workingRequestId = null,
            actionMessage = message,
        )
    }
}

data class ApplicantRequestsScreenSpec(
    val title: String,
    val loadingMessage: String,
    val emptyIconName: String,
    val emptyTitle: String,
    val emptyMessage: String,
    val actionMessage: String?,
    val unreadCount: Int,
    val cards: List<ApplicantRequestListCardSpec>,
) {
    val isEmpty: Boolean
        get() = cards.isEmpty()
}

data class ApplicantRequestListCardSpec(
    val requestId: String,
    val card: ApplicantRequestCardSpec,
    val isWorking: Boolean,
    val acceptLabel: String,
    val declineLabel: String,
)

data class ApplicantRequestCardSpec(
    val company: String,
    val recruiterName: String,
    val reason: String,
    val statusLabel: String,
    val unreadBadge: String?,
    val emphasized: Boolean,
    val showDecisionActions: Boolean,
    val showConversationHint: Boolean,
)

fun ApplicantInterestRequest.toCardSpec(): ApplicantRequestCardSpec {
    val canRespond = status == ApplicantInterestRequestStatus.SENT || status == ApplicantInterestRequestStatus.VIEWED
    return ApplicantRequestCardSpec(
        company = displayCompany,
        recruiterName = recruiterName ?: "Recruiting team",
        reason = reason,
        statusLabel = status.wireValue.replaceFirstChar { it.uppercase() },
        unreadBadge = unreadBadge,
        emphasized = hasUnreadMessages,
        showDecisionActions = canRespond,
        showConversationHint = status == ApplicantInterestRequestStatus.ACCEPTED,
    )
}
