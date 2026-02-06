@rem Gradle wrapper for Windows. Run: gradlew.bat assembleDebug
@echo off
set DIRNAME=%~dp0
set JAR=%DIRNAME%gradle\wrapper\gradle-wrapper.jar
if not exist "%JAR%" (
  echo Missing %JAR%. Run: gradle wrapper
  exit /b 1
)
java -cp "%JAR%" org.gradle.wrapper.GradleWrapperMain %*
