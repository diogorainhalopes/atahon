package eu.kanade.tachiyomi.source.model

import android.net.Uri
import eu.kanade.tachiyomi.network.ProgressListener

// Simplified Page — Flow/State tracking removed (not needed for source calling).
// Shape matches what extensions create and what SourceCaller serializes.
open class Page(
    val index: Int,
    val url: String = "",
    var imageUrl: String? = null,
    @Transient var uri: Uri? = null, // Deprecated but kept for extension compatibility
) : ProgressListener {

    val number: Int
        get() = index + 1

    override fun update(bytesRead: Long, contentLength: Long, done: Boolean) {
        // No-op — progress tracking handled by the reader, not the bridge
    }
}
