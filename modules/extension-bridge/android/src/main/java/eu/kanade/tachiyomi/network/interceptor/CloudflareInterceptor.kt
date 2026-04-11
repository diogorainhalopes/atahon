package eu.kanade.tachiyomi.network.interceptor

import android.content.Context
import eu.kanade.tachiyomi.network.AndroidCookieJar
import okhttp3.Interceptor
import okhttp3.Request
import okhttp3.Response

/**
 * Stub CloudflareInterceptor — passes all requests through without attempting
 * to solve Cloudflare challenges. Full WebView-based bypass is not implemented.
 */
class CloudflareInterceptor(
    context: Context,
    @Suppress("UNUSED_PARAMETER") cookieManager: AndroidCookieJar,
    defaultUserAgentProvider: () -> String,
) : WebViewInterceptor(context, defaultUserAgentProvider) {

    override fun shouldIntercept(response: Response): Boolean = false

    override fun intercept(chain: Interceptor.Chain, request: Request, response: Response): Response =
        response
}
