package com.atahon.extensionbridge

import android.util.Log

object Logger {
    private const val TAG = "Atahon"

    fun v(module: String, msg: String) = Log.v(TAG, "[$module] $msg")
    fun d(module: String, msg: String) = Log.d(TAG, "[$module] $msg")
    fun i(module: String, msg: String) = Log.i(TAG, "[$module] $msg")
    fun w(module: String, msg: String, tr: Throwable? = null) =
        if (tr != null) Log.w(TAG, "[$module] $msg", tr) else Log.w(TAG, "[$module] $msg")
    fun e(module: String, msg: String, tr: Throwable? = null) =
        if (tr != null) Log.e(TAG, "[$module] $msg", tr) else Log.e(TAG, "[$module] $msg")
}
