package com.atahon.extensionbridge

import android.app.Application
import android.content.Context
import android.content.pm.PackageManager
import android.os.Build
import eu.kanade.tachiyomi.network.NetworkHelper
import uy.kohesive.injekt.Injekt
import uy.kohesive.injekt.api.addSingleton
import java.io.File

object ExtensionLoader {

    // Mihon uses "exts" dir and ".ext" extension for private extensions.
    // Renaming .apk → .ext prevents Android from scanning/quarantining it as an APK
    // and satisfies Android 14+'s requirement that loaded files be read-only.
    private const val EXTENSIONS_DIR = "exts"
    private const val EXTENSION_EXT = "ext"

    // --- Data classes ---

    data class LoadedSource(
        val id: Long,
        val name: String,
        val lang: String,
        val baseUrl: String,
        val supportsLatest: Boolean,
        val isConfigurable: Boolean,
        val instance: Any,
    )

    data class LoadedExtension(
        val pkgName: String,
        val name: String,
        val versionName: String,
        val versionCode: Int,
        val lang: String,
        val isNsfw: Boolean,
        val sources: List<LoadedSource>,
        val classLoader: ClassLoader,
    )

    // --- Directory helpers ---

    private fun getExtDir(context: Context): File =
        context.filesDir.resolve(EXTENSIONS_DIR).also { it.mkdirs() }

    fun getExtFile(context: Context, pkgName: String): File =
        getExtDir(context).resolve("$pkgName.$EXTENSION_EXT")

    // --- Load all private (.ext) extensions from the app's exts directory ---

    fun loadAllFromDir(context: Context): List<LoadedExtension> {
        val dir = getExtDir(context)
        val files = dir.listFiles { f -> f.isFile && f.extension == EXTENSION_EXT } ?: emptyArray()
        val extensions = mutableListOf<LoadedExtension>()
        for (file in files) {
            // Android 14+ requires read-only; enforce it here as well
            if (file.canWrite()) file.setReadOnly()
            loadFromFile(context, file).fold(
                onSuccess = { extensions.add(it) },
                onFailure = { e -> logLoadFailure(file.name, e) },
            )
        }
        Logger.i("ExtensionLoader", "Loaded ${extensions.size} private extension(s) from ${dir.absolutePath}")
        return extensions
    }

    // --- Load system-installed extension packages (eu.kanade.tachiyomi.extension.*) ---

    fun loadAllInstalledExtensions(context: Context): List<LoadedExtension> {
        val pm = context.packageManager
        val flags = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            PackageManager.PackageInfoFlags.of(PackageManager.GET_META_DATA.toLong())
        } else {
            null
        }
        val pkgs = if (flags != null) {
            pm.getInstalledPackages(flags)
        } else {
            @Suppress("DEPRECATION")
            pm.getInstalledPackages(PackageManager.GET_META_DATA)
        }.filter { it.packageName.startsWith("eu.kanade.tachiyomi.extension.") }

