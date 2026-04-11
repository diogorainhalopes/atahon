package com.atahon.extensionbridge

import okhttp3.OkHttpClient
import java.util.concurrent.TimeUnit

class NetworkHelper {
    val client: OkHttpClient = OkHttpClient.Builder()
        .connectTimeout(30, TimeUnit.SECONDS)
        .readTimeout(30, TimeUnit.SECONDS)
        .writeTimeout(30, TimeUnit.SECONDS)
        .build()

    val cloudflareClient: OkHttpClient = client.newBuilder().build()
}
