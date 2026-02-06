package com.manet.morse.morse

import org.junit.Assert.assertEquals
import org.junit.Assert.assertTrue
import org.junit.Test

class MorseConverterTest {

    @Test
    fun textToMorse_sos_returnsThreeShortThreeLongThreeShort() {
        assertEquals("... --- ...", MorseConverter.textToMorse("SOS"))
    }

    @Test
    fun textToMorse_emptyOrBlank_returnsEmpty() {
        assertEquals("", MorseConverter.textToMorse(""))
        assertEquals("", MorseConverter.textToMorse("   "))
        assertEquals("", MorseConverter.textToMorse(null))
    }

    @Test
    fun textToMorse_twoWords_hasTripleSpaceBetween() {
        val result = MorseConverter.textToMorse("S O S")
        assertTrue(result.contains("   "))
    }

    @Test
    fun validateInput_empty_returnsInvalid() {
        val result = MorseConverter.validateInput("")
        assertTrue(result is ValidationResult.Invalid)
    }

    @Test
    fun validateInput_whitespaceOnly_returnsInvalid() {
        val result = MorseConverter.validateInput("   ")
        assertTrue(result is ValidationResult.Invalid)
    }

    @Test
    fun validateInput_validText_returnsValidWithSanitized() {
        val result = MorseConverter.validateInput("Hello")
        assertTrue(result is ValidationResult.Valid)
        assertEquals("Hello", (result as ValidationResult.Valid).sanitized)
    }

    @Test
    fun validateInput_invalidChars_stripsThem() {
        val result = MorseConverter.validateInput("Hi!")
        assertTrue(result is ValidationResult.Valid)
        assertEquals("Hi", (result as ValidationResult.Valid).sanitized)
    }

    @Test
    fun validateInput_tooLong_capsToMax() {
        val long = "a".repeat(600)
        val result = MorseConverter.validateInput(long)
        assertTrue(result is ValidationResult.Valid)
        assertEquals(500, (result as ValidationResult.Valid).sanitized.length)
    }

    @Test
    fun buildSchedule_emptyMorse_returnsEmptyList() {
        assertTrue(MorseConverter.buildSchedule("", 50L).isEmpty())
        assertTrue(MorseConverter.buildSchedule(null, 50L).isEmpty())
    }

    @Test
    fun buildSchedule_oneDot_hasOnThenOff() {
        val schedule = MorseConverter.buildSchedule(".", 100L)
        assertEquals(2, schedule.size)
        assertTrue(schedule[0].type is OnOff.ON)
        assertTrue(schedule[1].type is OnOff.OFF)
    }

    @Test
    fun buildSchedule_oneDash_onDurationIsThreeUnits() {
        val schedule = MorseConverter.buildSchedule("-", 100L)
        assertEquals(2, schedule.size)
        assertEquals(300L, schedule[0].durationMs)
    }

    @Test
    fun wpmToUnitMs_clampedInRange() {
        val u15 = MorseConverter.wpmToUnitMs(15)
        assertTrue(u15 > 0)
        assertEquals(80L, u15)
        assertTrue(MorseConverter.wpmToUnitMs(5) >= 30L)
        assertTrue(MorseConverter.wpmToUnitMs(40) <= 240L)
    }
}
