package com.manet.morse

import android.content.ClipboardManager
import android.content.Context
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.manet.morse.morse.MorseConverter
import com.manet.morse.morse.ValidationResult
import com.manet.morse.playback.MorsePlayback
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class MainUiState(
    val message: String = "",
    val morse: String = "",
    val soundEnabled: Boolean = true,
    val wpm: Int = 15,
    val isPlaying: Boolean = false,
    val signalOn: Boolean = false,
    val status: String = "",
    val statusError: Boolean = false
)

class MainViewModel(
    private val applicationContext: Context
) : ViewModel() {

    private val _uiState = MutableStateFlow(MainUiState())
    val uiState: StateFlow<MainUiState> = _uiState.asStateFlow()

    private val playback = MorsePlayback(
        scope = viewModelScope,
        mainScope = viewModelScope
    )

    companion object {
        const val WPM_MIN = 5
        const val WPM_MAX = 25
    }

    fun updateMessage(text: String) {
        _uiState.update { state ->
            val capped = text.take(MorseConverter.MAX_MESSAGE_LENGTH)
            val sanitized = capped.replace(Regex("[^A-Za-z0-9\\s]"), "")
            val morse = MorseConverter.textToMorse(sanitized)
            state.copy(
                message = capped,
                morse = morse
            )
        }
    }

    fun setSoundEnabled(enabled: Boolean) {
        _uiState.update { it.copy(soundEnabled = enabled) }
    }

    fun setWpm(wpm: Int) {
        _uiState.update { it.copy(wpm = wpm.coerceIn(WPM_MIN, WPM_MAX)) }
    }

    fun play() {
        val state = _uiState.value
        if (state.isPlaying) return
        val sanitized = when (val result = MorseConverter.validateInput(state.message)) {
            is ValidationResult.Invalid -> {
                _uiState.update {
                    it.copy(
                        status = applicationContext.getString(R.string.error_invalid_input),
                        statusError = true
                    )
                }
                return
            }
            is ValidationResult.Valid -> result.sanitized
        }
        val morse = MorseConverter.textToMorse(sanitized)
        if (morse.isEmpty()) {
            _uiState.update {
                it.copy(
                    status = applicationContext.getString(R.string.error_invalid_input),
                    statusError = true
                )
            }
            return
        }
        val unitMs = MorseConverter.wpmToUnitMs(state.wpm)
        val schedule = MorseConverter.buildSchedule(morse, unitMs)

        _uiState.update {
            it.copy(
                morse = morse,
                isPlaying = true,
                status = applicationContext.getString(R.string.status_sending),
                statusError = false
            )
        }

        viewModelScope.launch {
            playback.play(
                schedule = schedule,
                soundEnabled = state.soundEnabled,
                onSignalChange = { on ->
                    _uiState.update { it.copy(signalOn = on) }
                },
                onComplete = {
                    _uiState.update {
                        it.copy(
                            isPlaying = false,
                            signalOn = false,
                            status = applicationContext.getString(R.string.status_done)
                        )
                    }
                }
            )
        }
    }

    fun copyMorse() {
        val morse = _uiState.value.morse
        if (morse.isEmpty()) {
            _uiState.update {
                it.copy(
                    status = applicationContext.getString(R.string.error_nothing_to_copy),
                    statusError = true
                )
            }
            return
        }
        val clipboard = applicationContext.getSystemService(Context.CLIPBOARD_SERVICE) as? ClipboardManager
        if (clipboard != null) {
            clipboard.setPrimaryClip(android.content.ClipData.newPlainText("morse", morse))
            _uiState.update {
                it.copy(
                    status = applicationContext.getString(R.string.copy_success),
                    statusError = false
                )
            }
        }
    }

    fun clearStatus() {
        _uiState.update { it.copy(status = "", statusError = false) }
    }

    override fun onCleared() {
        playback.cancel()
    }
}
