package com.atahon.extensionbridge

import expo.modules.kotlin.modules.Module
import expo.modules.kotlin.modules.ModuleDefinition
import okhttp3.OkHttpClient
import okhttp3.Request
import java.util.concurrent.TimeUnit

class ExtensionBridgeModule : Module() {

    init {
        io.reactivex.plugins.RxJavaPlugins.setIoSchedulerHandler { io.reactivex.schedulers.Schedulers.io() }
    }

    private val httpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(60, TimeUnit.SECONDS)
        .build()

    private val context get() = requireNotNull(appContext.reactContext) { "No Android context available" }

    override fun definition() = ModuleDefinition {
        Name("ExtensionBridge")

        // ── Load all extensions on startup ──────────────────────────────────────
        AsyncFunction("loadInstalledExtensions") {
            ExtensionRegistry.clear()

            // 1. Load from app-private exts/ directory (downloaded .ext files)
            val dirExtensions = ExtensionLoader.loadAllFromDir(context)
            // 2. Also load system-installed extension packages (e.g. user has Mihon installed)
            val pmExtensions  = ExtensionLoader.loadAllInstalledExtensions(context)
            // Deduplicate: prefer private (dir) over system-installed when same pkgName
            val seen = mutableSetOf<String>()
            val extensions = (dirExtensions + pmExtensions).filter { seen.add(it.pkgName) }

            for (ext in extensions) ExtensionRegistry.register(ext)

            Logger.i("ExtensionBridge",
                "Loaded ${extensions.size} extension(s) " +
                "(${dirExtensions.size} private, ${pmExtensions.size} system-installed)")

            extensions.map { extensionToMap(it) }
        }

        AsyncFunction("getInstalledExtensions") {
            ExtensionRegistry.getAllExtensions().map { extensionToMap(it) }
        }

        AsyncFunction("getInstalledSources") {
            ExtensionRegistry.getAllExtensions()
                .flatMap { it.sources }
                .map { sourceToMap(it) }
        }

        // ── Download + install a private extension ───────────────────────────────
        AsyncFunction("installExtension") { apkUrl: String, pkgName: String ->
            val extDir  = ExtensionLoader.getExtFile(context, pkgName).parentFile!!.also { it.mkdirs() }
            val tmpFile = extDir.resolve("$pkgName.tmp")
            val extFile = ExtensionLoader.getExtFile(context, pkgName)  // $pkgName.ext

            try {
                // 1. Download APK bytes to a temp file
                val request = Request.Builder().url(apkUrl).build()
                httpClient.newCall(request).execute().use { response ->
                    if (!response.isSuccessful) throw Exception("Download failed: HTTP ${response.code}")
                    val body = response.body ?: throw Exception("Empty response body for $apkUrl")
                    tmpFile.outputStream().use { out ->
                        body.byteStream().copyTo(out)
                        out.flush()
                    }
                }
                check(tmpFile.exists()) { "Temp file not created: ${tmpFile.absolutePath}" }

                // 2. Remove old .ext if present
                if (extFile.exists()) extFile.delete()

                // 3. Rename temp → final .ext (like Mihon's private extension format)
                if (!tmpFile.renameTo(extFile)) {
                    tmpFile.copyTo(extFile, overwrite = true)
                    tmpFile.delete()
                }

                // 4. Mark read-only — Android 14+ requires extension files to be read-only
                extFile.setReadOnly()

                // 5. Load and register
                val ext = ExtensionLoader.loadFromFile(context, extFile).getOrThrow()
                ExtensionRegistry.register(ext)
                Logger.i("ExtensionBridge", "Installed ${ext.name} (${ext.pkgName}) — ${ext.sources.size} source(s)")

                extensionToMap(ext)
            } catch (e: Exception) {
                tmpFile.delete()
                Logger.e("ExtensionBridge", "Failed to install $pkgName: ${e.message}", e)
                throw e
            }
        }

        AsyncFunction("uninstallExtension") { pkgName: String ->
            ExtensionRegistry.unregister(pkgName)
            ExtensionLoader.getExtFile(context, pkgName).delete()
            Logger.i("ExtensionBridge", "Uninstalled $pkgName")
        }

        // ── Source preference management ──────────────────────────────────────────
        AsyncFunction("setSourcePreference") { sourceId: String, key: String, value: String ->
            context.getSharedPreferences("source_$sourceId", android.content.Context.MODE_PRIVATE)
                .edit().putString(key, value).apply()
            Logger.i("ExtensionBridge", "setSourcePreference: source=$sourceId key=$key")
        }

        AsyncFunction("getSourcePreferenceDefinitions") { sourceId: String ->
            val id = sourceId.toLong()
            val source = ExtensionRegistry.getSource(id)
                ?: throw Exception("Source $id not found")
            val inst = source.instance
            if (inst !is eu.kanade.tachiyomi.source.ConfigurableSource) {
                return@AsyncFunction emptyList<Map<String, Any?>>()
            }

            val activity = appContext.currentActivity
                ?: return@AsyncFunction emptyList<Map<String, Any?>>()
            @Suppress("DEPRECATION")
            val prefManagerClass = android.preference.PreferenceManager::class.java
            val constructor = prefManagerClass.getDeclaredConstructor(
                android.content.Context::class.java, Int::class.java
            ).also { it.isAccessible = true }
            @Suppress("DEPRECATION")
            val prefManager = constructor.newInstance(activity, 0) as android.preference.PreferenceManager
            @Suppress("DEPRECATION")
            val screen = prefManager.createPreferenceScreen(activity)

            try {
                // Extensions expect android.preference.PreferenceScreen — find method by name
                val setupMethod = inst.javaClass.methods.firstOrNull { m ->
                    m.name == "setupPreferenceScreen" && m.parameterCount == 1
                }
                setupMethod?.invoke(inst, screen)
            } catch (e: Exception) {
                Logger.w("ExtensionBridge", "setupPreferenceScreen failed for $sourceId: ${e.message}")
            }

            val currentPrefs = context.getSharedPreferences(
                "source_$sourceId", android.content.Context.MODE_PRIVATE
            )

            @Suppress("DEPRECATION")
            fun collectPrefs(group: android.preference.PreferenceGroup): List<Map<String, Any?>> {
                val defs = mutableListOf<Map<String, Any?>>()
                for (i in 0 until group.preferenceCount) {
                    val pref = group.getPreference(i)
                    @Suppress("DEPRECATION")
                    when {
                        pref is android.preference.PreferenceGroup -> defs.addAll(collectPrefs(pref))
                        pref.key != null -> defs.add(mapOf(
                            "key"          to pref.key,
                            "title"        to pref.title?.toString(),
                            "summary"      to pref.summary?.toString(),
                            "type"         to when (pref) {
                                is android.preference.EditTextPreference  -> "edittext"
                                is android.preference.CheckBoxPreference  -> "checkbox"
                                is android.preference.ListPreference      -> "list"
                                else -> "unknown"
                            },
                            "currentValue" to currentPrefs.getString(pref.key, null),
                        ))
                    }
                }
                return defs
            }

            @Suppress("DEPRECATION")
            collectPrefs(screen)
        }

        // ── Dispatch a method call to an extension source ────────────────────────
        // sourceId arrives as a String from JS (route params stringify numbers).
        AsyncFunction("callSource") { sourceId: String, method: String, params: Map<String, Any?> ->
            val id     = sourceId.toLong()
            val source = ExtensionRegistry.getSource(id)
                ?: throw Exception("Source $id not found in registry")
            val result: String = SourceCaller.call(source, method, params)
            Logger.d("ExtensionBridge", "callSource($method, src=$id) → ${result.length} chars")
            result
        }
    }

    // ── Serialization helpers ────────────────────────────────────────────────────

    private fun extensionToMap(ext: ExtensionLoader.LoadedExtension): Map<String, Any?> = mapOf(
        "pkgName"     to ext.pkgName,
        "name"        to ext.name,
        "versionName" to ext.versionName,
        "versionCode" to ext.versionCode,
        "lang"        to ext.lang,
        "isNsfw"      to ext.isNsfw,
        "sources"     to ext.sources.map { sourceToMap(it) },
    )

    // id serialized as String — JS route params always stringify numbers,
    // so keeping it as String avoids silent precision loss for large Long values
    // and makes the callSource round-trip safe.
    private fun sourceToMap(src: ExtensionLoader.LoadedSource): Map<String, Any?> = mapOf(
        "id"             to src.id.toString(),
        "name"           to src.name,
        "lang"           to src.lang,
        "baseUrl"        to src.baseUrl,
        "supportsLatest" to src.supportsLatest,
        "isConfigurable" to src.isConfigurable,
        "isNsfw"         to false,
        "versionId"      to 0,
    )
}
