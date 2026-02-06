package com.manet.morse

import android.os.Bundle
import androidx.activity.ComponentActivity
import androidx.activity.compose.setContent
import androidx.activity.enableEdgeToEdge
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.Arrangement
import androidx.compose.foundation.layout.Box
import androidx.compose.foundation.layout.Column
import androidx.compose.foundation.layout.Row
import androidx.compose.foundation.layout.Spacer
import androidx.compose.foundation.layout.fillMaxSize
import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.foundation.layout.padding
import androidx.compose.foundation.layout.size
import androidx.compose.foundation.layout.width
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.text.KeyboardOptions
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.Button
import androidx.compose.material3.ButtonDefaults
import androidx.compose.material3.Checkbox
import androidx.compose.material3.MaterialTheme
import androidx.compose.material3.darkColorScheme
import androidx.compose.material3.OutlinedTextField
import androidx.compose.material3.Slider
import androidx.compose.material3.Surface
import androidx.compose.material3.Text
import androidx.compose.material3.TextButton
import androidx.compose.runtime.Composable
import androidx.compose.runtime.collectAsState
import androidx.compose.runtime.getValue
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.text.input.KeyboardCapitalization
import androidx.compose.ui.unit.dp
import androidx.lifecycle.ViewModel
import androidx.lifecycle.ViewModelProvider
import androidx.lifecycle.viewmodel.compose.viewModel

class MainActivity : ComponentActivity() {
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        enableEdgeToEdge()
        setContent {
            val viewModel: MainViewModel = viewModel(
                factory = object : ViewModelProvider.Factory {
                    @Suppress("UNCHECKED_CAST")
                    override fun <T : ViewModel> create(modelClass: Class<T>): T {
                        return MainViewModel(applicationContext) as T
                    }
                }
            )
            MaterialTheme(colorScheme = manetDarkColorScheme()) {
                MainScreen(viewModel = viewModel)
            }
        }
    }
}

private fun manetDarkColorScheme() = darkColorScheme().copy(
    background = Color(0xFF0F1419),
    surface = Color(0xFF1A2332),
    onBackground = Color(0xFFE6EDF3),
    onSurface = Color(0xFFE6EDF3),
    primary = Color(0xFF238636),
    onPrimary = Color.White,
    outline = Color(0xFF2D3A4D),
    error = Color(0xFFF85149),
    onError = Color.White
)

@Composable
fun MainScreen(viewModel: MainViewModel) {
    val state by viewModel.uiState.collectAsState()
    val scrollState = rememberScrollState()

    Column(
        modifier = Modifier
            .fillMaxSize()
            .verticalScroll(scrollState)
            .padding(24.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = stringResource(R.string.app_name),
            style = MaterialTheme.typography.headlineMedium
        )
        Text(
            text = "Type a message and send it as radio signals (Morse code)",
            style = MaterialTheme.typography.bodyMedium,
            color = Color(0xFF8B949E)
        )
        Spacer(modifier = Modifier.height(8.dp))

        OutlinedTextField(
            value = state.message,
            onValueChange = viewModel::updateMessage,
            label = { Text(stringResource(R.string.message_label)) },
            placeholder = { Text(stringResource(R.string.message_hint)) },
            modifier = Modifier.fillMaxWidth(),
            maxLines = 4,
            singleLine = false,
            keyboardOptions = KeyboardOptions(capitalization = KeyboardCapitalization.Characters)
        )
        Text(
            text = stringResource(R.string.max_chars_hint),
            style = MaterialTheme.typography.bodySmall,
            color = Color(0xFF8B949E)
        )

        Row(
            modifier = Modifier.fillMaxWidth(),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Checkbox(
                    checked = state.soundEnabled,
                    onCheckedChange = viewModel::setSoundEnabled
                )
                Text(stringResource(R.string.sound_label))
            }
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(stringResource(R.string.wpm_label))
                Slider(
                    value = state.wpm.toFloat(),
                    onValueChange = { viewModel.setWpm(it.toInt()) },
                    valueRange = MainViewModel.WPM_MIN.toFloat()..MainViewModel.WPM_MAX.toFloat(),
                    steps = MainViewModel.WPM_MAX - MainViewModel.WPM_MIN - 1,
                    modifier = Modifier.width(120.dp)
                )
                Text("${state.wpm} WPM")
            }
        }

        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Button(
                onClick = viewModel::play,
                enabled = !state.isPlaying,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF238636))
            ) {
                Text(stringResource(R.string.play_button))
            }
            Button(
                onClick = viewModel::copyMorse,
                colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF30363D))
            ) {
                Text(stringResource(R.string.copy_morse))
            }
        }

        Text(stringResource(R.string.signal_label), style = MaterialTheme.typography.labelMedium)
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(
                    if (state.signalOn) Color(0xFF58A6FF)
                    else Color(0xFF21262D)
                )
        )

        Text(stringResource(R.string.morse_code_label), style = MaterialTheme.typography.labelMedium)
        Surface(
            modifier = Modifier.fillMaxWidth(),
            shape = MaterialTheme.shapes.medium,
            color = Color(0xFF1A2332)
        ) {
            Text(
                text = state.morse.ifEmpty { " " },
                modifier = Modifier.padding(12.dp),
                style = MaterialTheme.typography.bodyMedium,
                fontFamily = androidx.compose.ui.text.font.FontFamily.Monospace
            )
        }

        if (state.status.isNotEmpty()) {
            Text(
                text = state.status,
                style = MaterialTheme.typography.bodySmall,
                color = if (state.statusError) MaterialTheme.colorScheme.error else Color(0xFF8B949E)
            )
        }

        TextButton(onClick = viewModel::clearStatus) {
            Text(stringResource(R.string.clear_status))
        }

        Spacer(modifier = Modifier.height(8.dp))
        // Placeholder for future MANET: send Morse to another device via WiFi Direct / Bluetooth.
        Button(
            onClick = { },
            enabled = false,
            colors = ButtonDefaults.buttonColors(containerColor = Color(0xFF30363D))
        ) {
            Text(stringResource(R.string.send_to_device))
        }
    }
}
