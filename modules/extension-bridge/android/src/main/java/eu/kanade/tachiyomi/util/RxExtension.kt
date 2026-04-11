package eu.kanade.tachiyomi.util

import kotlinx.coroutines.InternalCoroutinesApi
import kotlinx.coroutines.suspendCancellableCoroutine
import rx.Observable
import rx.Subscriber
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

/**
 * Bridges RxJava 1 Observable to Kotlin coroutines.
 * Adapted from Mihon's tachiyomi.core.common.util.lang.RxCoroutineBridge.
 */
suspend fun <T> Observable<T>.awaitSingle(): T = single().awaitOne()

@OptIn(InternalCoroutinesApi::class)
private suspend fun <T> Observable<T>.awaitOne(): T = suspendCancellableCoroutine { cont ->
    val sub = subscribe(
        object : Subscriber<T>() {
            override fun onStart() { request(1) }

            override fun onNext(t: T) { cont.resume(t) }

            override fun onCompleted() {
                if (cont.isActive) {
                    cont.resumeWithException(
                        IllegalStateException("Should have invoked onNext"),
                    )
                }
            }

            override fun onError(e: Throwable) {
                val token = cont.tryResumeWithException(e)
                if (token != null) cont.completeResume(token)
            }
        },
    )
    cont.invokeOnCancellation { sub.unsubscribe() }
}
