package com.manet.morse.morse

/**
 * Morse code mapping and conversion for MANET radio signals.
 * Pure Kotlin; no Android dependency. Ported from manet-web/morse.js.
 */
object MorseConverter {

    const val MAX_MESSAGE_LENGTH: Int = 500
    private const val DOT = '.'
    private const val DASH = '-'

    private val MORSE_MAP: Map<Char, String> = mapOf(
        'A' to ".-", 'B' to "-...", 'C' to "-.-.", 'D' to "-..", 'E' to ".", 'F' to "..-.",
        'G' to "--.", 'H' to "....", 'I' to "..", 'J' to ".---", 'K' to "-.-", 'L' to ".-..",
        'M' to "--", 'N' to "-.", 'O' to "---", 'P' to ".--.", 'Q' to "--.-", 'R' to ".-.",
        'S' to "...", 'T' to "-", 'U' to "..-", 'V' to "...-", 'W' to ".--", 'X' to "-..-",
        'Y' to "-.--", 'Z' to "--..",
        '0' to "-----", '1' to ".----", '2' to "..---", '3' to "...--", '4' to "....-",
        '5' to ".....", '6' to "-....", '7' to "--...", '8' to "---..", '9' to "----."
    )

    /** Allowed characters: A-Z, a-z, 0-9, space. */
    private val ALLOWED_PATTERN = Regex("^[A-Za-z0-9\\s]*$")

    /**
     * Converts a single character to its Morse sequence, or empty string if unsupported.
     */
    fun charToMorse(c: Char): String =
        MORSE_MAP[c.uppercaseChar()] ?: ""

    /**
     * Converts plain text to Morse code string (dots, dashes, spaces).
     * Letters separated by single space; words by triple space. Unsupported characters skipped.
     */
    fun textToMorse(text: String?): String {
        if (text.isNullOrBlank()) return ""
        val trimmed = text.trim()
        if (trimmed.isEmpty()) return ""
        val words = trimmed.split(Regex("\\s+"))
        return words.mapNotNull { word ->
            word.mapNotNull { c ->
                charToMorse(c).takeIf { it.isNotEmpty() }
            }.joinToString(" ")
        }.joinToString("   ")
    }

    /**
     * Builds a playback schedule (on/off segments) with given unit duration in ms.
     * Standard timing: dot=1, dash=3, intra-letter gap=1, inter-letter=3, inter-word=7.
     */
    fun buildSchedule(morse: String?, unitMs: Long): List<SignalSegment> {
        if (morse.isNullOrEmpty() || unitMs <= 0L) return emptyList()
        val schedule = mutableListOf<SignalSegment>()
        var i = 0
        while (i < morse.length) {
            when (morse[i]) {
                DOT -> {
                    schedule.add(SignalSegment(OnOff.ON, unitMs))
                    schedule.add(SignalSegment(OnOff.OFF, unitMs))
                    i++
                }
                DASH -> {
                    schedule.add(SignalSegment(OnOff.ON, 3 * unitMs))
                    schedule.add(SignalSegment(OnOff.OFF, unitMs))
                    i++
                }
                ' ' -> {
                    var spaces = 0
                    while (i < morse.length && morse[i] == ' ') {
                        spaces++
                        i++
                    }
                    schedule.add(
                        SignalSegment(OnOff.OFF, if (spaces >= 3) 7 * unitMs else 3 * unitMs)
                    )
                }
                else -> i++
            }
        }
        return schedule
    }

    /**
     * WPM to unit duration in ms. Standard formula: unit = 1200 / wpm.
     * Clamped to reasonable range (5..40 WPM).
     */
    fun wpmToUnitMs(wpm: Int): Long {
        val safe = wpm.coerceIn(5, 40)
        return (1200 / safe).toLong()
    }

    /**
     * Validates and sanitizes user input: trim, max length, allowed chars only.
     */
    fun validateInput(input: String?, maxLength: Int = MAX_MESSAGE_LENGTH): ValidationResult {
        val maxLen = if (maxLength > 0) maxLength else MAX_MESSAGE_LENGTH
        if (input == null) return ValidationResult.Invalid
        val trimmed = input.trim()
        if (trimmed.isEmpty()) return ValidationResult.Invalid
        val capped = if (trimmed.length > maxLen) trimmed.take(maxLen) else trimmed
        val sanitized = capped.replace(Regex("[^A-Za-z0-9\\s]"), "")
        if (sanitized.isEmpty()) return ValidationResult.Invalid
        return ValidationResult.Valid(sanitized)
    }
}

/** Segment of the playback schedule: signal on or off for a duration. */
data class SignalSegment(val type: OnOff, val durationMs: Long)

sealed class OnOff {
    data object ON : OnOff()
    data object OFF : OnOff()
}

sealed class ValidationResult {
    data object Invalid : ValidationResult()
    data class Valid(val sanitized: String) : ValidationResult()
}
