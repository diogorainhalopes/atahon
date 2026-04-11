package com.atahon.extensionbridge

import eu.kanade.tachiyomi.source.CatalogueSource
import eu.kanade.tachiyomi.source.Source
import eu.kanade.tachiyomi.source.model.FilterList
import eu.kanade.tachiyomi.source.model.MangasPage
import eu.kanade.tachiyomi.source.model.Page
import eu.kanade.tachiyomi.source.model.SChapter
import eu.kanade.tachiyomi.source.model.SChapterImpl
import eu.kanade.tachiyomi.source.model.SManga
import eu.kanade.tachiyomi.source.model.SMangaImpl
import eu.kanade.tachiyomi.source.online.HttpSource
import android.graphics.Bitmap
import android.graphics.BitmapFactory
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.runBlocking
import kotlinx.coroutines.withContext
import okhttp3.Request
import org.json.JSONArray
import org.json.JSONObject
import java.io.File

private val compressionDispatcher = Dispatchers.IO.limitedParallelism(1)

object SourceCaller {

    fun call(
        source: ExtensionLoader.LoadedSource,
        method: String,
        params: Map<String, Any?>,
    ): String {
        val src = source.instance
        Logger.i("SourceCaller", "Calling $method on ${source.name} with params=${params.keys}")

        val callerClassLoader = Thread.currentThread().contextClassLoader
        Thread.currentThread().contextClassLoader = src.javaClass.classLoader

        return try {
            runBlocking {
                when (method) {
                    "getPopularManga" -> {
                        val page = (params["page"] as? Number)?.toInt() ?: 1
                        serializeMangasPage((src as CatalogueSource).getPopularManga(page))
                    }
                    "getLatestUpdates" -> {
                        val page = (params["page"] as? Number)?.toInt() ?: 1
                        serializeMangasPage((src as CatalogueSource).getLatestUpdates(page))
                    }
                    "searchManga" -> {
                        val page = (params["page"] as? Number)?.toInt() ?: 1
                        val query = params["query"] as? String ?: ""
                        serializeMangasPage((src as CatalogueSource).getSearchManga(page, query, FilterList()))
                    }
                    "getMangaDetails" -> {
                        val url = params["mangaUrl"] as? String
                            ?: throw IllegalArgumentException("mangaUrl required")
                        val smanga = SMangaImpl().apply { this.url = url }
                        serializeSmanga((src as Source).getMangaDetails(smanga)).toString()
                    }
                    "getChapterList" -> {
                        val url = params["mangaUrl"] as? String
                            ?: throw IllegalArgumentException("mangaUrl required")
                        val smanga = SMangaImpl().apply { this.url = url }
                        serializeChapterList((src as Source).getChapterList(smanga))
                    }
                    "getPageList" -> {
                        val url = params["chapterUrl"] as? String
                            ?: throw IllegalArgumentException("chapterUrl required")
                        val schapter = SChapterImpl().apply { this.url = url }
                        serializePageList((src as Source).getPageList(schapter))
                    }
                    "getImageUrl" -> {
                        val pageIndex = (params["pageIndex"] as? Number)?.toInt() ?: 0
                        val pageUrl   = params["pageUrl"] as? String
                            ?: throw IllegalArgumentException("pageUrl required")
                        val httpSource = src as? HttpSource
                            ?: throw IllegalStateException("Source does not support image URL resolution")
                        val page = Page(pageIndex, pageUrl)
                        val imageUrl = httpSource.getImageUrl(page)
                        JSONObject().put("imageUrl", imageUrl).toString()
                    }
                    "downloadPage" -> {
                        val imageUrl = params["imageUrl"] as? String
                            ?: throw IllegalArgumentException("imageUrl required")
                        val destPath = params["destPath"] as? String
                            ?: throw IllegalArgumentException("destPath required")
                        val quality  = (params["quality"] as? Number)?.toInt() ?: 0
                        val maxWidth = (params["maxWidth"] as? Number)?.toInt() ?: 0
                        val httpSource = src as? HttpSource
                            ?: throw IllegalStateException("Source does not support HTTP image requests")

                        val request = okhttp3.Request.Builder()
                            .url(imageUrl)
                            .header("User-Agent", "Mozilla/5.0 (Linux; Android 14; Pixel 5a) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Mobile Safari/537.36")
                            .header("Referer", source.baseUrl)
                            .build()

                        httpSource.client.newCall(request).execute().use { response ->
                            if (!response.isSuccessful) throw Exception("HTTP ${response.code} downloading image")
                            val body = response.body ?: throw Exception("Empty response body")
                            val file = File(destPath.removePrefix("file://"))
                            file.parentFile?.mkdirs()

                            if (quality > 0) {
                                // Read bytes first (network I/O is already done)
                                val imageBytes = body.byteStream().readBytes()

                                // Compress on dedicated thread to avoid blocking concurrent downloads
                                withContext(compressionDispatcher) {
                                    val raw = BitmapFactory.decodeByteArray(imageBytes, 0, imageBytes.size)
                                        ?: throw Exception("Failed to decode image")

                                    val bitmap = if (maxWidth > 0 && raw.width > maxWidth) {
                                        val ratio = maxWidth.toFloat() / raw.width
                                        val newH = (raw.height * ratio).toInt()
                                        Bitmap.createScaledBitmap(raw, maxWidth, newH, true).also {
                                            if (it !== raw) raw.recycle()
                                        }
                                    } else raw

                                    file.outputStream().use { out ->
                                        val format = if (android.os.Build.VERSION.SDK_INT >= 30)
                                            Bitmap.CompressFormat.WEBP_LOSSY
                                        else
                                            @Suppress("DEPRECATION") Bitmap.CompressFormat.WEBP
                                        bitmap.compress(format, quality, out)
                                    }
                                    bitmap.recycle()
                                }
                            } else {
                                file.outputStream().use { out ->
                                    body.byteStream().copyTo(out)
                                    out.flush()
                                }
                            }
                        }
                        JSONObject().put("status", 200).toString()
                    }
                    else -> throw IllegalArgumentException("Unknown method: $method")
                }
            }
        } catch (e: Exception) {
            // Log the full exception chain to identify which class is missing
            Logger.e("SourceCaller", "$method on ${source.name} failed: ${e.message}", e)

            // For NoClassDefFoundError, log additional context
            if (e is NoClassDefFoundError) {
                Logger.e("SourceCaller", "NoClassDefFoundError details:")
                Logger.e("SourceCaller", "  Exception message: ${e.message}")
                Logger.e("SourceCaller", "  Exception cause: ${e.cause}")
                var cause: Throwable? = e
                var depth = 0
                while (cause != null && depth < 5) {
                    Logger.e("SourceCaller", "  [$depth] ${cause.javaClass.simpleName}: ${cause.message}")
                    cause = cause.cause
                    depth++
                }
            }
            throw e
        } finally {
            Thread.currentThread().contextClassLoader = callerClassLoader
        }
    }

