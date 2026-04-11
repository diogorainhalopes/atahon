package com.atahon.extensionbridge

import java.util.concurrent.ConcurrentHashMap

/**
 * In-memory, thread-safe registry of all loaded extension APKs and their sources.
 * Populated at app startup by scanning the extensions directory, and updated
 * when extensions are installed/uninstalled at runtime.
 */
object ExtensionRegistry {

    private val extensionsByPkg = ConcurrentHashMap<String, ExtensionLoader.LoadedExtension>()
    private val sourcesById = ConcurrentHashMap<Long, ExtensionLoader.LoadedSource>()

    fun register(ext: ExtensionLoader.LoadedExtension) {
        extensionsByPkg[ext.pkgName] = ext
    
        Logger.i("ExtensionRegistry", "Registering extension ${ext.name} (${ext.pkgName})")
    
        for (source in ext.sources) {
            sourcesById[source.id] = source
            Logger.i("ExtensionRegistry", "Registered source ${source.name} id=${source.id} lang=${source.lang}")
        }
    }

    fun unregister(pkgName: String) {
        val ext = extensionsByPkg.remove(pkgName) ?: return
        for (source in ext.sources) {
            sourcesById.remove(source.id)
        }
        Logger.i("ExtensionRegistry", "Unregistered extension ${ext.name} (${ext.pkgName})")
    }

    fun getSource(sourceId: Long): ExtensionLoader.LoadedSource? = sourcesById[sourceId]

    fun getExtension(pkgName: String): ExtensionLoader.LoadedExtension? = extensionsByPkg[pkgName]

    fun getAllExtensions(): Collection<ExtensionLoader.LoadedExtension> = extensionsByPkg.values

    fun clear() {
        extensionsByPkg.clear()
        sourcesById.clear()
    }
}
