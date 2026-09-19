package com.cato.app.usecase

import com.cato.app.core.CatoAuthSession

class InMemoryAuthSessionRepository(
    initialSession: CatoAuthSession? = null,
) : AuthSessionRepository {
    private var currentSession: CatoAuthSession? = initialSession

    override suspend fun load(): CatoAuthSession? = currentSession

    override suspend fun save(session: CatoAuthSession) {
        currentSession = session
    }

    override suspend fun clear() {
        currentSession = null
    }
}