        val extensions = mutableListOf<LoadedExtension>()
        for (pkg in pkgs) {
            val ai = pkg.applicationInfo ?: continue
            val path = ai.sourceDir ?: continue
            loadFromFile(context, File(path)).fold(
                onSuccess = { extensions.add(it) },
                onFailure = { e -> logLoadFailure(pkg.packageName, e) },
            )
        }
        Logger.i("ExtensionLoader", "Loaded ${extensions.size} system-installed extension(s)")
        return extensions
    }

    // --- Load a single extension from an .ext (or .apk) file ---

    fun loadFromFile(context: Context, extFile: File): Result<LoadedExtension> = runCatching {
        require(extFile.exists()) { "Extension file not found: ${extFile.absolutePath}" }

        val pm = context.packageManager
        val pkgInfo = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.TIRAMISU) {
            pm.getPackageArchiveInfo(
                extFile.absolutePath,
                PackageManager.PackageInfoFlags.of(PackageManager.GET_META_DATA.toLong()),
            )
        } else {
            @Suppress("DEPRECATION")
            pm.getPackageArchiveInfo(extFile.absolutePath, PackageManager.GET_META_DATA)
        } ?: error("getPackageArchiveInfo returned null for ${extFile.name}")

        val ai = pkgInfo.applicationInfo ?: error("Missing applicationInfo in ${extFile.name}")

        // Android 13+ doesn't populate sourceDir for archive info — fix it manually (same as Mihon's fixBasePaths)
        if (ai.sourceDir == null) ai.sourceDir = extFile.absolutePath
        if (ai.publicSourceDir == null) ai.publicSourceDir = extFile.absolutePath

        val meta = ai.metaData ?: error("No metadata in ${extFile.name}")

        val extensionClass = meta.getString("tachiyomi.extension.class")
        val extensionFactory = meta.getString("tachiyomi.extension.factory")
        require(extensionClass != null || extensionFactory != null) {
            "Missing tachiyomi.extension.class / .factory in ${extFile.name}"
        }

        val lang    = meta.getString("tachiyomi.extension.lang") ?: "all"
        val extName = meta.getString("tachiyomi.extension.name") ?: pkgInfo.packageName
        val isNsfw  = meta.getInt("tachiyomi.extension.nsfw", 0) == 1

        // PathClassLoader matching Mihon's exact signature: (dexPath, librarySearchPath=null, parent)
        val classLoader = ChildFirstPathClassLoader(
            ai.sourceDir!!,
            null,
            context.classLoader,
        )

        Logger.d("ExtensionLoader", "ClassLoader for $extName: $classLoader")

        injectNetworkHelper(classLoader, context)

        val sources = mutableListOf<LoadedSource>()
        val classNames: String? = extensionFactory ?: extensionClass

        for (raw in (classNames ?: "").split(";")) {
            val fullName = raw.trim().let {
                if (it.startsWith(".")) pkgInfo.packageName + it else it
            }
            if (fullName.isEmpty()) continue

            // ── Step 1: load the class ─────────────────────────────────────────
            val clazz: Class<*> = try {
                // Use loadClass via our ChildFirstPathClassLoader directly
                // (avoids Class.forName's native wrapper that strips the error message)
                classLoader.loadClass(fullName)
            } catch (e: Throwable) {
                Logger.w("ExtensionLoader", "loadClass failed for $fullName: [${e.javaClass.simpleName}] ${e.message}")
                e.cause?.let { Logger.w("ExtensionLoader", "  ↳ cause: [${it.javaClass.simpleName}] ${it.message}") }
                // Print suppressed exceptions for extra context
                for (s in e.suppressed) Logger.w("ExtensionLoader", "  ↳ suppressed: [${s.javaClass.simpleName}] ${s.message}")
                continue
            }
            Logger.d("ExtensionLoader", "  ✓ Loaded class $fullName")

            // ── Step 2: instantiate ────────────────────────────────────────────
            // Handles: regular class (no-arg ctor), Kotlin object (INSTANCE field),
            // SourceFactory (createSources method).
            val instance: Any = try {
                clazz.getDeclaredConstructor().apply { isAccessible = true }.newInstance()
            } catch (_: NoSuchMethodException) {
                // Kotlin object — use the INSTANCE field
                try {
                    clazz.getField("INSTANCE").apply { isAccessible = true }.get(null)!!
                } catch (e2: Throwable) {
                    Logger.w("ExtensionLoader", "No ctor and no INSTANCE for $fullName: ${e2.message}")
                    continue
                }
            } catch (e: Throwable) {
                Logger.w("ExtensionLoader", "newInstance failed for $fullName: [${e.javaClass.simpleName}] ${e.message}")
                e.cause?.let { Logger.w("ExtensionLoader", "  ↳ cause: [${it.javaClass.simpleName}] ${it.message}") }
                continue
            }

            // ── Step 3: extract source(s) ──────────────────────────────────────
            val createSources = clazz.methods.find { it.name == "createSources" }
            val created: List<Any?> = if (createSources != null) {
                @Suppress("UNCHECKED_CAST")
                createSources.invoke(instance) as? List<*> ?: emptyList<Any>()
            } else {
                listOf(instance)
            }

            for (src in created) {
                if (src == null) continue
                try {
                    sources.add(extractSource(src))
                } catch (e: Exception) {
                    Logger.w("ExtensionLoader", "extractSource failed for $fullName: ${e.message}")
                }
            }
        }

        Logger.i("ExtensionLoader", "Loaded $extName (${pkgInfo.packageName}) — ${sources.size} source(s)")
        sources.forEach { Logger.i("ExtensionLoader", "  ↳ ${it.name} [${it.lang}] id=${it.id} url=${it.baseUrl}") }

        LoadedExtension(
            pkgName     = pkgInfo.packageName,
            name        = extName,
            versionName = pkgInfo.versionName ?: "unknown",
            versionCode = if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.P)
                pkgInfo.longVersionCode.toInt()
            else
                @Suppress("DEPRECATION") pkgInfo.versionCode,
            lang        = lang,
            isNsfw      = isNsfw,
            sources     = sources,
            classLoader = classLoader,
        )
    }

    // --- Source extraction via reflection ---

    private fun extractSource(src: Any): LoadedSource {
        val id            = getLongProp(src, "id") ?: 0L
        val name          = getStringProp(src, "name") ?: "Unknown"
        val lang          = getStringProp(src, "lang") ?: "all"
        val baseUrl       = getStringProp(src, "baseUrl") ?: ""
        val supportsLatest = getBoolProp(src, "supportsLatest") ?: false
        val isConfigurable = src is eu.kanade.tachiyomi.source.ConfigurableSource
        return LoadedSource(id, name, lang, baseUrl, supportsLatest, isConfigurable, src)
    }

    // --- Reflection helpers ---

    private fun getLongProp(obj: Any, name: String): Long? {
        val getter = "get${name.replaceFirstChar { it.uppercaseChar() }}"
        return try {
            obj.javaClass.getMethod(getter).invoke(obj) as? Number
        } catch (_: Exception) {
            try { findField(obj.javaClass, name)?.apply { isAccessible = true }?.get(obj) as? Number }
            catch (_: Exception) { null }
        }?.toLong()
    }

    private fun getStringProp(obj: Any, name: String): String? {
        val getter = "get${name.replaceFirstChar { it.uppercaseChar() }}"
        return try {
            obj.javaClass.getMethod(getter).invoke(obj)?.toString()
        } catch (_: Exception) {
            try { findField(obj.javaClass, name)?.apply { isAccessible = true }?.get(obj)?.toString() }
            catch (_: Exception) { null }
        }
    }

    private fun getBoolProp(obj: Any, name: String): Boolean? {
        val getter   = "get${name.replaceFirstChar { it.uppercaseChar() }}"
        val isGetter = "is${name.replaceFirstChar { it.uppercaseChar() }}"
        for (g in listOf(getter, isGetter)) {
            try { return obj.javaClass.getMethod(g).invoke(obj) as? Boolean } catch (_: Exception) {}
        }
        return try { findField(obj.javaClass, name)?.apply { isAccessible = true }?.get(obj) as? Boolean }
        catch (_: Exception) { null }
    }

    private fun findField(cls: Class<*>, name: String): java.lang.reflect.Field? {
        var c: Class<*>? = cls
        while (c != null && c != Any::class.java) {
            try { return c.getDeclaredField(name) } catch (_: NoSuchFieldException) {}
            c = c.superclass
        }
        return null
    }

    // --- NetworkHelper injection via Injekt ---
    // Called once per extension load. Injekt.addSingleton is idempotent — safe to call
    // repeatedly; later calls overwrite the prior registration with the same instance.

    private var networkHelperRegistered = false

    private fun logLoadFailure(name: String, e: Throwable) {
        val msg = generateSequence(e) { it.cause }
            .mapNotNull { it.message?.ifBlank { null } ?: it.javaClass.simpleName }
            .firstOrNull() ?: e.javaClass.simpleName
        Logger.w("ExtensionLoader", "Failed to load $name: $msg")
        var cause = e.cause
        while (cause != null) {
            Logger.w("ExtensionLoader", "  ↳ [${cause.javaClass.simpleName}] ${cause.message}")
            cause = cause.cause
        }
    }

    private fun injectNetworkHelper(classLoader: ClassLoader, context: Context) {
        if (networkHelperRegistered) return
        try {
            // Some extensions (e.g. Komga) inject Application to access SharedPreferences
            val app = context.applicationContext as? Application
            if (app != null) Injekt.addSingleton(app)
            Injekt.addSingleton(NetworkHelper(context))
            networkHelperRegistered = true
            Logger.i("ExtensionLoader", "Injekt: registered NetworkHelper + Application")
        } catch (e: Exception) {
            Logger.w("ExtensionLoader", "Injekt: failed to register NetworkHelper: ${e.message}")
        }
    }
}
