# MANET Morse Radio (Android)

Android app (Kotlin) that replicates the MANET Morse Radio web flow: enter a message, convert to Morse code, play as radio signals (audio + visual indicator).

## Requirements

- **JDK 17** (required by the project)
- **Android SDK** (command-line tools or via Android Studio)
- Min SDK 24, target SDK 34

## Run without Android Studio (command line)

1. **Install Android command-line tools** (if you don’t have Android Studio):
   - Download from [developer.android.com/studio#command-tools](https://developer.android.com/studio#command-tools)
   - Unzip to a folder (e.g. `~/android-sdk`).

2. **Set `ANDROID_HOME`** (required for builds):
   ```bash
   export ANDROID_HOME=~/android-sdk   # or your SDK path
   export PATH=$PATH:$ANDROID_HOME/cmdline-tools/latest/bin:$ANDROID_HOME/platform-tools
   ```

3. **Accept licenses and install a platform** (one-time):
   ```bash
   sdkmanager --sdk_root=$ANDROID_HOME "platform-tools" "platforms;android-34" "build-tools;34.0.0"
   sdkmanager --sdk_root=$ANDROID_HOME --licenses
   ```

4. **Build the app** (from the `manet-android` directory):
   ```bash
   ./gradlew assembleDebug
   ```
   APK output: `app/build/outputs/apk/debug/app-debug.apk`

5. **Install and run on a device or emulator**:
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   adb shell am start -n com.manet.morse/.MainActivity
   ```
   Use an emulator: create one in Android Studio or with `avdmanager`, then start it and use the same `adb install` / `adb shell am start` commands.

## Using Android Studio

Open the `manet-android` folder in Android Studio. Use Run (green play) or **Build → Build Bundle(s) / APK(s) → Build APK(s)**. The project already includes the Gradle wrapper (`gradlew` / `gradlew.bat`), so no extra setup is needed.

## Unit tests

```bash
./gradlew testDebugUnitTest
```

## Structure

- `app/src/main/java/com/manet/morse/`
  - `MainActivity.kt` – Compose UI
  - `MainViewModel.kt` – state and actions
  - `morse/MorseConverter.kt` – Morse mapping, `textToMorse`, `buildSchedule`, `validateInput`, `wpmToUnitMs`
  - `playback/MorsePlayback.kt` – schedule playback with AudioTrack and visual callbacks

The "Send to device" button is a placeholder for future MANET integration (e.g. WiFi Direct / Bluetooth).