    // ─── JSON serialization ───────────────────────────────────────────────────

    private fun serializeMangasPage(page: MangasPage): String {
        val jo = JSONObject()
        jo.put("hasNextPage", page.hasNextPage)
        val arr = JSONArray()
        for (manga in page.mangas) arr.put(serializeSmanga(manga))
        jo.put("mangas", arr)
        return jo.toString()
    }

    private fun serializeSmanga(manga: SManga): JSONObject {
        val jo = JSONObject()
        jo.put("url", manga.url)
        jo.put("title", manga.title)
        jo.putOpt("artist", manga.artist)
        jo.putOpt("author", manga.author)
        jo.putOpt("description", manga.description)
        jo.putOpt("genre", manga.genre)
        jo.put("status", manga.status)
        jo.putOpt("thumbnail_url", manga.thumbnail_url)
        jo.put("initialized", manga.initialized)
        return jo
    }

    private fun serializeChapterList(chapters: List<SChapter>): String {
        val arr = JSONArray()
        for (ch in chapters) {
            val jo = JSONObject()
            jo.put("url", ch.url)
            jo.put("name", ch.name)
            jo.put("date_upload", ch.date_upload)
            jo.put("chapter_number", ch.chapter_number)
            jo.putOpt("scanlator", ch.scanlator)
            arr.put(jo)
        }
        return arr.toString()
    }

    private fun serializePageList(pages: List<Page>): String {
        val arr = JSONArray()
        for (p in pages) {
            val jo = JSONObject()
            jo.put("index", p.index)
            jo.putOpt("url", p.url.takeIf { it.isNotEmpty() })
            jo.putOpt("imageUrl", p.imageUrl)
            arr.put(jo)
        }
        return arr.toString()
    }
}
