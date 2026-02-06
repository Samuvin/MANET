package com.manet.morse.playback

import android.media.AudioAttributes
import android.media.AudioFormat
import android.media.AudioTrack
import com.manet.morse.morse.OnOff
import com.manet.morse.morse.SignalSegment
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.Job
import kotlinx.coroutines.delay
import kotlinx.coroutines.isActive
import kotlinx.coroutines.launch
import kotlinx.coroutines.withContext
import kotlin.math.PI
import kotlin.math.sin

/**
 * Plays back a Morse schedule: audio beeps (sine wave) and callbacks for visual sync.
 * Runs on a background scope; visual/onComplete callbacks are invoked on the main thread.
 */
class MorsePlayback(
    private val scope: CoroutineScope,
    private val mainScope: CoroutineScope
) {
    companion object {
        const val SAMPLE_RATE = 44100
        const val FREQ_HZ = 700
    }

    private var job: Job? = null

    /**
     * Plays the given schedule. For each ON segment plays a tone; for each segment invokes
     * [onSignalChange] (on/off). Calls [onComplete] when done. Sound is skipped if [soundEnabled] is false.
     */
    fun play(
        schedule: List<SignalSegment>,
        soundEnabled: Boolean,
        onSignalChange: (Boolean) -> Unit,
        onComplete: () -> Unit
    ) {
        cancel()
        if (schedule.isEmpty()) {
            mainScope.launch { onComplete() }
            return
        }
        job = scope.launch {
            try {
                for (segment in schedule) {
                    if (!scope.isActive) break
                    when (segment.type) {
                        is OnOff.ON -> {
                            mainScope.launch { onSignalChange(true) }
                            if (soundEnabled) {
                                playTone(segment.durationMs)
                            } else {
                                delay(segment.durationMs)
                            }
                            if (!scope.isActive) break
                        }
                        is OnOff.OFF -> {
                            mainScope.launch { onSignalChange(false) }
                            delay(segment.durationMs)
                        }
                    }
                }
            } finally {
                mainScope.launch {
                    onSignalChange(false)
                    onComplete()
                }
            }
        }
    }

    fun cancel() {
        job?.cancel()
        job = null
    }

    private suspend fun playTone(durationMs: Long) = withContext(Dispatchers.IO) {
        val numSamples = (SAMPLE_RATE * durationMs / 1000).toInt()
        val buffer = ShortArray(numSamples)
        val angularFreq = 2.0 * PI * FREQ_HZ / SAMPLE_RATE
        for (i in buffer.indices) {
            buffer[i] = (sin(angularFreq * i) * Short.MAX_VALUE * 0.2).toInt().toShort()
        }
        val minBufSize = AudioTrack.getMinBufferSize(SAMPLE_RATE, AudioFormat.CHANNEL_OUT_MONO, AudioFormat.ENCODING_PCM_16BIT)
        val bufSize = minOf(minBufSize.coerceAtLeast(numSamples * 2), numSamples * 2)
        val track = AudioTrack.Builder()
            .setAudioAttributes(
                AudioAttributes.Builder()
                    .setUsage(AudioAttributes.USAGE_MEDIA)
                    .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
                    .build()
            )
            .setAudioFormat(
                AudioFormat.Builder()
                    .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                    .setSampleRate(SAMPLE_RATE)
                    .setChannelMask(AudioFormat.CHANNEL_OUT_MONO)
                    .build()
            )
            .setBufferSizeInBytes(bufSize)
            .setTransferMode(AudioTrack.MODE_STATIC)
            .build()
        try {
            track.write(buffer, 0, buffer.size)
            track.play()
            delay(durationMs)
            track.stop()
        } finally {
            track.release()
        }
    }
}
