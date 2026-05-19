package com.atahon.extensionbridge

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.Service
import android.content.Context
import android.content.Intent
import android.os.IBinder
import androidx.core.app.NotificationCompat
import androidx.core.app.NotificationManagerCompat

class DownloadForegroundService : Service() {

    override fun onBind(intent: Intent?): IBinder? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        val total = intent?.getIntExtra("total", 0) ?: 0
        ensureChannel(this)
        if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.Q) {
            startForeground(
                NOTIFICATION_ID,
                buildNotification(this, 0, total, "Starting…"),
                android.content.pm.ServiceInfo.FOREGROUND_SERVICE_TYPE_DATA_SYNC,
            )
        } else {
            startForeground(NOTIFICATION_ID, buildNotification(this, 0, total, "Starting…"))
        }
        return START_NOT_STICKY
    }

    companion object {
        private const val NOTIFICATION_ID = 1001
        private const val CHANNEL_ID = "atahon_downloads"

        fun start(context: Context, total: Int) {
            val intent = Intent(context, DownloadForegroundService::class.java)
                .putExtra("total", total)
            context.startForegroundService(intent)
        }

        fun update(context: Context, completed: Int, total: Int, chapterName: String) {
            ensureChannel(context)
            NotificationManagerCompat.from(context)
                .notify(NOTIFICATION_ID, buildNotification(context, completed, total, chapterName))
        }

        fun stop(context: Context) {
            NotificationManagerCompat.from(context).cancel(NOTIFICATION_ID)
            context.stopService(Intent(context, DownloadForegroundService::class.java))
        }

        private fun ensureChannel(context: Context) {
            val nm = context.getSystemService(NotificationManager::class.java)
            if (nm.getNotificationChannel(CHANNEL_ID) != null) return
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Downloads",
                NotificationManager.IMPORTANCE_LOW
            ).apply {
                description = "Manga chapter download progress"
                setSound(null, null)
            }
            nm.createNotificationChannel(channel)
        }

        private fun buildNotification(
            context: Context,
            completed: Int,
            total: Int,
            chapterName: String,
        ) = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(android.R.drawable.stat_sys_download)
            .setContentTitle("Downloading manga")
            .setContentText(
                if (total > 0) "Chapter $completed of $total — $chapterName" else "Starting…"
            )
            .setProgress(total, completed, total == 0)
            .setOngoing(true)
            .setSilent(true)
            .build()
    }
}
