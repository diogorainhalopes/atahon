package eu.kanade.tachiyomi.network

import okhttp3.Cookie
import okhttp3.CookieJar
import okhttp3.HttpUrl
import java.util.concurrent.ConcurrentHashMap

class AndroidCookieJar : CookieJar {

    private val store = ConcurrentHashMap<String, MutableList<Cookie>>()

    override fun saveFromResponse(url: HttpUrl, cookies: List<Cookie>) {
        val host = url.host
        val list = store.getOrPut(host) { mutableListOf() }
        synchronized(list) {
            cookies.forEach { new ->
                list.removeAll { it.name == new.name }
                list.add(new)
            }
        }
    }

    override fun loadForRequest(url: HttpUrl): List<Cookie> {
        val now = System.currentTimeMillis()
        return store[url.host]
            ?.let { list ->
                synchronized(list) {
                    list.filter { it.expiresAt > now && it.matches(url) }.toList()
                }
            }
            ?: emptyList()
    }

    fun remove(url: HttpUrl, names: List<String>, maxAge: Int) {
        store[url.host]?.let { list ->
            synchronized(list) { list.removeAll { it.name in names } }
        }
    }

    fun get(url: HttpUrl): List<Cookie> = loadForRequest(url)
}
