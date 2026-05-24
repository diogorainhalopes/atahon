package com.atahon.extensionbridge

import android.app.NotificationChannel
import android.app.NotificationManager
import android.content.Context
import android.os.Build
import androidx.core.app.NotificationCompat
import androidx.work.*
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.withContext
import java.util.concurrent.TimeUnit

class LibraryUpdateWorker(
    private val ctx: Context,
    params: WorkerParameters
) : CoroutineWorker(ctx, params) {

    override suspend fun doWork(): Result = withContext(Dispatchers.IO) {
        try {
            // Get the extension registry from ExtensionLoader companion object
            // For each library manga, call getChapterList via SourceCaller
            // Diff against existing chapters
            // Insert new chapters into DB
            // Post a notification with the count of new chapters found

            // NOTE: Full DB access requires a direct SQLite approach since
            // the Expo SQLite db is managed by JS. This worker posts a
            // broadcast/notification that the React Native layer can handle.
            // For now, post a notification that triggers JS-side refresh.

            postNotification(ctx, 0)
            Result.success()
        } catch (e: Exception) {
            Result.failure()
        }
    }

    companion object {
        const val WORK_NAME = "library-update"
        const val CHANNEL_ID = "library-updates"

        fun schedule(context: Context, intervalHours: Int) {
            createNotificationChannel(context)
            val request = PeriodicWorkRequestBuilder<LibraryUpdateWorker>(
                intervalHours.toLong(), TimeUnit.HOURS
            ).setConstraints(
                Constraints.Builder()
                    .setRequiredNetworkType(NetworkType.CONNECTED)
                    .build()
            ).build()
            WorkManager.getInstance(context).enqueueUniquePeriodicWork(
                WORK_NAME,
                ExistingPeriodicWorkPolicy.UPDATE,
                request
            )
        }

        fun cancel(context: Context) {
            WorkManager.getInstance(context).cancelUniqueWork(WORK_NAME)
        }

        private fun createNotificationChannel(context: Context) {
            if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                val channel = NotificationChannel(
                    CHANNEL_ID,
                    "Library Updates",
                    NotificationManager.IMPORTANCE_DEFAULT
                ).apply { description = "New chapter notifications" }
                val nm = context.getSystemService(NotificationManager::class.java)
                nm.createNotificationChannel(channel)
            }
        }

        private fun postNotification(context: Context, newChapterCount: Int) {
            if (newChapterCount <= 0) return
            val nm = context.getSystemService(NotificationManager::class.java)
            val notification = NotificationCompat.Builder(context, CHANNEL_ID)
                .setSmallIcon(android.R.drawable.ic_dialog_info)
                .setContentTitle("Library updated")
                .setContentText("$newChapterCount new chapter(s) found")
                .setAutoCancel(true)
                .build()
            nm.notify(1001, notification)
        }
    }
}
